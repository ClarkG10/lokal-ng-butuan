import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { SeriesPoint } from "@/features/analytics/hooks";

export function TrendChart({
  data,
  color = "#F4D03F",
  height = 240,
}: {
  data: SeriesPoint[];
  color?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.5} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} stroke="#6B7280" />
        <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="#6B7280" />
        <Tooltip
          cursor={{ stroke: "#E5E7EB" }}
          contentStyle={{
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            fontSize: 12,
            boxShadow: "0 6px 20px rgb(17 24 39 / 0.06)",
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          fillOpacity={1}
          fill="url(#trendFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
