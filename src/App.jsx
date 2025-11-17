import { BrowserRouter, Routes, Route } from "react-router-dom";
import RoleSelectPage from "./pages/RoleSelectPage";
import LoginPage from "./pages/LoginPage";
import AdminLoginPage from "./pages/AdminLoginPage";


function Placeholder({ title }) {
  return (
    <div className="grid min-h-svh place-items-center bg-slate-50 p-8 text-center">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-slate-900">{title}</h2>
        <a href="/" className="text-indigo-600 hover:underline">Kembali</a>
      </div>
    </div>
  );
}


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleSelectPage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* akses admin hanya via URL: /admin/login */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        {/* placeholders sementara */}
        <Route path="/forgot-password" element={<Placeholder title="Lupa Kata Sandi" />} />
        <Route path="/register" element={<Placeholder title="Daftar" />} />
        <Route path="/dashboard" element={<Placeholder title="Dashboard (dummy)" />} />
      </Routes>
    </BrowserRouter>
  );
}