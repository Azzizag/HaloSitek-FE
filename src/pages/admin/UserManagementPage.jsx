// src/pages/admin/UserManagementPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiCheckCircle } from "react-icons/fi";
import { apiAdmin } from "../../lib/apiAdmin";

const ENDPOINTS = {
    list: (qs) => `/api/admin/users${qs ? `?${qs}` : ""}`,
    create: `/api/admin/users`,
    update: (id) => `/api/admin/users/${id}`,
    remove: (id) => `/api/admin/users/${id}`,
};

function formatDate(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

function Toast({ text, onClose }) {
    if (!text) return null;
    return (
        <div className="flex justify-end">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200">
                <FiCheckCircle />
                <span>{text}</span>
                <button className="ml-3 text-slate-500 hover:text-slate-800" onClick={onClose} aria-label="Close toast">
                    <FiX />
                </button>
            </div>
        </div>
    );
}

function Modal({ open, title, children, onClose }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
                    <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close">
                        <FiX />
                    </button>
                </div>
                <div className="mt-4">{children}</div>
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
                    <div className="min-w-0">
                        <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
                        <p className="mt-1 text-sm text-slate-500">{desc}</p>
                    </div>
                    <button onClick={onClose} disabled={loading} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
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

export default function UserManagementPage() {
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [toast, setToast] = useState("");

    const [rows, setRows] = useState([]);
    const [pagination, setPagination] = useState(null); // optional (kalau backend return pagination)
    const [page, setPage] = useState(1);
    const [limit] = useState(12);
    const [search, setSearch] = useState("");

    // modal create/edit
    const [formOpen, setFormOpen] = useState(false);
    const [mode, setMode] = useState("create"); // create|edit
    const [active, setActive] = useState(null);

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [emailVerified, setEmailVerified] = useState(false);

    // delete confirm
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const columns = useMemo(
        () => [
            { key: "fullName", label: "Nama" },
            { key: "username", label: "Username" },
            { key: "email", label: "Email" },
            { key: "emailVerified", label: "Verified" },
            { key: "createdAt", label: "Tanggal Daftar" },
        ],
        []
    );

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setErr("");

            const qs = new URLSearchParams({
                page: String(page),
                limit: String(limit),
                ...(search.trim() ? { search: search.trim() } : {}),
            }).toString();

            const res = await apiAdmin(ENDPOINTS.list(qs));
            // dukung 2 format: {data:[...], pagination:{...}} atau {data:{data:[...], pagination:{...}}}
            const data = res?.data?.data || res?.data;
            const pag = res?.data?.pagination || null;

            setRows(Array.isArray(data) ? data : []);
            setPagination(pag);
        } catch (e) {
            setErr(e?.message || "Gagal mengambil data user");
            setRows([]);
            setPagination(null);
        } finally {
            setLoading(false);
        }
    }, [page, limit, search]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    function openCreate() {
        setMode("create");
        setActive(null);
        setFullName("");
        setEmail("");
        setUsername("");
        setPassword("");
        setEmailVerified(false);
        setErr("");
        setToast("");
        setFormOpen(true);
    }

    function openEdit(row) {
        setMode("edit");
        setActive(row);
        setFullName(row?.fullName || "");
        setEmail(row?.email || "");
        setUsername(row?.username || "");
        setPassword(""); // kosong: hanya isi kalau mau reset
        setEmailVerified(Boolean(row?.emailVerified));
        setErr("");
        setToast("");
        setFormOpen(true);
    }

    async function submitForm() {
        try {
            setErr("");
            setToast("");

            if (!fullName.trim()) return setErr("Nama wajib diisi.");
            if (!email.trim()) return setErr("Email wajib diisi.");
            if (!username.trim()) return setErr("Username wajib diisi.");
            if (mode === "create" && !password) return setErr("Password wajib diisi (create).");

            const payload = {
                fullName: fullName.trim(),
                email: email.trim(),
                username: username.trim(),
                emailVerified: Boolean(emailVerified),
                ...(password ? { password } : {}),
            };

            if (mode === "create") {
                await apiAdmin(ENDPOINTS.create, { method: "POST", body: JSON.stringify(payload) });
                setToast("User berhasil dibuat");
            } else {
                await apiAdmin(ENDPOINTS.update(active.id), { method: "PUT", body: JSON.stringify(payload) });
                setToast("User berhasil diupdate");
            }

            setFormOpen(false);
            await fetchUsers();
        } catch (e) {
            setErr(e?.message || "Gagal menyimpan user");
        }
    }

    async function confirmDelete() {
        if (!deleteTarget?.id) return;
        try {
            setDeleting(true);
            setErr("");
            await apiAdmin(ENDPOINTS.remove(deleteTarget.id), { method: "DELETE" });
            setToast("User berhasil dihapus");
            setDeleteTarget(null);
            await fetchUsers();
        } catch (e) {
            setErr(e?.message || "Gagal menghapus user");
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="space-y-6">
            <header className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900">Manajemen Pengguna</h2>
                    <p className="mt-1 text-sm text-slate-500">Admin dapat membuat, mengubah, mencari, dan menghapus akun user.</p>
                </div>

                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
                >
                    <FiPlus /> Tambah User
                </button>
            </header>

            <Toast text={toast} onClose={() => setToast("")} />

            {err ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{err}</div>
            ) : null}

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="text-base font-bold text-slate-900">Daftar User</div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                className="h-10 w-72 rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-slate-300"
                                placeholder="Cari nama/email/username..."
                                value={search}
                                onChange={(e) => {
                                    setPage(1);
                                    setSearch(e.target.value);
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                    {loading ? (
                        <div className="py-10 text-center text-sm text-slate-500">Memuat data...</div>
                    ) : rows.length ? (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-left text-slate-600">
                                    {columns.map((c) => (
                                        <th key={c.key} className="px-3 py-3 font-semibold">
                                            {c.label}
                                        </th>
                                    ))}
                                    <th className="px-3 py-3 font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => (
                                    <tr key={r.id} className="border-b border-slate-100">
                                        <td className="px-3 py-3 font-semibold text-slate-900">{r.fullName || "-"}</td>
                                        <td className="px-3 py-3 text-slate-700">{r.username || "-"}</td>
                                        <td className="px-3 py-3 text-slate-700">{r.email || "-"}</td>
                                        <td className="px-3 py-3">
                                            <span
                                                className={
                                                    "inline-flex rounded-full px-2.5 py-1 text-xs font-bold " +
                                                    (r.emailVerified ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700")
                                                }
                                            >
                                                {r.emailVerified ? "Yes" : "No"}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-slate-700">{formatDate(r.createdAt)}</td>
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEdit(r)}
                                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                >
                                                    <FiEdit2 /> Edit
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(r)}
                                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 hover:bg-red-100"
                                                >
                                                    <FiTrash2 /> Hapus
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
                            Tidak ada user.
                        </div>
                    )}
                </div>

                {/* pagination sederhana */}
                <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                        className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 disabled:opacity-60"
                        disabled={page <= 1 || loading}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        Prev
                    </button>
                    <div className="text-xs text-slate-600">Page {page}</div>
                    <button
                        className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 disabled:opacity-60"
                        disabled={loading || (pagination && pagination.totalPages ? page >= pagination.totalPages : false)}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Next
                    </button>
                </div>
            </div>

            <Modal
                open={formOpen}
                title={mode === "create" ? "Tambah User" : "Edit User"}
                onClose={() => setFormOpen(false)}
            >
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-slate-700">Nama Lengkap</label>
                        <input
                            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-sm font-semibold text-slate-700">Email</label>
                            <input
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-700">Username</label>
                            <input
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-700">
                            Password {mode === "edit" ? "(kosongkan jika tidak diganti)" : ""}
                        </label>
                        <input
                            type="password"
                            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={emailVerified}
                            onChange={(e) => setEmailVerified(e.target.checked)}
                        />
                        Email Verified
                    </label>

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            onClick={() => setFormOpen(false)}
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Batal
                        </button>
                        <button
                            onClick={submitForm}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-900"
                        >
                            Simpan
                        </button>
                    </div>
                </div>
            </Modal>

            <ConfirmModal
                open={Boolean(deleteTarget)}
                title="Hapus User?"
                desc={deleteTarget ? `Yakin ingin menghapus user "${deleteTarget.fullName}"?` : ""}
                onClose={() => (deleting ? null : setDeleteTarget(null))}
                onConfirm={confirmDelete}
                loading={deleting}
            />
        </div>
    );
}
