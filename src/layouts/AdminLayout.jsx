import { Outlet } from "react-router-dom";
import Sidebar from "../components/admin/sidebarAdmin";
import Topbar from "../components/admin/Topbar";

export default function AdminLayout() {
    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <div className="flex flex-1 flex-col">
                <Topbar />
                <main className="p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
