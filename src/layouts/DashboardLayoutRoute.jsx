// src/layouts/DashboardLayoutRoute.jsx
import { Outlet } from "react-router-dom";
import AppLayout from "./AppLayout";
import { getAccessToken, getRoleFromToken } from "../lib/authClient";

function mapJwtRole(jwtRole) {
    const r = String(jwtRole || "").toUpperCase();
    if (r === "ADMIN") return "admin";
    if (r === "ARCHITECT") return "arsitek";
    return "user";
}

export default function DashboardLayoutRoute() {
    const token = getAccessToken();
    const role = mapJwtRole(getRoleFromToken(token));

    const menus =
        role === "admin"
            ? [
                { label: "Dashboard", to: "/admin/dashboard" },
                { label: "Users", to: "/admin/users" },
                { label: "Architects", to: "/admin/architects" },
                { label: "Designs", to: "/admin/designs" },
            ]
            : role === "arsitek"
                ? [
                    { label: "Dashboard", to: "/dashboard/architect" },
                    { label: "Arsipedia", to: "/arsipedia" },
                    { label: "Arsitek", to: "/dashboard/search/architect" },
                    { label: "Unggah Desain", to: "/dashboard/architect/upload" },
                    { label: "Katalog", to: "/catalog" },
                ]
                : [
                    { label: "Dashboard", to: "/dashboard/user" },
                    { label: "Arsitek", to: "/dashboard/search/architect" },
                    { label: "Arsipedia", to: "/arsipedia" },
                    { label: "Katalog", to: "/catalog" },
                ];

    return (
        <AppLayout menus={menus} footerVariant="simple" className="bg-white">
            <Outlet />
        </AppLayout>
    );
}
