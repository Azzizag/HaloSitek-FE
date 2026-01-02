import { FiBell, FiUser } from "react-icons/fi";

export default function Topbar({ title }) {
    return (
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="flex h-[72px] items-center justify-between px-6 lg:px-8">
                <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>

                <div className="flex items-center gap-3">
                    <button
                        className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        title="Notifikasi"
                        onClick={() => alert("Notifikasi")}
                    >
                        <FiBell />
                    </button>

                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-200 text-slate-600">
                            <FiUser />
                        </div>
                        <div className="hidden sm:block">
                            <div className="text-sm font-semibold text-slate-900">Admin</div>
                            <div className="text-xs text-slate-500">Administrator Sistem</div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
