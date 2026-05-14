import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PublicShell } from "@/components/layout/PublicShell";
import { AdminShell } from "@/components/layout/AdminShell";
import { AuthProvider } from "@/features/auth/AuthContext";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/contexts/LanguageContext";
import HomePage from "./HomePage";
import PlaceholderPage from "./PlaceholderPage";
import EventsPage from "./EventsPage";
import EventDetailPage from "./EventDetailPage";
import EventSurveysPage from "./EventSurveysPage";
import SurveysPage from "./SurveysPage";
import SurveyRunnerPage from "./SurveyRunnerPage";
import AnnouncementsPage from "./AnnouncementsPage";
import AnnouncementDetailPage from "./AnnouncementDetailPage";
import GalleryPage from "./GalleryPage";

import LoginPage from "./admin/LoginPage";
import DashboardPage from "./admin/DashboardPage";
import AdminEventsPage from "./admin/events/AdminEventsPage";
import AdminEventEditPage from "./admin/events/AdminEventEditPage";
import AdminSurveysPage from "./admin/surveys/AdminSurveysPage";
import AdminSurveyBuilderPage from "./admin/surveys/AdminSurveyBuilderPage";
import AdminSurveyResponsesPage from "./admin/surveys/AdminSurveyResponsesPage";
import AdminSurveyMapPage from "./admin/surveys/AdminSurveyMapPage";
import AdminAnnouncementsPage from "./admin/AdminAnnouncementsPage";
import AdminGalleryPage from "./admin/AdminGalleryPage";
import AdminCommentsPage from "./admin/AdminCommentsPage";
import AdminMasterlistsPage from "./admin/AdminMasterlistsPage";
import AdminAnalyticsPage from "./admin/AdminAnalyticsPage";
import AdminUsersPage from "./admin/AdminUsersPage";
import AdminSettingsPage from "./admin/AdminSettingsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
  },
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "events", element: <EventsPage /> },
      { path: "events/:slug", element: <EventDetailPage /> },
      { path: "events/:slug/surveys", element: <EventSurveysPage /> },
      { path: "surveys", element: <SurveysPage /> },
      { path: "surveys/:slug", element: <SurveyRunnerPage /> },
      { path: "announcements", element: <AnnouncementsPage /> },
      { path: "announcements/:slug", element: <AnnouncementDetailPage /> },
      { path: "gallery", element: <GalleryPage /> },
      { path: "*", element: <PlaceholderPage title="Page not found" description="The page you're looking for doesn't exist." /> },
    ],
  },
  { path: "/admin/login", element: <LoginPage /> },
  {
    path: "/admin",
    element: (
      <RequireAuth>
        <AdminShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "events", element: <RequireAuth roles={["super_admin", "content_manager"]}><AdminEventsPage /></RequireAuth> },
      { path: "events/:id", element: <RequireAuth roles={["super_admin", "content_manager"]}><AdminEventEditPage /></RequireAuth> },
      { path: "surveys", element: <RequireAuth roles={["super_admin", "content_manager"]}><AdminSurveysPage /></RequireAuth> },
      { path: "surveys/map", element: <RequireAuth roles={["super_admin", "content_manager", "analytics_viewer"]}><AdminSurveyMapPage /></RequireAuth> },
      { path: "surveys/:id", element: <RequireAuth roles={["super_admin", "content_manager"]}><AdminSurveyBuilderPage /></RequireAuth> },
      { path: "surveys/:id/responses", element: <RequireAuth roles={["super_admin", "content_manager"]}><AdminSurveyResponsesPage /></RequireAuth> },
      { path: "announcements", element: <RequireAuth roles={["super_admin", "content_manager"]}><AdminAnnouncementsPage /></RequireAuth> },
      { path: "gallery", element: <RequireAuth roles={["super_admin", "content_manager"]}><AdminGalleryPage /></RequireAuth> },
      { path: "comments", element: <RequireAuth roles={["super_admin", "content_manager", "moderator"]}><AdminCommentsPage /></RequireAuth> },
      { path: "masterlists", element: <RequireAuth roles={["super_admin", "content_manager", "analytics_viewer"]}><AdminMasterlistsPage /></RequireAuth> },
      { path: "analytics", element: <AdminAnalyticsPage /> },
      { path: "users", element: <RequireAuth roles={["super_admin"]}><AdminUsersPage /></RequireAuth> },
      { path: "settings", element: <RequireAuth><AdminSettingsPage /></RequireAuth> },
    ],
  },
]);

export function App() {
  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
}
