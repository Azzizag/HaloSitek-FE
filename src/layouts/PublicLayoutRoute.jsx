// src/layouts/PublicLayoutRoute.jsx
import { Outlet } from "react-router-dom";
import AppLayout from "./AppLayout";

const publicMenus = [
    { label: "Beranda", to: "/" },
    { label: "Arsipedia", to: "/arsipedia" },
    { label: "Arsitek", to: "/dashboard/search/architect" },
    { label: "Katalog", to: "/catalog" },
];

export default function PublicLayoutRoute() {
    return (
        <AppLayout menus={publicMenus} footerVariant="full">
            <Outlet />
        </AppLayout>
    );
}
