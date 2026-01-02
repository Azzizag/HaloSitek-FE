// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayoutRoute from "./layouts/DashboardLayoutRoute";

/* Public / Auth Pages */
import RoleSelectPage from "./pages/RoleSelectPage";
import LoginPage from "./pages/LoginPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import UserRegisterPage from "./pages/UserRegisterPage";
import UserRegisterSuccess from "./pages/UserRegisterSuccess";
import ArsipediaLandingPage from "./pages/arsipedia/ArsipediaLandingPage";
import ArsipediaSearchPage from "./pages/arsipedia/ArsipediaSearchPage";
import ArsipediaDetailPage from "./pages/arsipedia/ArsipediaDetailPage";

/* User */
import UserDashboardPage from "./pages/dashboard/UserDashboardPage";
import UserProfilePage from "./pages/user/UserProfilPage";
import UserProfileSuccess from "./pages/user/UserProfileSuccess";

/* Architect Flow */
import ArchitectRegisterBasic from "./pages/ArchitectRegisterBasic";
import ArchitectRegisterProfessional from "./pages/ArchitectRegisterProfessional";
import ArchitectRegisterConfirmPay from "./pages/ArchitectRegisterConfirmPay";
import ArchitectPaymentStatus from "./pages/ArchitectPaymentStatus";
import ArchitectPaymentPage from "./pages/ArchitectPaymentPage";
import ArchitectDashboardPage from "./pages/dashboard/ArchitectDashboardPage";
import ArchitectProfilePage from "./pages/architect/ArchitectProfilePage";
import ArchitectProfileDetailPage from "./pages/architect/ArchitectProfileDetailPage";
import DesignDetailsPage from "./pages/architect/Design/DesignDetailsPage";
import DesignImagesPage from "./pages/architect/Design/DesignImagesPage";
import DesignReviewPublishPage from "./pages/architect/Design/DesignReviewPublishPage";




/* Admin Layout & Pages */
import RequireAdminAuth from "./components/admin/RequireAdminAuth";
import AdminLayout from "./layouts/AdminLayout";
import DashboardPage from "./pages/admin/DashboardPage";
import AdminProfilePage from "./pages/admin/AdminProfilePage";
import ArsipediaPage from "./pages/admin/ArsipediaPage";
import DesignManagementPage from "./pages/admin/DesignManagementPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import ArchitectManagementPage from "./pages/admin/ArchitectManagementPage";
import AdminManagementPage from "./pages/admin/AdminManagementPage";
import EditorArticlePage from "./pages/admin/ArticleEditorPage";

/* Auth Guard */
import RequireRole from "./components/auth/RequireRole";

/* Catalog */
import CatalogHomePage from "./pages/design/CatalogHomePage";
import CatalogResultsPage from "./pages/design/CatalogResultsPage";
import DesignDetailPage from "./pages/design/DesignDetailPage";

/* Arsitek catalog */

import ArchitectSearchPage from "./pages/architect/ArchitectSearchPage";


function Placeholder({ title }) {
  return (
    <div className="grid min-h-svh place-items-center bg-slate-50 p-8 text-center">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-slate-900">{title}</h2>
        <a href="/" className="text-indigo-600 hover:underline">
          Kembali
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================= PUBLIC ================= */}
        <Route path="/" element={<RoleSelectPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* ================= USER REGISTER ================= */}
        <Route path="/register/users" element={<UserRegisterPage />} />
        <Route path="/register/users/success" element={<UserRegisterSuccess />} />

        {/* ================= ARCHITECT REGISTER & PAYMENT ================= */}
        <Route path="/register/architect/basic" element={<ArchitectRegisterBasic />} />
        <Route path="/register/architect/professional" element={<ArchitectRegisterProfessional />} />
        <Route path="/register/architect/confirm" element={<ArchitectRegisterConfirmPay />} />
        <Route path="/register/architect/status" element={<ArchitectPaymentStatus />} />
        <Route path="/payment/:paymentToken" element={<ArchitectPaymentPage />} />



        {/* ================= ADMIN DASHBOARD ================= */}
        <Route
          path="/admin"
          element={
            <RequireAdminAuth>
              <AdminLayout />
            </RequireAdminAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="profile" element={<AdminProfilePage />} />
          <Route path="arsipedia" element={<ArsipediaPage />} />
          <Route path="designs" element={<DesignManagementPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="architects" element={<ArchitectManagementPage />} />
          <Route path="admins" element={<AdminManagementPage />} />
          <Route path="arsipedia/new" element={<EditorArticlePage mode="create" />} />
          <Route path="arsipedia/:id/edit" element={<EditorArticlePage mode="edit" />} />
        </Route>

        {/* ================= DASHBOARD LAYOUT (USER + ARCHITECT) ================= */}
        <Route element={<DashboardLayoutRoute />}>
          {/* USER */}
          <Route
            path="/dashboard/user"
            element={
              <RequireRole allow={["USER"]}>
                <UserDashboardPage />
              </RequireRole>
            }
          />
          <Route
            path="/dashboard/profile"
            element={
              <RequireRole allow={["USER"]}>
                <UserProfilePage />
              </RequireRole>
            }
          />
          <Route
            path="/dashboard/profile/success"
            element={
              <RequireRole allow={["USER"]}>
                <UserProfileSuccess />
              </RequireRole>
            }
          />

          {/* ARCHITECT */}
          <Route
            path="/dashboard/architect"
            element={
              <RequireRole allow={["ARCHITECT"]}>
                <ArchitectDashboardPage />
              </RequireRole>
            }
          />
          <Route
            path="/dashboard/architect/profile"
            element={
              <RequireRole allow={["ARCHITECT"]}>
                <ArchitectProfilePage />
              </RequireRole>
            }
          />
          <Route
            path="/dashboard/architect/upload"
            element={
              <RequireRole allow={["ARCHITECT"]}>
                <DesignDetailsPage />
              </RequireRole>
            }
          />
          <Route
            path="/dashboard/architect/upload/images"
            element={
              <RequireRole allow={["ARCHITECT"]}>
                <DesignImagesPage />
              </RequireRole>
            }
          />
          <Route
            path="/dashboard/architect/upload/review"
            element={
              <RequireRole allow={["ARCHITECT"]}>
                <DesignReviewPublishPage />
              </RequireRole>
            }
          />

          {/* CATALOG (kalau kamu mau katalog ikut navbar+footer layout ini) */}
          <Route path="/catalog" element={<CatalogHomePage />} />
          <Route path="/catalog/results" element={<CatalogResultsPage />} />
          <Route path="/catalog/designs/:id" element={<DesignDetailPage />} />
          <Route path="/dashboard/search/architect" element={<ArchitectSearchPage />} />
          <Route path="/architects/:id" element={<ArchitectProfileDetailPage />} />
          <Route path="/arsipedia" element={<ArsipediaLandingPage />} />
          <Route path="/arsipedia/search" element={<ArsipediaSearchPage />} />
          <Route path="/arsipedia/:id" element={<ArsipediaDetailPage />} />

        </Route>

        {/* ================= OTHERS ================= */}
        <Route path="/forgot-password" element={<Placeholder title="Lupa Kata Sandi" />} />
        <Route path="/dashboard" element={<Placeholder title="Dashboard (dummy)" />} />
      </Routes>
    </BrowserRouter>
  );
}
