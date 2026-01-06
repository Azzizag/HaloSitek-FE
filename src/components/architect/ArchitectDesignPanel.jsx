import { useEffect, useMemo, useState } from "react";
import { FiEdit3, FiTrash2, FiRefreshCw } from "react-icons/fi";
import DesignEditModal from "./EditDesignModal";
import { deleteMyDesign, getMyDesigns, normalizeFileUrl, toStringArray } from "../../lib/apiDesigns";

/**
 * List "Design Saya" (architect/my-designs)
 * - tampilkan: judul, kategori, views (tanpa uniqueViewers)
 * - edit & delete
 * Endpoint list/update/delete ada di apiDesigns.js :contentReference[oaicite:6]{index=6}
 */

function Banner({ type = "info", title, desc }) {
    const styles =
        type === "error"
            ? "border-red-200 bg-red-50 text-red-700"
            : type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-700";

    return (
        <div className={`rounded-xl border p-4 text-sm ${styles}`}>
            {title && <div className="font-semibold">{title}</div>}
            {desc && <div className="mt-1 opacity-90">{desc}</div>}
        </div>
    );
}

function Chip({ text }) {
    return (
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
            {text}
        </span>
    );
}

function getThumb(design) {
    const bangunan = toStringArray(design?.foto_bangunan).map(normalizeFileUrl).filter(Boolean);
    if (bangunan.length) return bangunan[0];
    const denah = toStringArray(design?.foto_denah).map(normalizeFileUrl).filter(Boolean);
    if (denah.length) return denah[0];
    return null;
}

export default function ArchitectDesignsPanel() {
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [error, setError] = useState("");

    const [designs, setDesigns] = useState([]);
    const [editTarget, setEditTarget] = useState(null);

    const empty = useMemo(() => !loading && !designs?.length, [loading, designs]);

    async function fetchDesigns() {
        try {
            setLoading(true);
            setError("");

            // controller saat ini return array langsung (data), jadi aman kita anggap array.
            // :contentReference[oaicite:7]{index=7}
            const data = await getMyDesigns({ page: 1, limit: 50 });
            const arr = Array.isArray(data) ? data : (data?.data || []);

            setDesigns(arr);
        } catch (e) {
            setError(e?.message || "Gagal mengambil daftar design");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchDesigns();
    }, []);

    async function onDelete(design) {
        if (!design?.id) return;
        const ok = window.confirm(`Hapus design "${design.title}"?`);
        if (!ok) return;

        try {
            setBusyId(design.id);
            setError("");

            await deleteMyDesign(design.id); // :contentReference[oaicite:8]{index=8}
            setDesigns((prev) => prev.filter((d) => d.id !== design.id));
        } catch (e) {
            setError(e?.message || "Gagal menghapus design");
        } finally {
            setBusyId(null);
        }
    }

    function onSaved(updated) {
        // backend update biasanya tidak kirim views, jadi kita merge views dari item lama
        setDesigns((prev) =>
            prev.map((d) => {
                if (d.id !== updated?.id) return d;
                return {
                    ...d,
                    ...updated,
                    views: d.views ?? 0,
                };
            })
        );
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="text-lg font-extrabold text-slate-900">Design Saya</div>
                    <div className="mt-1 text-sm text-slate-500">
                        Menampilkan <b>judul</b>, <b>kategori</b>, dan <b>views</b>.
                    </div>
                </div>

                <button
                    type="button"
                    onClick={fetchDesigns}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    disabled={loading}
                >
                    <FiRefreshCw />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="mt-4">
                    <Banner type="error" title="Terjadi kesalahan" desc={error} />
                </div>
            )}

            {loading && (
                <div className="mt-6 text-sm text-slate-500">Memuat design...</div>
            )}

            {empty && (
                <div className="mt-6 text-sm text-slate-500">Belum ada design.</div>
            )}

            {!loading && designs?.length > 0 && (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {designs.map((d) => {
                        const thumb = getThumb(d);
                        return (
                            <div key={d.id} className="overflow-hidden rounded-2xl border border-slate-200">
                                <div className="h-36 bg-slate-50">
                                    {thumb ? (
                                        <img src={thumb} alt="thumb" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="grid h-full place-items-center text-xs text-slate-400">
                                            Tidak ada foto
                                        </div>
                                    )}
                                </div>

                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-extrabold text-slate-900">
                                                {d.title || "(Tanpa Judul)"}
                                            </div>
                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <Chip text={d.kategori || "-"} />
                                                <span className="text-xs text-slate-500">
                                                    Views: <span className="font-semibold text-slate-700">{Number(d.views || 0)}</span>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                                onClick={() => setEditTarget(d)}
                                                disabled={busyId === d.id}
                                                title="Edit design"
                                            >
                                                <FiEdit3 />
                                            </button>
                                            <button
                                                type="button"
                                                className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                                                onClick={() => onDelete(d)}
                                                disabled={busyId === d.id}
                                                title="Hapus design"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </div>

                                    {busyId === d.id && (
                                        <div className="mt-3 text-xs text-slate-500">Memproses...</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <DesignEditModal
                open={!!editTarget}
                design={editTarget}
                onClose={() => setEditTarget(null)}
                onSaved={onSaved}
            />
        </div>
    );
}
