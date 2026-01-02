// src/pages/admin/DesignManagementPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    FiSearch,
    FiRefreshCcw,
    FiEdit2,
    FiTrash2,
    FiX,
    FiCheckCircle,
    FiAlertTriangle,
    FiUpload,
    FiSave,
} from "react-icons/fi";
import { apiAdmin } from "../../lib/apiAdmin";
import { getAdminToken, clearAdminToken } from "../../lib/adminAuth";

/* =========================
   Config
========================= */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "").replace(/\/$/, "");

const ENDPOINTS = {
    // public list
    listPublic: (page, limit) => `/api/designs?page=${page}&limit=${limit}`,

    // ✅ admin endpoints (ubah kalau route kamu beda)
    adminUpdate: (id) => `/api/designs/admin/${id}`,
    adminDelete: (id) => `/api/designs/admin/${id}`,
};

/* =========================
   Utils
========================= */
function isUnauthorized(err) {
    return String(err?.message || "").includes("UNAUTHORIZED");
}

function goLogin(navigateFn) {
    clearAdminToken();
    navigateFn?.("/admin/login", { replace: true });
}

function formatDate(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(d);
}

function safeJsonArray(v) {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    if (typeof v === "string") {
        try {
            const parsed = JSON.parse(v);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
}

// foto biasanya tersimpan "uploads/designs/images/...."
// atau kadang "designs/images/...."
function resolveImageUrl(maybePath) {
    if (!maybePath) return "";
    const s = String(maybePath).replaceAll("\\", "/").trim();
    if (!s) return "";
    if (s.startsWith("http://") || s.startsWith("https://")) return s;

    const p = s.replace(/^\/+/, "");
    if (p.startsWith("uploads/")) return `${API_ORIGIN}/${encodeURI(p)}`;
    return `${API_ORIGIN}/uploads/${encodeURI(p)}`;
}

const FALLBACK_DATA_URI =
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="800" height="450">
    <rect width="100%" height="100%" fill="#f1f5f9"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
      fill="#64748b" font-family="Arial" font-size="24">
      No Image
    </text>
  </svg>
`);

/** fetch admin yang bisa handle FormData (apiAdmin kamu selalu set JSON content-type) */
async function adminFetch(path, { method = "GET", body, headers } = {}) {
    const token = getAdminToken();
    const isFormData = body instanceof FormData;

    const res = await fetch(`${API_BASE_URL}${path}`, {
        method,
        body,
        credentials: "include",
        headers: {
            ...(isFormData ? {} : { "Content-Type": "application/json" }),
            ...(headers || {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    if (res.status === 401) {
        clearAdminToken();
        const err = new Error("UNAUTHORIZED");
        err.status = 401;
        throw err;
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = data?.message || "Request failed";
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

/* =========================
   Small UI
========================= */
function Toast({ text, onClose }) {
    if (!text) return null;
    return (
        <div className="flex items-center justify-end">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200">
                <FiCheckCircle />
                <span>{text}</span>
                <button className="ml-4 text-slate-500 hover:text-slate-800" onClick={onClose} aria-label="Close toast">
                    <FiX />
                </button>
            </div>
        </div>
    );
}

function InlineError({ children }) {
    if (!children) return null;
    return (
        <div className="flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white">
            <FiAlertTriangle className="text-base" />
            <span>{children}</span>
        </div>
    );
}

function ConfirmModal({ open, title, desc, confirmText = "Hapus", onClose, onConfirm, loading }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
                        <p className="mt-1 text-sm text-slate-500">{desc}</p>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" disabled={loading}>
                        <FiX />
                    </button>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                        {loading ? "Menghapus..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

function EditModal({ open, initial, onClose, onSave, saving }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [kategori, setKategori] = useState("");
    const [luasBangunan, setLuasBangunan] = useState("");
    const [luasTanah, setLuasTanah] = useState("");
    const [fotoBangunan, setFotoBangunan] = useState([]);
    const [fotoDenah, setFotoDenah] = useState([]);

    useEffect(() => {
        if (!open) return;
        setTitle(initial?.title || "");
        setDescription(initial?.description || "");
        setKategori(initial?.kategori || "");
        setLuasBangunan(initial?.luas_bangunan || "");
        setLuasTanah(initial?.luas_tanah || "");
        setFotoBangunan([]);
        setFotoDenah([]);
    }, [open, initial]);

    if (!open) return null;

    const coverUrl = initial?.coverUrl || "";

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
                    <div className="min-w-0">
                        <h3 className="text-lg font-extrabold text-slate-900">Edit Design</h3>
                        <p className="mt-1 text-sm text-slate-500">Update metadata (opsional: ganti foto bangunan/denah)</p>
                    </div>
                    <button onClick={onClose} disabled={saving} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                        <FiX />
                    </button>
                </div>

                <div className="grid gap-6 p-5 md:grid-cols-[1fr_260px]">
                    {/* left form */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-slate-700">Judul</label>
                            <input
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                disabled={saving}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-slate-700">Deskripsi</label>
                            <textarea
                                className="mt-2 min-h-[120px] w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-slate-300"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={saving}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-semibold text-slate-700">Kategori</label>
                                <input
                                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                                    value={kategori}
                                    onChange={(e) => setKategori(e.target.value)}
                                    disabled={saving}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-700">Luas Bangunan</label>
                                <input
                                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                                    value={luasBangunan}
                                    onChange={(e) => setLuasBangunan(e.target.value)}
                                    disabled={saving}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-700">Luas Tanah</label>
                                <input
                                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                                    value={luasTanah}
                                    onChange={(e) => setLuasTanah(e.target.value)}
                                    disabled={saving}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-semibold text-slate-700">Ganti Foto Bangunan (opsional)</label>
                                <label className="mt-2 block">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="hidden"
                                        disabled={saving}
                                        onChange={(e) => setFotoBangunan(Array.from(e.target.files || []))}
                                    />
                                    <div className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 ${saving ? "opacity-60 pointer-events-none" : ""}`}>
                                        <FiUpload />
                                        {fotoBangunan.length ? `${fotoBangunan.length} file dipilih` : "Pilih file"}
                                    </div>
                                </label>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700">Ganti Foto Denah (opsional)</label>
                                <label className="mt-2 block">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="hidden"
                                        disabled={saving}
                                        onChange={(e) => setFotoDenah(Array.from(e.target.files || []))}
                                    />
                                    <div className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 ${saving ? "opacity-60 pointer-events-none" : ""}`}>
                                        <FiUpload />
                                        {fotoDenah.length ? `${fotoDenah.length} file dipilih` : "Pilih file"}
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* right preview */}
                    <div className="space-y-3">
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                            {coverUrl ? (
                                <img
                                    src={coverUrl}
                                    alt="cover"
                                    className="h-44 w-full object-cover"
                                    onError={(e) => {
                                        const el = e.currentTarget;
                                        el.onerror = null;
                                        el.src = FALLBACK_DATA_URI;
                                    }}
                                />
                            ) : (
                                <div className="grid h-44 place-items-center text-sm text-slate-500">No Image</div>
                            )}
                        </div>

                        <button
                            onClick={() =>
                                onSave({
                                    title,
                                    description,
                                    kategori,
                                    luas_bangunan: luasBangunan,
                                    luas_tanah: luasTanah,
                                    foto_bangunan: fotoBangunan,
                                    foto_denah: fotoDenah,
                                })
                            }
                            disabled={saving}
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-800 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                        >
                            <FiSave />
                            {saving ? "Menyimpan..." : "Simpan Perubahan"}
                        </button>

                        <p className="text-xs text-slate-500">
                            Jika kamu upload foto baru, backend biasanya akan mengganti (dan menghapus file lama).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* =========================
   Page
========================= */
export default function DesignManagementPage() {
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [toast, setToast] = useState("");

    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const limit = 12;

    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({ totalPages: 1, total: 0 });

    // edit modal
    const [editOpen, setEditOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [savingEdit, setSavingEdit] = useState(false);

    // delete modal
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchList = useCallback(async () => {
        try {
            setLoading(true);
            setErr("");

            const res = await apiAdmin(ENDPOINTS.listPublic(page, limit));

            const data = res?.data;
            const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
            setRows(items);

            const m = data?.meta || data?.pagination;
            if (m) {
                setMeta({
                    totalPages: Number(m.totalPages ?? m.pages ?? 1),
                    total: Number(m.total ?? m.count ?? items.length),
                });
            } else {
                setMeta({ totalPages: 1, total: items.length });
            }
        } catch (e) {
            setErr(e?.message || "Gagal mengambil data desain");
            setRows([]);
            setMeta({ totalPages: 1, total: 0 });
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const items = useMemo(() => {
        return rows.map((d) => {
            const fotoBangunan = safeJsonArray(d?.foto_bangunan);
            const coverRaw = fotoBangunan?.[0] || null;

            return {
                id: d?.id || d?.designId || d?.design_id,
                title: d?.title || "-",
                description: d?.description || "",
                kategori: d?.kategori || "-",
                luas_bangunan: d?.luas_bangunan || "-",
                luas_tanah: d?.luas_tanah || "-",
                createdAt: d?.createdAt || null,
                architectName: d?.architectName || d?.architect?.name || "-",
                coverUrl: resolveImageUrl(coverRaw),
            };
        });
    }, [rows]);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return items;
        return items.filter((d) => {
            return (
                String(d.title).toLowerCase().includes(s) ||
                String(d.kategori).toLowerCase().includes(s) ||
                String(d.architectName).toLowerCase().includes(s)
            );
        });
    }, [items, q]);

    const openEdit = (item) => {
        setToast("");
        setErr("");
        setEditItem(item);
        setEditOpen(true);
    };

    const saveEdit = async (payload) => {
        if (!editItem?.id) return;

        try {
            setSavingEdit(true);
            setErr("");
            setToast("");

            // pakai FormData supaya bisa upload foto jika dipilih
            const fd = new FormData();
            fd.append("title", payload.title ?? "");
            fd.append("description", payload.description ?? "");
            fd.append("kategori", payload.kategori ?? "");
            fd.append("luas_bangunan", payload.luas_bangunan ?? "");
            fd.append("luas_tanah", payload.luas_tanah ?? "");

            (payload.foto_bangunan || []).forEach((f) => fd.append("foto_bangunan", f));
            (payload.foto_denah || []).forEach((f) => fd.append("foto_denah", f));

            await adminFetch(ENDPOINTS.adminUpdate(editItem.id), {
                method: "PUT",
                body: fd,
            });

            setEditOpen(false);
            setEditItem(null);
            setToast("Desain berhasil diupdate");
            fetchList();
        } catch (e) {
            if (isUnauthorized(e)) {
                // kalau admin token expired
                setErr("UNAUTHORIZED");
                return;
            }
            setErr(e?.message || "Gagal update desain");
        } finally {
            setSavingEdit(false);
        }
    };

    const askDelete = (item) => {
        setToast("");
        setErr("");
        setDeleteTarget(item);
    };

    const confirmDelete = async () => {
        if (!deleteTarget?.id) return;

        try {
            setDeleting(true);
            setErr("");
            setToast("");

            // delete: aman pakai apiAdmin
            await apiAdmin(ENDPOINTS.adminDelete(deleteTarget.id), { method: "DELETE" });

            setRows((prev) => prev.filter((x) => (x?.id || x?.designId) !== deleteTarget.id));
            setDeleteTarget(null);
            setToast("Desain berhasil dihapus");
        } catch (e) {
            if (isUnauthorized(e)) {
                setErr("UNAUTHORIZED");
                return;
            }
            setErr(e?.message || "Gagal menghapus desain");
        } finally {
            setDeleting(false);
        }
    };

    const canPrev = page > 1 && !loading;
    const canNext = !loading && (meta.totalPages ? page < meta.totalPages : true);

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900">Design Management</h2>
                    <p className="mt-1 text-sm text-slate-500">Kelola desain (Admin: edit & hapus)</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Cari judul / kategori / arsitek..."
                            className="h-10 w-[320px] rounded-2xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-slate-300"
                        />
                    </div>

                    <button
                        onClick={fetchList}
                        disabled={loading}
                        className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                        <FiRefreshCcw />
                        Refresh
                    </button>
                </div>
            </header>

            <Toast text={toast} onClose={() => setToast("")} />

            {err ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                    <InlineError>{err}</InlineError>
                    {String(err).includes("UNAUTHORIZED") ? (
                        <div className="mt-2 text-xs text-red-700">
                            Token admin tidak valid / expired. Silakan login ulang.
                        </div>
                    ) : null}
                </div>
            ) : null}

            <section className="rounded-2xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <div className="text-sm font-bold text-slate-900">Daftar Design</div>
                    <div className="text-xs text-slate-500">
                        Page {page} / {meta.totalPages || 1} • Total {meta.total || filtered.length}
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-sm text-slate-500">Memuat data...</div>
                ) : filtered.length ? (
                    <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                        {filtered.map((item) => (
                            <div key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="h-40 w-full bg-slate-100">
                                    {item.coverUrl ? (
                                        <img
                                            src={item.coverUrl}
                                            alt={item.title}
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                            onError={(e) => {
                                                const el = e.currentTarget;
                                                el.onerror = null;
                                                el.src = FALLBACK_DATA_URI; // ✅ tidak ada request loop
                                            }}
                                        />
                                    ) : (
                                        <div className="grid h-full place-items-center text-sm text-slate-500">No Image</div>
                                    )}
                                </div>

                                <div className="p-4">
                                    <div className="truncate text-lg font-extrabold text-slate-900">{item.title}</div>
                                    <div className="mt-1 text-xs text-slate-500">{item.kategori}</div>

                                    <div className="mt-3 text-xs text-slate-700">
                                        Bangunan: <span className="font-semibold">{item.luas_bangunan}</span> • Tanah:{" "}
                                        <span className="font-semibold">{item.luas_tanah}</span>
                                    </div>

                                    <div className="mt-2 text-xs text-slate-500">
                                        Arsitek: <span className="font-semibold">{item.architectName}</span>
                                    </div>

                                    <div className="mt-3 text-xs text-slate-500">Dibuat {formatDate(item.createdAt)}</div>

                                    <div className="mt-4 flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => openEdit(item)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            <FiEdit2 />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => askDelete(item)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                                        >
                                            <FiTrash2 />
                                            Hapus
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-sm text-slate-500">Tidak ada data.</div>
                )}

                <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={!canPrev}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                    >
                        Prev
                    </button>

                    <button
                        onClick={() => setPage((p) => p + 1)}
                        disabled={!canNext}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </section>

            {/* Edit Modal */}
            <EditModal
                open={editOpen}
                initial={editItem}
                onClose={() => (savingEdit ? null : setEditOpen(false))}
                onSave={saveEdit}
                saving={savingEdit}
            />

            {/* Delete Confirm */}
            <ConfirmModal
                open={Boolean(deleteTarget)}
                title="Hapus Design?"
                desc={deleteTarget ? `Anda yakin ingin menghapus design "${deleteTarget.title}"? File gambar juga akan ikut terhapus.` : ""}
                onClose={() => (deleting ? null : setDeleteTarget(null))}
                onConfirm={confirmDelete}
                loading={deleting}
            />
        </div>
    );
}
