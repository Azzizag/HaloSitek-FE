// src/pages/arsipedia/ArsipediaDetailPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { getArsipediaDetail, mapArsipediaToCard } from "../../lib/apiArsipedia";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function TagPill({ children }) {
    return (
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
            {children}
        </span>
    );
}

function getUserToken() {
    return localStorage.getItem("access_token") || "";
}
function getArchitectToken() {
    return localStorage.getItem("architect_access_token") || "";
}

async function postWithToken(url, token) {
    const res = await fetch(url, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
    });
    // kalau gagal jangan bikin page error
    if (!res.ok) return false;
    return true;
}

async function getJSON(url, token = "") {
    const res = await fetch(url, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Request gagal");
    return data;
}

export default function ArsipediaDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errMsg, setErrMsg] = useState("");

    // ✅ views
    const [viewCount, setViewCount] = useState(0);
    const trackedRef = useRef(false);

    useEffect(() => {
        let ignore = false;

        (async () => {
            try {
                setLoading(true);
                setErrMsg("");

                const detail = await getArsipediaDetail(id);
                if (!detail) throw new Error("Artikel tidak ditemukan");

                const mapped = mapArsipediaToCard(detail);
                if (!ignore) setItem(mapped);
            } catch (e) {
                const msg = e?.response?.data?.message || e?.message || "Gagal mengambil detail Arsipedia";
                if (!ignore) setErrMsg(msg);
            } finally {
                if (!ignore) setLoading(false);
            }
        })();

        return () => {
            ignore = true;
        };
    }, [id]);

    // ✅ Track views + ambil summary views
    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                if (!id) return;

                const userToken = getUserToken();
                const archToken = getArchitectToken();

                // Arsipedia: hitung hanya jika login (USER atau ARCHITECT)
                const tokenToUse = userToken || archToken;
                const canTrack = !!tokenToUse;

                // Guard supaya tidak double hit (StrictMode)
                if (canTrack && !trackedRef.current) {
                    trackedRef.current = true;
                    await postWithToken(`${API_BASE_URL}/views/arsipedia/${encodeURIComponent(id)}`, tokenToUse);
                }

                // Ambil summary views (public, tapi boleh juga pakai token)
                const summary = await getJSON(
                    `${API_BASE_URL}/views/arsipedia/${encodeURIComponent(id)}/summary`,
                    tokenToUse // optional
                );

                const raw = summary?.data ?? summary;
                const total = Number(raw?.totalViews ?? raw?.viewCount ?? raw?.count ?? 0) || 0;

                if (mounted) setViewCount(total);
            } catch {
                // ignore saja, jangan ganggu UI
            }
        })();

        return () => {
            mounted = false;
        };
    }, [id]);

    const paragraphs = useMemo(() => {
        const raw = item?.content ?? "";
        return raw
            .split(/\n\s*\n/g)
            .map((p) => p.trim())
            .filter(Boolean);
    }, [item]);

    return (
        <main className="w-full bg-slate-50">
            <section className="mx-auto max-w-5xl px-6 py-10">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                    <FiArrowLeft />
                    Kembali
                </button>

                {loading && <div className="mt-8 text-sm text-slate-600">Loading…</div>}
                {!loading && errMsg && <div className="mt-8 text-sm text-red-600">{errMsg}</div>}

                {!loading && !errMsg && item && (
                    <article className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <div className="h-[320px] w-full bg-slate-100">
                            <img
                                src={item.coverImage}
                                alt={item.title}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = "https://via.placeholder.com/1200x800?text=No+Image";
                                }}
                            />
                        </div>

                        <div className="p-7">
                            <h1 className="text-2xl font-extrabold leading-snug text-slate-900">{item.title}</h1>

                            {/* ✅ View count (kecil, tidak ubah layout) */}
                            <div className="mt-2 text-xs font-semibold text-slate-500">
                                Dilihat <span className="text-slate-900">{viewCount}</span> kali
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                                {(item.tags || []).map((t, i) => (
                                    <TagPill key={`${t}-${i}`}>{t}</TagPill>
                                ))}
                            </div>

                            <div className="mt-6 space-y-4 text-sm leading-7 text-slate-700">
                                {paragraphs.map((p, idx) => (
                                    <p key={idx}>{p}</p>
                                ))}
                            </div>
                        </div>
                    </article>
                )}
            </section>
        </main>
    );
}
