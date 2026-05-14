import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/PageHeader";
import { useAdminSurveys, useSurveyResponses, type SurveyResponse } from "@/features/surveys/hooks";
import { formatDateTime } from "@/lib/utils";

// Fix Leaflet default marker icons broken by Vite bundling
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/* A tiny helper that re-fits map bounds whenever displayed pins change */
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], 13);
    } else {
      map.fitBounds(L.latLngBounds(positions), { padding: [48, 48] });
    }
  }, [map, positions]);
  return null;
}

/* ── Main page ─────────────────────────────────────────────── */
export default function AdminSurveyMapPage() {
  const { data: surveys, isLoading: surveysLoading } = useAdminSurveys();
  const [selectedSurveyId, setSelectedSurveyId] = useState<number | "all">("all");

  // Fetch responses for the chosen survey (or all surveys' responses combined)
  const targetId = selectedSurveyId === "all" ? undefined : selectedSurveyId;
  const { data: singleResponses } = useSurveyResponses(targetId);

  // For "all surveys" mode, fetch responses for each survey and flatten
  const [allResponses, setAllResponses] = useState<SurveyResponse[]>([]);
  useEffect(() => {
    if (selectedSurveyId !== "all" || !surveys?.length) {
      setAllResponses([]);
      return;
    }
    // Kick off individual fetches in parallel
    Promise.all(
      surveys.map((s) =>
        fetch(
          `${(import.meta.env.VITE_API_BASE as string) ?? "http://localhost:8000/api/v1"}/admin/surveys/${s.id}/responses`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}`,
            },
          }
        )
          .then((r) => r.json())
          .then((j: { data: SurveyResponse[] }) => j.data ?? [])
          .catch(() => [] as SurveyResponse[])
      )
    ).then((nested) => setAllResponses(nested.flat()));
  }, [selectedSurveyId, surveys]);

  const responses: SurveyResponse[] =
    selectedSurveyId === "all" ? allResponses : (singleResponses ?? []);

  // Only responses that have lat/lng
  const geoResponses = useMemo(
    () => responses.filter((r) => r.latitude != null && r.longitude != null),
    [responses]
  );

  const positions = useMemo(
    () => geoResponses.map((r) => [r.latitude!, r.longitude!] as [number, number]),
    [geoResponses]
  );

  // Butuan City center (default)
  const center: [number, number] = [8.9475, 125.5406];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Response Map"
        description="Geographic view of where survey responses were submitted."
        actions={
          <Button variant="outline" asChild>
            <Link to="/admin/surveys"><ArrowLeft className="size-4" /> Back to surveys</Link>
          </Button>
        }
      />

      {/* Filter bar */}
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <label className="text-sm font-medium">Filter by survey</label>
        <select
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/40"
          value={selectedSurveyId}
          onChange={(e) =>
            setSelectedSurveyId(e.target.value === "all" ? "all" : parseInt(e.target.value, 10))
          }
        >
          <option value="all">All surveys</option>
          {surveysLoading && <option disabled>Loading…</option>}
          {surveys?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
        <span className="ml-auto text-sm text-muted-foreground">
          {geoResponses.length} of {responses.length} response{responses.length !== 1 ? "s" : ""} have location data
        </span>
      </Card>

      {/* Map */}
      <Card className="overflow-hidden p-0">
        <MapContainer
          center={center}
          zoom={12}
          className="z-0 h-[600px] w-full"
          scrollWheelZoom
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <FitBounds positions={positions} />
          {geoResponses.map((r) => (
            <Marker key={r.id} position={[r.latitude!, r.longitude!]}>
              <Popup maxWidth={280}>
                <div className="space-y-1.5 py-1 text-sm">
                  <p className="font-semibold text-foreground">
                    {r.respondent
                      ? [r.respondent.first_name, r.respondent.last_name].join(" ")
                      : "Anonymous"}
                  </p>
                  {r.respondent?.belongs_to && (
                    <p className="text-xs text-muted-foreground">{r.respondent.belongs_to}</p>
                  )}
                  {r.location_name && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" />
                      {r.location_name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {r.submitted_at ? formatDateTime(r.submitted_at) : "Unknown time"}
                  </p>
                  <div className="flex gap-1.5 flex-wrap pt-1">
                    {r.via_qr && <Badge tone="upcoming" className="text-xs">QR scan</Badge>}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Card>

      {geoResponses.length === 0 && !surveysLoading && (
        <p className="text-center text-sm text-muted-foreground">
          No responses with location data yet. Location is captured automatically when respondents allow it.
        </p>
      )}
    </div>
  );
}
