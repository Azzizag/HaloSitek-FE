// src/pages/DesignDetailPage.jsx
import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getDesignById, normalizeFileUrl } from "../../lib/apiDesigns";

export default function DesignDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [errMsg, setErrMsg] = useState("");
    const [data, setData] = useState(null);

    // ✅ gambar utama yang bisa diganti
    const [activeImage, setActiveImage] = useState("");

    // ✅ modal zoom fullscreen
    const [zoomOpen, setZoomOpen] = useState(false);

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                setLoading(true);
                setErrMsg("");

                const d = await getDesignById(id);
                if (!alive) return;

                // mapping supaya sesuai UI lama kamu
                const bangunan = Array.isArray(d?.foto_bangunan) ? d.foto_bangunan : [];
                const denah = Array.isArray(d?.foto_denah) ? d.foto_denah : [];

                const hero = normalizeFileUrl(bangunan[0] || denah[0]);

                const mapped = {
                    id: d?.id,
                    title: d?.title || "Untitled",
                    completedAt: d?.updatedAt
                        ? `Terakhir diperbarui ${new Date(d.updatedAt).toLocaleDateString("id-ID")}`
                        : "",
                    hero: hero || "https://via.placeholder.com/1800x900?text=No+Image",
                    gallery: bangunan.slice(0, 10).map(normalizeFileUrl).filter(Boolean),
                    about: d?.description || "-",
                    details: {
                        Kategori: d?.kategori || "-",
                        "Luas Bangunan": d?.luas_bangunan ? `${d.luas_bangunan} m²` : "-",
                        "Luas Tanah": d?.luas_tanah ? `${d.luas_tanah} m²` : "-",
                    },
                    philosophyTitle: "Denah / Detail Teknis",
                    philosophy: denah.length
                        ? "Berikut adalah foto denah yang diunggah arsitek untuk proyek ini."
                        : "Belum ada foto denah untuk proyek ini.",
                    denahImages: denah.map(normalizeFileUrl).filter(Boolean),

                    // ✅ arsitek
                    architect: {
                        id: d?.architect?.id, // ✅ dibutuhkan untuk navigasi
                        name: d?.architect?.name || "Arsitek",
                        title: d?.architect?.tahunPengalaman
                            ? `${d.architect.tahunPengalaman} Tahun Pengalaman`
                            : "Arsitek",
                        company: "HaloSitek",
                        avatar:
                            normalizeFileUrl(d?.architect?.profilePictureUrl) ||
                            "https://via.placeholder.com/256x256?text=Avatar",
                    },

                    // ✅ tambah: statistik views dari backend
                    views: typeof d?.views === "number" ? d.views : Number(d?.views || 0),
                    uniqueViewers:
                        typeof d?.uniqueViewers === "number"
                            ? d.uniqueViewers
                            : Number(d?.uniqueViewers || 0),
                    viewsBreakdown: d?.viewsBreakdown || null,
                };

                setData(mapped);

                // ✅ set gambar utama awal = hero
                setActiveImage(mapped.hero);
            } catch (e) {
                if (!alive) return;
                setErrMsg(e?.response?.data?.message || e?.message || "Gagal mengambil detail design");
                setData(null);
                setActiveImage("");
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [id]);

    // ✅ ESC untuk tutup modal
    useEffect(() => {
        function onKeyDown(e) {
            if (e.key === "Escape") setZoomOpen(false);
        }
        if (zoomOpen) window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [zoomOpen]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <div className="mx-auto max-w-7xl px-6 py-10">
                    <div className="h-10 w-2/3 animate-pulse rounded bg-slate-100" />
                    <div className="mt-4 h-6 w-1/3 animate-pulse rounded bg-slate-100" />
                    <div className="mt-8 h-72 animate-pulse rounded-2xl bg-slate-100" />
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-white">
                <div className="mx-auto max-w-7xl px-6 py-10">
                    <Link
                        to="/catalog/results"
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        ← Kembali ke Proyek
                    </Link>
                    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {errMsg || "Data tidak ditemukan"}
                    </div>
                </div>
            </div>
        );
    }

    const heroSrc = activeImage || data.hero;
    const architectId = data?.architect?.id;

    const usersViews = data?.viewsBreakdown?.users?.views ?? null;
    const usersUnique = data?.viewsBreakdown?.users?.unique ?? null;
    const archViews = data?.viewsBreakdown?.architects?.views ?? null;
    const archUnique = data?.viewsBreakdown?.architects?.unique ?? null;

    return (
        <div className="min-h-screen bg-white">
            <main className="mx-auto max-w-7xl px-6 py-10">
                <Link
                    to="/catalog/results"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                    ← Kembali ke Proyek
                </Link>

                <h1 className="mt-6 text-4xl font-extrabold leading-tight text-slate-900">{data.title}</h1>
                <p className="mt-2 text-sm text-slate-500">{data.completedAt || ""}</p>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold">
                        👁️ {Number(data?.views || 0).toLocaleString("id-ID")} tayangan
                    </span>
                </div>


                {/* HERO */}
                <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                    <img
                        src={heroSrc}
                        alt="hero"
                        className="h-[360px] w-full cursor-zoom-in object-cover"
                        onClick={() => setZoomOpen(true)}
                        title="Klik untuk zoom"
                    />
                </div>

                {/* GALLERY thumbs */}
                {Array.isArray(data.gallery) && data.gallery.length > 0 && (
                    <div className="mt-4 grid grid-cols-5 gap-3">
                        {data.gallery.slice(0, 5).map((src, idx) => {
                            const isActive = src === heroSrc;
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setActiveImage(src)}
                                    className={[
                                        "overflow-hidden rounded-2xl border bg-slate-100 transition",
                                        isActive ? "border-slate-900 ring-2 ring-slate-900" : "border-slate-200 hover:border-slate-400",
                                    ].join(" ")}
                                    title="Klik untuk jadikan gambar utama"
                                >
                                    <img src={src} alt={`g-${idx}`} className="h-20 w-full object-cover" />
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* ARCHITECT CARD */}
                <div
                    className={[
                        "mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm",
                        architectId ? "cursor-pointer hover:bg-slate-50" : "",
                    ].join(" ")}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                        if (architectId) navigate(`/architects/${architectId}`);
                    }}
                    onKeyDown={(e) => {
                        if (!architectId) return;
                        if (e.key === "Enter" || e.key === " ") navigate(`/architects/${architectId}`);
                    }}
                    title={architectId ? "Lihat profil arsitek" : "Arsitek tidak tersedia"}
                >
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 overflow-hidden rounded-full bg-slate-100">
                                <img src={data.architect?.avatar} alt="arch" className="h-full w-full object-cover" />
                            </div>
                            <div>
                                <div className="text-sm font-extrabold text-slate-900">{data.architect?.name}</div>
                                <div className="text-xs text-slate-500">{data.architect?.title}</div>
                            </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700">
                            {data.architect?.company || "HaloSitek"}
                        </div>
                    </div>
                </div>

                {/* ABOUT + DETAILS */}
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="text-lg font-extrabold text-slate-900">Tentang Proyek</div>
                        <p className="mt-4 text-sm leading-6 text-slate-600">{data.about}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="text-lg font-extrabold text-slate-900">Rincian Proyek</div>

                        <div className="mt-5 space-y-3 text-sm">
                            {Object.entries(data.details || {}).map(([k, v]) => (
                                <div key={k}>
                                    <div className="text-xs font-bold text-slate-700">{k}</div>
                                    <div className="mt-1 text-xs text-slate-600">{v}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Denah */}
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="text-lg font-extrabold text-slate-900">{data.philosophyTitle || "Denah / Detail Teknis"}</div>
                    <div className="mt-4 text-sm leading-6 text-slate-600">{data.philosophy}</div>

                    {Array.isArray(data.denahImages) && data.denahImages.length > 0 && (
                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            {data.denahImages.map((src, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                                    onClick={() => {
                                        setActiveImage(src);
                                        setZoomOpen(true);
                                    }}
                                    title="Klik untuk zoom"
                                >
                                    <img src={src} alt={`denah-${i}`} className="h-64 w-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* MODAL ZOOM FULLSCREEN */}
            {zoomOpen && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
                    onClick={() => setZoomOpen(false)}
                >
                    <div
                        className="relative max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-black"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="absolute right-3 top-3 rounded-lg bg-white/10 px-3 py-2 text-sm font-bold text-white hover:bg-white/20"
                            onClick={() => setZoomOpen(false)}
                            title="Tutup"
                        >
                            ✕
                        </button>

                        <div className="flex max-h-[92vh] items-center justify-center">
                            <img src={heroSrc} alt="zoom" className="max-h-[92vh] w-auto max-w-full object-contain" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
