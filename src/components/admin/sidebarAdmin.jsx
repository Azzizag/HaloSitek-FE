import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { FiGrid, FiUser, FiFolder, FiImage, FiUsers, FiHome, FiLogOut } from "react-icons/fi";
import { apiAdmin } from "../../lib/apiAdmin";
import { clearAdminToken } from "../../lib/adminAuth";

const items = [
    { to: "/admin", label: "Dashboard", icon: FiGrid, end: true },
    { to: "/admin/profile", label: "Profil Admin", icon: FiUser },
    { to: "/admin/admins", label: "Data Admin", icon: FiUsers },
    { to: "/admin/arsipedia", label: "Arsipedia", icon: FiFolder },
    { to: "/admin/designs", label: "Manajemen Desain", icon: FiImage },
    { to: "/admin/users", label: "Manajemen Pengguna", icon: FiUsers },
    { to: "/admin/architects", label: "Manajemen Arsitek", icon: FiHome },
];

const ENDPOINTS = {
    logout: "/api/admins/logout", // <- sesuaikan kalau beda
};

export default function Sidebar() {
    const navigate = useNavigate();
    const [loggingOut, setLoggingOut] = useState(false);

    async function handleLogout() {
        if (loggingOut) return;

        try {
            setLoggingOut(true);

            // hit backend logout (kalau backend hanya pakai token stateless, ini tetap ok)
            await apiAdmin(ENDPOINTS.logout, { method: "POST" }).catch(() => null);

            // bersihkan token lokal
            clearAdminToken();

            // redirect
            navigate("/admin/login", { replace: true });
        } finally {
            setLoggingOut(false);
        }
    }

    return (
        <aside className="hidden w-[280px] shrink-0 border-r border-slate-200 bg-white p-5 lg:flex lg:flex-col">
            {/* Brand */}
            <div className="flex items-center gap-3 rounded-2xl px-2 py-2">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-white">
                    <FiGrid />
                </div>
                <div className="leading-tight">
                    <div className="text-sm font-extrabold text-slate-900">AdminDashboard</div>
                    <div className="text-xs text-slate-500">HaloSitek</div>
                </div>
            </div>

            {/* Nav */}
            <nav className="mt-6 flex flex-col gap-2">
                {items.map((it) => {
                    const Icon = it.icon;
                    return (
                        <NavLink
                            key={it.to}
                            to={it.to}
                            end={it.end}
                            className={({ isActive }) =>
                                [
                                    "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
                                    isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
                                ].join(" ")
                            }
                        >
                            <span className="text-base">
                                <Icon />
                            </span>
                            <span>{it.label}</span>
                        </NavLink>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="mt-auto">

                <button
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    onClick={handleLogout}
                    disabled={loggingOut}
                >
                    <FiLogOut />
                    {loggingOut ? "Logging out..." : "Logout"}
                </button>
            </div>
        </aside>
    );
}
