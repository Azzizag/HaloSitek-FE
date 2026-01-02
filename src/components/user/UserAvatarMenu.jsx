import { useEffect, useRef, useState } from "react";
import { FiLogOut, FiUser } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { clearAccessToken } from "../../lib/authClient";

export default function UserAvatarMenu({
    name = "User",
    avatarUrl,
    onLogout,
}) {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        function onClickOutside(e) {
            if (!ref.current) return;
            if (!ref.current.contains(e.target)) setOpen(false);
        }
        window.addEventListener("mousedown", onClickOutside);
        return () => window.removeEventListener("mousedown", onClickOutside);
    }, []);

    const initial = (name || "U").trim().slice(0, 1).toUpperCase();

    function handleLogout() {
        clearAccessToken();
        onLogout?.();
        navigate("/login?role=user", { replace: true });
    }

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-3 rounded-full px-2 py-1 hover:bg-slate-50"
            >
                <span className="text-sm font-semibold text-slate-700">{name}</span>
                <span className="relative">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt="avatar"
                            className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200"
                        />
                    ) : (
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-200 text-sm font-extrabold text-slate-700 ring-1 ring-slate-200">
                            {initial}
                        </span>
                    )}
                    {/* dot online */}
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                </span>
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                    <button
                        onClick={() => {
                            setOpen(false);
                            navigate("/dashboard/profile");
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        <FiUser className="text-base" />
                        Profil Saya
                    </button>

                    <div className="h-px bg-slate-100" />

                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                        <FiLogOut className="text-base" />
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
}
