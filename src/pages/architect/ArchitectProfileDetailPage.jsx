// src/pages/architect/ArchitectProfileDetailPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiPhone, FiMail, FiAward, FiLink, FiCheckCircle, FiEye } from "react-icons/fi";

function getApiRoot() {
    const raw = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");
    if (!raw) return "/api";
    if (/\/api$/i.test(raw)) return raw;
    return `${raw}/api`;
}

function getBackendOrigin(apiRoot) {
    if (!apiRoot) return "";
    if (apiRoot === "/api") return "";
    return apiRoot.replace(/\/api$/i, "");
}

const API_ROOT = getApiRoot();
const BACKEND_ORIGIN = getBackendOrigin(API_ROOT);

const FALLBACK_IMG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">
    <rect width="100%" height="100%" fill="#e2e8f0"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
      fill="#64748b" font-family="Arial" font-size="36">No Image</text>
  </svg>`);

function getUserToken() {
    return localStorage.getItem("access_token") || "";
}

async function postWithUserToken(url, token) {
    const res = await fetch(url, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
    });
    return res.ok;
}

async function getJSON(url) {
    const res = await fetch(url, { method: "GET", credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Request gagal");
    return data;
}

function normalizePath(u) {
    if (!u) return null;
    return String(u).trim().replace(/\\/g, "/");
}

function toAbsoluteFileUrl(u) {
    const cleaned = normalizePath(u);
    if (!cleaned) return null;

    if (/^https?:\/\//i.test(cleaned)) return cleaned;
    if (cleaned.startsWith("data:") || cleaned.startsWith("blob:")) return cleaned;

    const path = cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
    if (!BACKEND_ORIGIN) return path; // butuh rewrite /uploads kalau frontend beda domain
    return `${BACKEND_ORIGIN}${path}`;
}

function safeJsonParse(value, fallback) {
    if (value == null) return fallback;
    if (Array.isArray(value) || typeof value === "object") return value;
    if (typeof value !== "string") return fallback;
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}

function Pill({ children, className = "" }) {
    return (
        <span
            className={[
                "inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700",
                className,
            ].join(" ")}
        >
            {children}
        </span>
    );
}

function SectionTitle({ children }) {
    return <h2 className="text-xl font-extrabold text-slate-900">{children}</h2>;
}

function formatDate(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

export default function ArchitectProfileDetailPage() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [profile, setProfile] = useState(null);

    // views
    const [viewCount, setViewCount] = useState(0);
    const trackedRef = useRef(false);

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                setLoading(true);
                setErr("");

                const res = await fetch(`${API_ROOT}/architects/public/${encodeURIComponent(id)}`, {
                    method: "GET",
                    credentials: "include",
                });

                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data?.message || "Gagal mengambil profil arsitek");

                const p = data?.data ?? null;
                if (mounted) setProfile(p);
            } catch (e) {
                if (mounted) {
                    setErr(e?.message || "Terjadi kesalahan");
                    setProfile(null);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [id]);

    // Track view: hanya USER
    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                if (!id) return;

                const userToken = getUserToken();
                const isUserLoggedIn = !!userToken;

                if (isUserLoggedIn && !trackedRef.current) {
                    trackedRef.current = true;
                    await postWithUserToken(`${API_ROOT}/views/architect/${encodeURIComponent(id)}`, userToken);
                }

                const summary = await getJSON(`${API_ROOT}/views/architect/${encodeURIComponent(id)}/summary`);
                const raw = summary?.data ?? summary;
                const total = Number(raw?.totalViews ?? raw?.viewCount ?? raw?.count ?? 0) || 0;

                if (mounted) setViewCount(total);
            } catch {
                // ignore
            }
        })();

        return () => {
            mounted = false;
        };
    }, [id]);

    const header = useMemo(() => {
        const p = profile || {};
        return {
            name: p?.name || "-",
            email: p?.email || "-",
            phone: p?.phone || "-",
            avatarUrl: toAbsoluteFileUrl(p?.profilePictureUrl) || FALLBACK_IMG,
            status: p?.status || "",
            verified: !!p?.emailVerified,
            years: typeof p?.tahunPengalaman === "number" ? p.tahunPengalaman : null,
            area: p?.areaPengalaman || "-",
        };
    }, [profile]);

    const skills = useMemo(() => {
        const raw = safeJsonParse(profile?.keahlianKhusus, []);
        return Array.isArray(raw) ? raw.filter(Boolean) : [];
    }, [profile]);

    if (loading) {
        return (
            <div className="mx-auto w-full max-w-7xl px-6 py-10">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                    Memuat profil...
                </div>
            </div>
        );
    }

    if (err) {
        return (
            <div className="mx-auto w-full max-w-7xl px-6 py-10">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{err}</div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="mx-auto w-full max-w-7xl px-6 py-10">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                    Profil tidak ditemukan.
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-7xl px-6 py-10">
            {/* Header */}
            <div className="mx-auto max-w-3xl text-center">
                <div className="mx-auto h-20 w-20 overflow-hidden rounded-full bg-slate-200">
                    <img
                        src={header.avatarUrl}
                        alt={header.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                            if (e.currentTarget.src === FALLBACK_IMG) return;
                            e.currentTarget.src = FALLBACK_IMG;
                        }}
                    />
                </div>

                <h1 className="mt-4 text-3xl font-extrabold text-slate-900">{header.name}</h1>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                    {header.area}
                    {header.years !== null ? ` • ${header.years} tahun pengalaman` : ""}
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <Pill className="border-slate-200 bg-white text-slate-700">
                        <FiEye className="mr-1 text-slate-500" />
                        Dilihat {viewCount} kali
                    </Pill>

                    {header.status ? <Pill>{header.status}</Pill> : null}
                    {header.verified ? (
                        <Pill className="border-emerald-200 bg-emerald-50 text-emerald-700">
                            <FiCheckCircle className="mr-1" />
                            Email Terverifikasi
                        </Pill>
                    ) : (
                        <Pill className="border-amber-200 bg-amber-50 text-amber-700">Email Belum Verifikasi</Pill>
                    )}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        <FiPhone className="text-slate-500" />
                        <span className="font-semibold">{header.phone}</span>
                    </div>

                    <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        <FiMail className="text-slate-500" />
                        <span className="font-semibold">{header.email}</span>
                    </div>
                </div>

                <div className="mt-6">
                    {skills.length ? (
                        <div className="flex flex-wrap justify-center gap-2">
                            {skills.map((s) => (
                                <Pill key={s}>{s}</Pill>
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Sertifikasi */}
            <div className="mt-10 border-t border-slate-100 pt-10">
                <SectionTitle>Sertifikasi</SectionTitle>

                <div className="mt-5 space-y-4">
                    {(profile?.certifications || []).length ? (
                        profile.certifications.map((c) => (
                            <div key={c.id} className="flex items-center justify-between gap-4">
                                <div className="flex items-start gap-3 text-sm text-slate-700">
                                    <FiAward className="mt-0.5 text-slate-500" />
                                    <div>
                                        <div className="font-semibold text-slate-900">{c.certificationName || "-"}</div>
                                        <div className="text-xs text-slate-500">{c.penerbit || "-"}</div>
                                        <div className="mt-1 text-xs text-slate-400">
                                            Dibuat: {formatDate(c.createdAt)}
                                            {c.berkasUrl ? (
                                                <>
                                                    {" • "}
                                                    <a
                                                        href={toAbsoluteFileUrl(c.berkasUrl)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="font-semibold text-slate-600 hover:underline"
                                                    >
                                                        Lihat Berkas
                                                    </a>
                                                </>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>

                                <Pill className="border-sky-200 bg-sky-50 text-sky-700">{c.year ?? "-"}</Pill>
                            </div>
                        ))
                    ) : (
                        <div className="text-sm text-slate-500">Belum ada sertifikasi.</div>
                    )}
                </div>
            </div>

            {/* Portfolio Links */}
            <div className="mt-10 border-t border-slate-100 pt-10">
                <SectionTitle>Portfolio Links</SectionTitle>

                <div className="mt-5 space-y-3">
                    {(profile?.portfolioLinks || []).length ? (
                        profile.portfolioLinks
                            .slice()
                            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                            .map((p) => (
                                <a
                                    key={p.id}
                                    href={p.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    <div className="flex items-center gap-2">
                                        <FiLink className="text-slate-500" />
                                        <span className="font-semibold">{p.url}</span>
                                    </div>
                                    <span className="text-xs text-slate-500">Buka</span>
                                </a>
                            ))
                    ) : (
                        <div className="text-sm text-slate-500">Belum ada link portfolio.</div>
                    )}
                </div>
            </div>

            {/* Desain */}
            <div className="mt-10 border-t border-slate-100 pt-10">
                <SectionTitle>Desain</SectionTitle>

                <div className="mt-6">
                    {(profile?.designs || []).length ? (
                        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                            {profile.designs.map((d) => {
                                const photos = safeJsonParse(d?.foto_bangunan, []);
                                const firstPhoto = Array.isArray(photos) ? photos[0] : null;

                                const cover = toAbsoluteFileUrl(firstPhoto || d?.designImage) || FALLBACK_IMG;

                                return (
                                    <Link
                                        key={d.id}
                                        to={`/catalog/designs/${d.id}`}
                                        className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                    >
                                        <div className="h-40 w-full bg-slate-100">
                                            <img
                                                src={cover}
                                                alt={d.title}
                                                className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                                                loading="lazy"
                                                onError={(e) => {
                                                    if (e.currentTarget.src === FALLBACK_IMG) return;
                                                    e.currentTarget.src = FALLBACK_IMG;
                                                }}
                                            />
                                        </div>

                                        <div className="p-4">
                                            <div className="truncate text-sm font-extrabold text-slate-900">
                                                {d.title || "Untitled Design"}
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">Dibuat: {formatDate(d.createdAt)}</div>
                                            <div className="mt-3 text-xs font-semibold text-slate-700 underline opacity-0 transition group-hover:opacity-100">
                                                Lihat Detail
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                            Belum ada desain.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
