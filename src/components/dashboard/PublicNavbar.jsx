// src/components/organisms/navbar/PublicNavbar.jsx
import { useEffect, useRef, useState, useMemo } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { FiUser, FiLogOut } from "react-icons/fi";
import { getAccessToken, getRoleFromToken, clearAccessToken } from "../../lib/authClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function getSessionRole() {
    const token = getAccessToken();
    const jwtRole = getRoleFromToken(token);
    const r = String(jwtRole || "").toUpperCase();

    if (r === "ADMIN") return "admin";
    if (r === "ARCHITECT") return "arsitek";
    if (token) return "user";
    return "guest";
}

function toAbsoluteUrl(u) {
    if (!u) return null;
    if (u.startsWith("blob:")) return u;
    if (/^https?:\/\//i.test(u)) return u;
    const cleaned = u.startsWith("/") ? u : `/${u}`;
    return `${API_BASE_URL}${cleaned}`;
}

// fleksibel untuk berbagai bentuk response
function pickProfile(json) {
    const p = json?.data ?? json ?? {};

    const name =
        p?.fullName ||
        p?.name ||
        p?.username ||
        p?.email ||
        "Pengguna";

    const avatar = p?.profilePictureUrl || null;

    return { name, avatarUrl: toAbsoluteUrl(avatar) };
}


async function fetchWithAuth(path, token) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
    });

    let json = {};
    try {
        json = await res.json();
    } catch {
        json = {};
    }

    if (res.status === 401 || res.status === 403) {
        const err = new Error("UNAUTHORIZED");
        err.status = res.status;
        throw err;
    }

    if (!res.ok || json?.success === false) {
        const err = new Error(json?.message || `Gagal fetch profil (${res.status})`);
        err.status = res.status;
        err.data = json;
        throw err;
    }

    return json;
}

export default function PublicNavbar({ menus = [], userName = "Joni", avatarUrl }) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const token = getAccessToken();
    const role = useMemo(() => getSessionRole(), [location.key]);

    const profilePath =
        role === "arsitek"
            ? "/dashboard/architect/profile"
            : role === "admin"
                ? "/admin/dashboard"
                : "/dashboard/profile";

    const loginPath =
        role === "arsitek"
            ? "/login?role=arsitek"
            : role === "admin"
                ? "/login?role=admin"
                : "/login?role=user";

    const [displayName, setDisplayName] = useState(userName);
    const [displayAvatar, setDisplayAvatar] = useState(avatarUrl || null);

    // ✅ ambil nama+foto sesuai akun login
    useEffect(() => {
        let mounted = true;

        async function loadProfile() {
            // guest
            if (!token || role === "guest") {
                if (!mounted) return;
                setDisplayName(userName || "Guest");
                setDisplayAvatar(avatarUrl || null);
                return;
            }

            try {
                if (role === "arsitek") {
                    const json = await fetchWithAuth("/architects/auth/profile", token);
                    const prof = pickProfile(json);
                    if (!mounted) return;
                    setDisplayName(prof.name || "Arsitek");
                    setDisplayAvatar(prof.avatarUrl || null);
                    return;
                }

                if (role === "user") {
                    // ✅ endpoint user yang kamu tunjukkan
                    const json = await fetchWithAuth("/users/auth/profile", token);
                    const prof = pickProfile(json);
                    if (!mounted) return;
                    setDisplayName(prof.name || "User");
                    setDisplayAvatar(prof.avatarUrl || null);
                    return;
                }

                // admin fallback
                if (!mounted) return;
                setDisplayName(userName || "Admin");
                setDisplayAvatar(avatarUrl || null);
            } catch (e) {
                // token invalid/expired -> logout
                if (e?.message === "UNAUTHORIZED" || e?.status === 401 || e?.status === 403) {
                    clearAccessToken();
                    if (!mounted) return;
                    setDisplayName("Guest");
                    setDisplayAvatar(null);
                    return;
                }

                // error lain -> fallback props
                if (!mounted) return;
                setDisplayName(userName || "Pengguna");
                setDisplayAvatar(avatarUrl || null);
                console.warn("Navbar profile fetch error:", e);
            }
        }

        loadProfile();
        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role, token, location.key]);

    useEffect(() => {
        function onDocClick(e) {
            if (!wrapRef.current) return;
            if (!wrapRef.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    const img =
        displayAvatar ||
        "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=96&q=60";

    return (
        <header className="w-full border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                <div className="flex items-center gap-6">
                    <div className="text-xl font-extrabold text-slate-900">
                        <span className="italic">halositek</span>
                    </div>

                    <nav className="flex items-center gap-3">

                        {menus.map((m) => (
                            <NavLink
                                key={m.to}
                                to={m.to}
                                end={!!m.end}   // ✅ penting: exact match jika end=true
                                className={({ isActive }) =>
                                    [
                                        "rounded-lg border px-4 py-1.5 text-sm font-semibold transition",
                                        isActive
                                            ? "border-slate-700 bg-slate-700 text-white"
                                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                                    ].join(" ")
                                }
                            >
                                {m.label}
                            </NavLink>
                        ))}

                    </nav>
                </div>

                <div ref={wrapRef} className="relative flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setOpen((v) => !v)}
                        className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-50"
                    >
                        <span className="text-sm font-semibold text-slate-700">{displayName}</span>
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-200">
                            <img src={img} alt="avatar" className="h-full w-full object-cover" />
                        </div>
                    </button>

                    {open && (
                        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                            <button
                                className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                onClick={() => {
                                    setOpen(false);
                                    navigate(profilePath);
                                }}
                            >
                                <FiUser />
                                Profil Saya
                            </button>

                            <div className="h-px bg-slate-100" />

                            <button
                                className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                                onClick={() => {
                                    clearAccessToken();
                                    setOpen(false);
                                    navigate(loginPath, { replace: true });
                                }}
                            >
                                <FiLogOut />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
