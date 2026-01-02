// src/layouts/AppLayout.jsx
import PublicNavbar from "../components/dashboard/PublicNavbar";
import PublicFooter from "../components/dashboard/PublicFooter";

export default function AppLayout({
    children,
    menus = [],
    userName = "Joni",
    avatarUrl,
    footerVariant = "full", // "simple" | "full"
    className = "bg-white",
}) {
    return (
        <div className={`min-h-screen ${className}`}>
            <PublicNavbar menus={menus} userName={userName} avatarUrl={avatarUrl} />

            {/* header tinggi ~72px (py-4), flex column biar footer nempel bawah */}
            <div className="flex min-h-[calc(100vh-72px)] flex-col">
                <main className="flex-1">{children}</main>
                <PublicFooter variant={footerVariant} />
            </div>
        </div>
    );
}
