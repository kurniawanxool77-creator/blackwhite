import { lazy, Suspense, type ComponentType } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LiveSync } from "@/components/ui/LiveSync";
import { ErrorBoundary, NotFoundCard, PageLoader } from "@/src/components/RouteState";
import { LandingLayout } from "@/src/layouts/LandingLayout";
import { PanelLayout } from "@/src/layouts/PanelLayout";
import { UserLayout } from "@/src/layouts/UserLayout";
import { AuthProvider } from "@/src/lib/auth-client";

const load = <T extends Record<string, ComponentType<never>>>(
  importer: () => Promise<T>,
  pick: keyof T,
) => lazy(() => importer().then((m) => ({ default: m[pick] as ComponentType<Record<string, unknown>> })));

const HomePage = load(() => import("@/src/pages/landing/HomePage"), "HomePage");
const EventsPage = load(() => import("@/src/pages/landing/EventsPage"), "EventsPage");
const EventDetailPage = load(() => import("@/src/pages/landing/EventDetailPage"), "EventDetailPage");
const BlogPage = load(() => import("@/src/pages/landing/BlogPage"), "BlogPage");
const ArticlePage = load(() => import("@/src/pages/landing/ArticlePage"), "ArticlePage");
const GalleryPage = load(() => import("@/src/pages/landing/GalleryPage"), "GalleryPage");
const AboutPage = load(() => import("@/src/pages/landing/AboutPage"), "AboutPage");
const ContactPage = load(() => import("@/src/pages/landing/ContactPage"), "ContactPage");
const LoginPage = load(() => import("@/src/pages/landing/LoginPage"), "LoginPage");
const RegisterPage = load(() => import("@/src/pages/landing/RegisterPage"), "RegisterPage");
const CertificatePage = load(() => import("@/src/pages/landing/CertificatePage"), "CertificatePage");

const UserDashboardPage = load(() => import("@/src/pages/user/UserDashboardPage"), "UserDashboardPage");
const TicketPage = load(() => import("@/src/pages/user/TicketPage"), "TicketPage");
const QuizPage = load(() => import("@/src/pages/user/QuizPage"), "QuizPage");
const UserAccountPage = load(() => import("@/src/pages/user/UserAccountPage"), "UserAccountPage");

const StaffLoginPage = lazy(() => import("@/src/pages/shared/StaffLoginPage").then((m) => ({ default: m.StaffLoginPage })));
const StaffAccountPage = load(() => import("@/src/pages/shared/StaffAccountPage"), "StaffAccountPage");
const ScanScreenPage = load(() => import("@/src/pages/shared/ScanScreenPage"), "ScanScreenPage");
const EventScanPickPage = lazy(() => import("@/src/pages/shared/EventScanPickPage").then((m) => ({ default: m.EventScanPickPage })));
const EventScanCheckpointPage = lazy(() => import("@/src/pages/shared/EventScanCheckpointPage").then((m) => ({ default: m.EventScanCheckpointPage })));
const EventParticipantPage = lazy(() => import("@/src/pages/shared/EventParticipantPage").then((m) => ({ default: m.EventParticipantPage })));
const TeamMemberPage = lazy(() => import("@/src/pages/shared/TeamMemberPage").then((m) => ({ default: m.TeamMemberPage })));

const AdminDashboardPage = load(() => import("@/src/pages/admin/AdminDashboardPage"), "AdminDashboardPage");
const AdminAttendancePage = load(() => import("@/src/pages/admin/AdminAttendancePage"), "AdminAttendancePage");
const AdminEventsPage = load(() => import("@/src/pages/admin/AdminEventsPage"), "AdminEventsPage");
const AdminEventDetailPage = load(() => import("@/src/pages/admin/AdminEventDetailPage"), "AdminEventDetailPage");
const AdminMaterialsPage = load(() => import("@/src/pages/admin/AdminMaterialsPage"), "AdminMaterialsPage");
const AdminParticipantsPage = load(() => import("@/src/pages/admin/AdminParticipantsPage"), "AdminParticipantsPage");
const AdminHistoryPage = load(() => import("@/src/pages/admin/AdminHistoryPage"), "AdminHistoryPage");
const AdminRundownPage = load(() => import("@/src/pages/admin/AdminRundownPage"), "AdminRundownPage");
const AdminEmergencyPage = load(() => import("@/src/pages/admin/AdminEmergencyPage"), "AdminEmergencyPage");
const AdminTeamPage = load(() => import("@/src/pages/admin/AdminTeamPage"), "AdminTeamPage");

const SuperadminDashboardPage = load(() => import("@/src/pages/superadmin/SuperadminDashboardPage"), "SuperadminDashboardPage");
const SuperadminEventsPage = load(() => import("@/src/pages/superadmin/SuperadminEventsPage"), "SuperadminEventsPage");
const SuperadminEventDetailPage = load(() => import("@/src/pages/superadmin/SuperadminEventDetailPage"), "SuperadminEventDetailPage");
const SuperadminLearningPage = load(() => import("@/src/pages/superadmin/SuperadminLearningPage"), "SuperadminLearningPage");
const SuperadminCategoriesPage = load(() => import("@/src/pages/superadmin/SuperadminCategoriesPage"), "SuperadminCategoriesPage");
const SuperadminUsersPage = load(() => import("@/src/pages/superadmin/SuperadminUsersPage"), "SuperadminUsersPage");
const SuperadminAdminsPage = load(() => import("@/src/pages/superadmin/SuperadminAdminsPage"), "SuperadminAdminsPage");
const SuperadminAttendancePage = load(() => import("@/src/pages/superadmin/SuperadminAttendancePage"), "SuperadminAttendancePage");
const SuperadminFinancePage = load(() => import("@/src/pages/superadmin/SuperadminFinancePage"), "SuperadminFinancePage");
const SuperadminSitePage = load(() => import("@/src/pages/superadmin/SuperadminSitePage"), "SuperadminSitePage");
const SuperadminBannersPage = load(() => import("@/src/pages/superadmin/SuperadminBannersPage"), "SuperadminBannersPage");
const SuperadminArticlesPage = load(() => import("@/src/pages/superadmin/SuperadminArticlesPage"), "SuperadminArticlesPage");
const SuperadminArticleNewPage = load(() => import("@/src/pages/superadmin/SuperadminArticlesPage"), "SuperadminArticleNewPage");
const SuperadminArticleEditPage = load(() => import("@/src/pages/superadmin/SuperadminArticlesPage"), "SuperadminArticleEditPage");
const SuperadminAuditPage = load(() => import("@/src/pages/superadmin/SuperadminAuditPage"), "SuperadminAuditPage");

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LiveSync />
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
            <Route element={<LandingLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/tentang" element={<AboutPage />} />
              <Route path="/event" element={<EventsPage />} />
              <Route path="/event/:slug" element={<EventDetailPage />} />
              <Route path="/galeri" element={<GalleryPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<ArticlePage />} />
              <Route path="/kontak" element={<ContactPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/daftar" element={<RegisterPage />} />
            </Route>

            <Route path="/sertifikat/:no" element={<CertificatePage />} />

            <Route element={<UserLayout />}>
              <Route path="/dashboard" element={<UserDashboardPage />} />
              <Route path="/tiket/:id" element={<TicketPage />} />
              <Route path="/tiket/:id/kuis" element={<QuizPage />} />
              <Route path="/akun" element={<UserAccountPage />} />
            </Route>

            <Route path="/admin" element={<StaffLoginPage portal="admin" />} />
            <Route path="/admin" element={<PanelLayout role="scanner" />}>
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="absensi" element={<AdminAttendancePage />} />
              <Route path="events" element={<AdminEventsPage />} />
              <Route path="events/:id" element={<AdminEventDetailPage />} />
              <Route path="events/:id/peserta/:regId" element={<EventParticipantPage base="/admin" />} />
              <Route path="events/:id/scan" element={<EventScanPickPage base="/admin" />} />
              <Route path="events/:id/scan/:cpId" element={<EventScanCheckpointPage base="/admin" />} />
              <Route path="scan" element={<ScanScreenPage />} />
              <Route path="materi" element={<AdminMaterialsPage />} />
              <Route path="peserta" element={<AdminParticipantsPage />} />
              <Route path="riwayat" element={<AdminHistoryPage />} />
              <Route path="rundown" element={<AdminRundownPage />} />
              <Route path="darurat" element={<AdminEmergencyPage />} />
              <Route path="tim" element={<AdminTeamPage />} />
              <Route path="tim/:id" element={<TeamMemberPage backHref="/admin/tim" />} />
              <Route path="akun" element={<StaffAccountPage />} />
            </Route>

            <Route path="/superadmin" element={<StaffLoginPage portal="superadmin" />} />
            <Route path="/superadmin" element={<PanelLayout role="superadmin" />}>
              <Route path="dashboard" element={<SuperadminDashboardPage />} />
              <Route path="events" element={<SuperadminEventsPage />} />
              <Route path="events/:id" element={<SuperadminEventDetailPage />} />
              <Route path="events/:id/belajar" element={<SuperadminLearningPage />} />
              <Route path="events/:id/peserta/:regId" element={<EventParticipantPage base="/superadmin" />} />
              <Route path="events/:id/scan" element={<EventScanPickPage base="/superadmin" />} />
              <Route path="events/:id/scan/:cpId" element={<EventScanCheckpointPage base="/superadmin" />} />
              <Route path="scan" element={<ScanScreenPage />} />
              <Route path="kategori" element={<SuperadminCategoriesPage />} />
              <Route path="peserta" element={<SuperadminUsersPage />} />
              <Route path="admins" element={<SuperadminAdminsPage />} />
              <Route path="absensi" element={<SuperadminAttendancePage />} />
              <Route path="keuangan" element={<SuperadminFinancePage />} />
              <Route path="site" element={<SuperadminSitePage />} />
              <Route path="banners" element={<SuperadminBannersPage />} />
              <Route path="articles" element={<SuperadminArticlesPage />} />
              <Route path="articles/new" element={<SuperadminArticleNewPage />} />
              <Route path="articles/:id" element={<SuperadminArticleEditPage />} />
              <Route path="audit" element={<SuperadminAuditPage />} />
              <Route path="tim/:id" element={<TeamMemberPage backHref="/superadmin/admins" />} />
              <Route path="akun" element={<StaffAccountPage />} />
            </Route>

            <Route path="*" element={<NotFoundCard />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}

