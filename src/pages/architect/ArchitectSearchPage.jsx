// src/pages/architect/ArchitectSearchPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const FALLBACK_IMG = "/no-image.png"; // pastikan ADA di /public/no-image.png

function isFallbackSrc(src) {
    try {
        const u = new URL(src, window.location.origin);
        return u.pathname.endsWith(FALLBACK_IMG);
    } catch {
        return String(src || "").endsWith(FALLBACK_IMG);
    }
}

function safeImg(url) {
    const s = (url || "").toString().trim();
    return s ? s : FALLBACK_IMG;
}

function pickArchitectList(payload) {
    // payload = hasil res.json()
    // kita dukung beberapa bentuk:
    // 1) { success, data: [ ... ] }
    // 2) { success, data: { architects: [...], pagination: {...} } }
    // 3) { data: { data: [...], pagination: {...} } } (kadang dibungkus)
    // 4) { architects: [...] }

    const directArray =
        Array.isArray(payload?.data) ? payload.data :
            Array.isArray(payload?.architects) ? payload.architects :
                Array.isArray(payload?.data?.architects) ? payload.data.architects :
                    Array.isArray(payload?.data?.data) ? payload.data.data :
                        Array.isArray(payload?.data?.data?.architects) ? payload.data.data.architects :
                            [];

    // kalau backend sempat “campur” data desain + arsitek,
    // kita filter yang bentuknya arsitek (punya name/email/phone)
    const cleaned = directArray.filter((x) => {
        const hasArchitectShape =
            x && (x.name || x.email || x.phone || x.areaPengalaman || x.tahunPengalaman);
        return Boolean(hasArchitectShape);
    });

    const pagination =
        payload?.pagination ||
        payload?.data?.pagination ||
        payload?.data?.data?.pagination ||
        null;

    return { list: cleaned, pagination };
}

function ArchitectCard({ item }) {
    const [imgSrc, setImgSrc] = useState(() =>
        safeImg(item?.profilePictureUrl || item?.avatarUrl)
    );

    useEffect(() => {
        setImgSrc(safeImg(item?.profilePictureUrl || item?.avatarUrl));
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
                        // ✅ cegah infinite loop
                        if (isFallbackSrc(e.currentTarget.src)) return;
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

    // debounce search supaya tidak spam request saat mengetik
    const [debouncedQ, setDebouncedQ] = useState("");
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(q.trim()), 400);
        return () => clearTimeout(t);
    }, [q]);

    // reset page saat search berubah (penting kalau nanti ada pagination)
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

                // ✅ kirim beberapa key biar kompatibel dengan backend yang beda-beda
                if (debouncedQ) {
                    params.set("search", debouncedQ);
                    params.set("q", debouncedQ);
                    params.set("keyword", debouncedQ);
                }

                const res = await fetch(
                    `${API_BASE_URL}/api/architects/public?${params.toString()}`,
                    {
                        method: "GET",
                        credentials: "include",
                        signal: controller.signal,
                    }
                );

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
                    <img
                        src="https://images.unsplash.com/photo-1529421308418-eab98863cee5?auto=format&fit=crop&w=1800&q=80"
                        alt="architect-hero"
                        className="h-[260px] w-full object-cover md:h-[300px]"
                        loading="lazy"
                        onError={(e) => {
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

                {/* (Opsional) pagination UI kalau kamu butuh */}
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
