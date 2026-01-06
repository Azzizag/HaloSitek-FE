// src/pages/admin/ArsipediaEditorPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiX, FiCheckCircle, FiTrash2, FiUpload, FiSave, FiSend } from "react-icons/fi";
import { apiAdmin } from "../../lib/apiAdmin";
import { clearAdminToken, getAdminToken } from "../../lib/adminAuth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ENDPOINTS = {
    list: "/arsipedia",
    detail: (id) => `/arsipedia/${id}`,
    create: "/arsipedia", // multipart + image required
    update: (id) => `/arsipedia/${id}`, // json
    remove: (id) => `/arsipedia/${id}`,
};

// decode JWT payload (tanpa verifikasi) untuk ambil adminId
function parseJwt(token) {
    try {
        const part = token.split(".")[1];
        const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
        const json = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        return JSON.parse(json);
    } catch {
        return null;
    }
}

function resolveUploadsUrl(imagePath) {
    if (!imagePath) return null;

    // kalau sudah absolute URL
    const s = String(imagePath);
    if (s.startsWith("http://") || s.startsWith("https://")) return s;

    const base = API_BASE_URL.replace(/\/$/, "");

    // ubah backslash windows jadi slash
    let p = s.replace(/\\/g, "/");

    // pastikan prefix /uploads/
    // imagePath biasanya: "arsipedia_images/xxx.jpg"
    // jadi url final: /uploads/arsipedia_images/xxx.jpg
    p = p.replace(/^\/+/, ""); // trim leading /
    return `${base}/uploads/${encodeURI(p)}`;
}

function Toast({ text, onClose }) {
    if (!text) return null;
    return (
        <div className="flex items-center justify-end">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200">
                <FiCheckCircle className="text-slate-700" />
                <span>{text}</span>
                <button className="ml-4 text-slate-500 hover:text-slate-800" onClick={onClose}>
                    <FiX />
                </button>
            </div>
        </div>
    );
}

function ConfirmModal({ open, title, desc, confirmText = "Hapus", onClose, onConfirm, loading }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
                        <p className="mt-1 text-sm text-slate-500">{desc}</p>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
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

export default function ArsipediaEditorPage() {
    const navigate = useNavigate();
    const { id } = useParams(); // "new" atau UUID
    const isNew = id === "new" || !id;

    const [loading, setLoading] = useState(!isNew);
    const [toast, setToast] = useState("");
    const [err, setErr] = useState("");

    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // form
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [status, setStatus] = useState("draft"); // draft|published
    const [tags, setTags] = useState("");
    const [imageFile, setImageFile] = useState(null);

    // preview existing imagePath
    const [imagePath, setImagePath] = useState(null);
    const [imageUrl, setImageUrl] = useState(null);

    const adminId = useMemo(() => {
        const token = getAdminToken();
        const payload = token ? parseJwt(token) : null;
        return payload?.id || payload?.adminId || null;
    }, []);

    async function fetchDetail(articleId) {
        try {
            setLoading(true);
            setErr("");

            const res = await apiAdmin(ENDPOINTS.detail(articleId));
            const a = res?.data;

            setTitle(a?.title ?? "");
            setContent(a?.content ?? "");
            setStatus(a?.status ?? "draft");
            setTags(a?.tags ?? "");
            setImagePath(a?.imagePath ?? null);

            const url = resolveUploadsUrl(a?.imagePath);
            setImageUrl(url);
        } catch (e) {
            if (String(e.message).includes("UNAUTHORIZED")) {
                clearAdminToken();
                navigate("/admin/login", { replace: true });
                return;
            }
            setErr(e.message || "Gagal memuat detail artikel");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!isNew) fetchDetail(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, isNew]);

    function validateCreate() {
        if (!adminId) return "adminId tidak ditemukan (token tidak berisi id).";
        if (!title.trim()) return "Judul wajib diisi.";
        if (!content.trim()) return "Konten wajib diisi.";
        if (!imageFile) return "Gambar wajib diunggah (backend mewajibkan image saat create).";
        return "";
    }

    function validateUpdate() {
        if (!adminId) return "adminId tidak ditemukan (token tidak berisi id).";
        if (!title.trim()) return "Judul wajib diisi.";
        if (!content.trim()) return "Konten wajib diisi.";
        return "";
    }

    // CREATE multipart (backend wajib image)
    async function createMultipart(nextStatus) {
        const msg = validateCreate();
        if (msg) {
            setErr(msg);
            return null;
        }

        const token = getAdminToken();
        const fd = new FormData();
        fd.append("adminId", adminId);
        fd.append("title", title.trim());
        fd.append("content", content);
        fd.append("status", nextStatus);
        fd.append("tags", tags);
        fd.append("image", imageFile); // <-- field upload

        const res = await fetch(`${API_BASE_URL}${ENDPOINTS.create}`, {
            method: "POST",
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: fd,
            credentials: "include",
        });

        if (res.status === 401) {
            clearAdminToken();
            navigate("/admin/login", { replace: true });
            return null;
        }

        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(json?.message || "Gagal membuat artikel");
        }
        return json;
    }

    async function handleSaveDraft() {
        setToast("");
        setErr("");

        try {
            setSaving(true);

            if (isNew) {
                const result = await createMultipart("draft");
                const newId = result?.data?.id;
                setToast("Draf berhasil dibuat");
                if (newId) navigate(`/admin/arsipedia/${newId}/edit`, { replace: true });
            } else {
                const msg = validateUpdate();
                if (msg) {
                    setErr(msg);
                    return;
                }

                await apiAdmin(ENDPOINTS.update(id), {
                    method: "PUT",
                    body: JSON.stringify({
                        adminId,
                        title: title.trim(),
                        content,
                        status: "draft",
                        tags,
                    }),
                });

                setStatus("draft");
                setToast("Draf berhasil disimpan");
            }
        } catch (e) {
            setErr(e.message || "Gagal menyimpan draf");
        } finally {
            setSaving(false);
        }
    }

    async function handlePublish() {
        setToast("");
        setErr("");

        try {
            setPublishing(true);

            if (isNew) {
                const result = await createMultipart("published");
                const newId = result?.data?.id;
                setToast("Artikel berhasil dipublikasikan");
                if (newId) navigate(`/admin/arsipedia/${newId}/edit`, { replace: true });
            } else {
                const msg = validateUpdate();
                if (msg) {
                    setErr(msg);
                    return;
                }

                await apiAdmin(ENDPOINTS.update(id), {
                    method: "PUT",
                    body: JSON.stringify({
                        adminId,
                        title: title.trim(),
                        content,
                        status: "published",
                        tags,
                    }),
                });

                setStatus("published");
                setToast("Artikel berhasil dipublikasikan");
            }
        } catch (e) {
            setErr(e.message || "Gagal mempublikasikan artikel");
        } finally {
            setPublishing(false);
        }
    }

    async function handleDelete() {
        if (isNew) return;
        try {
            setDeleting(true);
            setErr("");

            await apiAdmin(ENDPOINTS.remove(id), { method: "DELETE" });

            setDeleteOpen(false);
            setToast("Artikel berhasil dihapus");
            navigate("/admin/arsipedia", { replace: true });
        } catch (e) {
            setErr(e.message || "Gagal menghapus artikel");
        } finally {
            setDeleting(false);
        }
    }

    const previewUrlNew = useMemo(() => {
        if (!imageFile) return null;
        return URL.createObjectURL(imageFile);
    }, [imageFile]);

    useEffect(() => {
        return () => {
            if (previewUrlNew) URL.revokeObjectURL(previewUrlNew);
        };
    }, [previewUrlNew]);

    return (
        <div className="min-h-[calc(100vh-120px)]">
            <div className="flex min-h-[calc(100vh-120px)] flex-col">
                <div className="flex-1 space-y-6">
                    <div className="flex items-center justify-between gap-4">
                        <button
                            onClick={() => navigate("/admin/arsipedia")}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            <FiArrowLeft />
                            Kembali
                        </button>
                        <Toast text={toast} onClose={() => setToast("")} />
                    </div>

                    {err && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{err}</div>
                    )}

                    {loading ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                            Memuat artikel...
                        </div>
                    ) : (
                        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                            {/* LEFT */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-6">
                                <div className="mb-4 text-xl font-extrabold text-slate-900">Editor Artikel</div>

                                <div className="space-y-5">
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700">Judul Artikel</label>
                                        <input
                                            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                                            placeholder="Masukkan judul artikel..."
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            disabled={saving || publishing || deleting}
                                        />
                                    </div>

                                    <div>
                                        <div className="text-lg font-extrabold text-slate-900">Konten Utama</div>
                                        <label className="mt-3 block text-sm font-semibold text-slate-700">Konten Artikel</label>
                                        <textarea
                                            className="mt-2 min-h-[360px] w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-slate-300"
                                            placeholder="Tulis konten artikel..."
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            disabled={saving || publishing || deleting}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT */}
                            <div className="space-y-6">
                                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                                    <div className="text-lg font-extrabold text-slate-900">Pengaturan Artikel</div>

                                    <div className="mt-4 space-y-4">
                                        <div>
                                            <label className="text-sm font-semibold text-slate-700">Status</label>
                                            <select
                                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value)}
                                                disabled={saving || publishing || deleting}
                                            >
                                                <option value="draft">draft</option>
                                                <option value="published">published</option>
                                            </select>
                                            <p className="mt-2 text-xs text-slate-500">
                                                Tombol “Simpan Draf” dan “Publikasikan” akan menimpa status sesuai action.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold text-slate-700">Tag</label>
                                            <input
                                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                                                placeholder="arsitektur,desain,bangunan"
                                                value={tags}
                                                onChange={(e) => setTags(e.target.value)}
                                                disabled={saving || publishing || deleting}
                                            />
                                            <p className="mt-2 text-xs text-slate-500">Backend menerima tags sebagai string.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                                    <div className="text-lg font-extrabold text-slate-900">Gambar</div>

                                    <div className="mt-4">
                                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                                            {/* PRIORITAS PREVIEW FILE BARU */}
                                            {previewUrlNew ? (
                                                <img src={previewUrlNew} alt="preview" className="h-44 w-full object-cover" />
                                            ) : imageUrl ? (
                                                <img
                                                    src={imageUrl}
                                                    alt="cover"
                                                    className="h-44 w-full object-cover"
                                                    onError={() => {
                                                        // fallback kalau URL tidak valid
                                                        setErr(
                                                            `Gambar gagal dimuat. Cek apakah file benar-benar ada di folder uploads. URL: ${imageUrl}`
                                                        );
                                                    }}
                                                />
                                            ) : (
                                                <div className="grid h-44 place-items-center text-sm text-slate-500">Belum ada gambar</div>
                                            )}
                                        </div>

                                        {isNew ? (
                                            <>
                                                <label className="mt-3 block">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                                        disabled={saving || publishing || deleting}
                                                    />
                                                    <div
                                                        className={`mt-3 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 ${saving || publishing || deleting ? "opacity-60 pointer-events-none" : ""
                                                            }`}
                                                    >
                                                        <FiUpload />
                                                        {imageFile ? "Gambar Dipilih ✓" : "Unggah Gambar (Wajib)"}
                                                    </div>
                                                </label>
                                                <p className="mt-2 text-xs text-slate-500">Backend mewajibkan image saat create.</p>
                                            </>
                                        ) : (
                                            <div className="mt-3 text-xs text-slate-500">
                                                <div className="font-semibold">imagePath:</div>
                                                <div className="break-all">{imagePath || "-"}</div>
                                                <div className="mt-2">
                                                    Saat ini endpoint update tidak memakai upload middleware, jadi gambar tidak bisa diganti lewat UI ini.
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                                    <div className="text-lg font-extrabold text-slate-900">Aksi</div>

                                    <div className="mt-4 space-y-3">
                                        <button
                                            onClick={handleSaveDraft}
                                            disabled={saving || publishing || deleting}
                                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                                        >
                                            <FiSave />
                                            {saving ? "Menyimpan..." : "Simpan Draf"}
                                        </button>

                                        <button
                                            onClick={handlePublish}
                                            disabled={saving || publishing || deleting}
                                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-800 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                                        >
                                            <FiSend />
                                            {publishing ? "Mempublikasikan..." : "Publikasikan"}
                                        </button>

                                        {!isNew && (
                                            <button
                                                onClick={() => setDeleteOpen(true)}
                                                disabled={saving || publishing || deleting}
                                                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                                            >
                                                <FiTrash2 />
                                                Hapus Artikel
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <ConfirmModal
                                    open={deleteOpen}
                                    title="Hapus Artikel?"
                                    desc="Anda yakin ingin menghapus artikel ini? Tindakan ini tidak dapat dibatalkan."
                                    onClose={() => (deleting ? null : setDeleteOpen(false))}
                                    onConfirm={handleDelete}
                                    loading={deleting}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-10 border-t border-slate-200 py-4 text-center text-xs text-slate-500">
                    © 2025 Arsipedia Admin Panel. All rights reserved.
                </div>
            </div>
        </div>
    );
}
