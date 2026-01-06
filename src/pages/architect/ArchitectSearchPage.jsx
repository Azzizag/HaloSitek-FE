// src/pages/architect/ArchitectSearchPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

/**
 * ENV kamu bisa:
 * - "" (kosong) -> pakai "/api" (relative)
 * - "http://domain" -> jadi "http://domain/api"
 * - "http://domain/api" -> tetap
 */
function getApiRoot() {
    const raw = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");
    if (!raw) return "/api";
    if (/\/api$/i.test(raw)) return raw;
    return `${raw}/api`;
}

// Origin backend untuk file static (uploads) = tanpa "/api"
function getBackendOrigin(apiRoot) {
    if (!apiRoot) return "";
    if (apiRoot === "/api") return ""; // kalau pakai rewrite/proxy dari frontend
    return apiRoot.replace(/\/api$/i, "");
}

const API_ROOT = getApiRoot();
const BACKEND_ORIGIN = getBackendOrigin(API_ROOT);

// ✅ fallback inline (tidak perlu file /public/no-image.png)
const FALLBACK_IMG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
    <rect width="100%" height="100%" fill="#f1f5f9"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
      fill="#64748b" font-family="Arial" font-size="42">No Image</text>
  </svg>`);

function normalizePath(url) {
    if (!url) return null;
    return String(url).trim().replace(/\\/g, "/");
}

function toAbsoluteFileUrl(url) {
    const u = normalizePath(url);
    if (!u) return null;

    // absolute http/https
    if (/^https?:\/\//i.test(u)) return u;

    // data/blob
    if (u.startsWith("data:") || u.startsWith("blob:")) return u;

    // relative path => jadikan absolute ke BACKEND_ORIGIN (tanpa /api)
    const path = u.startsWith("/") ? u : `/${u}`;

    // kalau BACKEND_ORIGIN kosong, pakai path apa adanya (butuh rewrite /uploads di frontend)
    if (!BACKEND_ORIGIN) return path;

    return `${BACKEND_ORIGIN}${path}`;
}

function safeImg(url) {
    return toAbsoluteFileUrl(url) || FALLBACK_IMG;
}

function pickArchitectList(payload) {
    const directArray =
        Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.architects)
                ? payload.architects
                : Array.isArray(payload?.data?.architects)
                    ? payload.data.architects
                    : Array.isArray(payload?.data?.data)
                        ? payload.data.data
                        : Array.isArray(payload?.data?.data?.architects)
                            ? payload.data.data.architects
                            : [];

    const cleaned = directArray.filter((x) => x && (x.name || x.email || x.phone || x.areaPengalaman || x.tahunPengalaman));
    const pagination = payload?.pagination || payload?.data?.pagination || payload?.data?.data?.pagination || null;
    return { list: cleaned, pagination };
}

function ArchitectCard({ item }) {
    const pickUrl = (it) => it?.profilePictureUrl || it?.avatarUrl;

    const [imgSrc, setImgSrc] = useState(() => safeImg(pickUrl(item)));

    useEffect(() => {
        setImgSrc(safeImg(pickUrl(item)));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item?.profilePictureUrl, item?.avatarUrl]);

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-40 w-full bg-slate-100">
                <img
                    src={imgSrc}
                    alt={item?.name || "Architect"}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                        // cegah loop
                        if (e.currentTarget.src === FALLBACK_IMG) return;
                        setImgSrc(FALLBACK_IMG);
                    }}
                />
            </div>

            <div className="p-5">
                <div className="text-sm font-extrabold text-slate-900">{item?.name || "-"}</div>

                <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">
                    {item?.areaPengalaman || item?.bio || "—"}
                </p>

                <div className="mt-4">
                    <Link
                        to={`/architects/${item?.id}`}
                        className="inline-flex h-9 w-full items-center justify-center rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Lihat Profil
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function ArchitectSearchPage() {
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const limit = 12;

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [rows, setRows] = useState([]);
    const [pagination, setPagination] = useState(null);

    // debounce search
    const [debouncedQ, setDebouncedQ] = useState("");
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(q.trim()), 400);
        return () => clearTimeout(t);
    }, [q]);

    // reset page saat search berubah
    useEffect(() => {
        setPage(1);
    }, [debouncedQ]);

    const abortRef = useRef(null);

    useEffect(() => {
        const controller = new AbortController();
        abortRef.current?.abort?.();
        abortRef.current = controller;

        async function run() {
            try {
                setLoading(true);
                setErr("");

                const params = new URLSearchParams({
                    page: String(page),
                    limit: String(limit),
                });

                if (debouncedQ) {
                    params.set("search", debouncedQ);
                    params.set("q", debouncedQ);
                    params.set("keyword", debouncedQ);
                }

                const res = await fetch(`${API_ROOT}/architects/public?${params.toString()}`, {
                    method: "GET",
                    credentials: "include",
                    signal: controller.signal,
                });

                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data?.message || "Gagal mengambil data arsitek");

                const { list, pagination: pag } = pickArchitectList(data);
                setRows(list);
                setPagination(pag);
            } catch (e) {
                if (e?.name === "AbortError") return;
                setErr(e?.message || "Terjadi kesalahan");
                setRows([]);
                setPagination(null);
            } finally {
                setLoading(false);
            }
        }

        run();
        return () => controller.abort();
    }, [page, limit, debouncedQ]);

    const filtered = useMemo(() => rows, [rows]);

    return (
        <div className="mx-auto w-full max-w-7xl px-6 py-10">
            {/* HERO */}
            <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
                <div>
                    <h1 className="text-4xl font-extrabold leading-tight text-slate-900 md:text-5xl">
                        Temukan Arsitek yang
                        <br />
                        Sempurna untuk
                        <br />
                        Proyek Impian Anda
                    </h1>

                    <p className="mt-5 max-w-xl text-sm leading-6 text-slate-600">
                        Jelajahi portofolio arsitek dan desainer. Cari berdasarkan nama atau area pengalaman.
                    </p>

                    <div className="mt-7 w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                            <span className="text-slate-400">🔎</span>
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Cari arsitek berdasarkan nama atau area pengalaman..."
                                className="w-full text-sm outline-none"
                            />
                        </div>

                        <div className="mt-2 text-xs text-slate-500">
                            {loading ? "Memuat..." : `Menampilkan ${filtered.length} arsitek`}
                            {pagination?.total ? ` • Total: ${pagination.total}` : ""}
                        </div>

                        {err ? (
                            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {err}
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                    {/* ✅ Vite: file di /public dipanggil pakai root path */}
                    <img
                        src="/stock_architect.png"
                        alt="architect-hero"
                        className="h-[260px] w-full object-cover md:h-[360px]"
                        loading="lazy"
                        onError={(e) => {
                            // kalau file belum ada, hilangkan saja hero
                            e.currentTarget.style.display = "none";
                        }}
                    />
                </div>
            </section>

            {/* LIST */}
            <section className="mt-12">
                <h2 className="text-2xl font-extrabold text-slate-900">Jelajahi Arsitek Profesional</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                    Klik profil untuk melihat detail, sertifikasi, portfolio, dan desain.
                </p>

                <div className="mt-6">
                    {loading ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                            Memuat data...
                        </div>
                    ) : filtered.length ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {filtered.map((a) => (
                                <ArchitectCard key={a.id} item={a} />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                            Tidak ada arsitek ditemukan.
                        </div>
                    )}
                </div>

                {/* pagination */}
                {pagination?.totalPages ? (
                    <div className="mt-6 flex items-center gap-2">
                        <button
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1 || loading}
                        >
                            Prev
                        </button>
                        <div className="text-xs text-slate-600">
                            Page {page} / {pagination.totalPages}
                        </div>
                        <button
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50"
                            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                            disabled={page >= pagination.totalPages || loading}
                        >
                            Next
                        </button>
                    </div>
                ) : null}
            </section>
        </div>
    );
}
