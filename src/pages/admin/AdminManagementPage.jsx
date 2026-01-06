// src/pages/admin/AdminManagementPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheckCircle, FiPlusCircle, FiX, FiAlertTriangle, FiTrash2 } from "react-icons/fi";
import { apiAdmin } from "../../lib/apiAdmin";
import { clearAdminToken } from "../../lib/adminAuth";

const TOKEN_KEY = "admin_token";

// ✅ admin khusus (yang boleh tambah & delete)
const ADMIN_CREATOR_EMAIL = "admin@halositek.com";

const ENDPOINTS = {
    list: "/admins/auth/all",
    create: "/admins/auth/add",
    del: (id) => `/admins/auth/${id}`,
};

function InlineError({ children }) {
    return (
        <div className="flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white">
            <FiAlertTriangle className="text-base" />
            <span>{children}</span>
        </div>
    );
}

// decode JWT payload (UI only). Backend tetap sumber kebenaran.
function getClaimsFromToken() {
    try {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) return { email: null, id: null };

        const [, payload] = token.split(".");
        if (!payload) return { email: null, id: null };

        const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
        return { email: decoded?.email || null, id: decoded?.id || null };
    } catch {
        return { email: null, id: null };
    }
}

export default function AdminManagementPage() {
    const navigate = useNavigate();

    const claims = useMemo(() => getClaimsFromToken(), []);
    const currentEmail = claims.email;
    const canManageAdmins = currentEmail === ADMIN_CREATOR_EMAIL;

    const [view, setView] = useState("list"); // list | create
    const [toast, setToast] = useState("");

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [rows, setRows] = useState([]);

    // form (fullName, email, password)
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // inline errors
    const [fe, setFe] = useState({ email: "", password: "" });
    const [saving, setSaving] = useState(false);

    // delete state
    const [deletingId, setDeletingId] = useState(null);

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

    function resetForm() {
        setName("");
        setEmail("");
        setPassword("");
        setFe({ email: "", password: "" });
    }

    function validate() {
        const next = { email: "", password: "" };

        if (!email.trim()) next.email = "wajib diisi";
        if (!password.trim()) next.password = "wajib diisi";

        setFe(next);
        return !next.email && !next.password;
    }

    async function fetchAdmins({ silent = false } = {}) {
        try {
            if (!silent) {
                setLoading(true);
                setErr("");
            }

            const res = await apiAdmin(ENDPOINTS.list);
            const items = Array.isArray(res?.data) ? res.data : [];

            setRows(
                items.map((a) => ({
                    id: a.id,
                    fullName: a.fullName || "-",
                    email: a.email || "-",
                    role: a.role || "-",
                    createdAt: a.createdAt || null,
                    updatedAt: a.updatedAt || null,
                }))
            );
        } catch (e) {
            if (String(e.message).includes("UNAUTHORIZED")) {
                clearAdminToken();
                navigate("/admin/login", { replace: true });
                return;
            }
            setErr(e.message || "Gagal mengambil data admin");
            setRows([]);
        } finally {
            if (!silent) setLoading(false);
        }
    }

    useEffect(() => {
        fetchAdmins();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    // extra safety: admin biasa tidak boleh masuk view create
    useEffect(() => {
        if (!canManageAdmins && view === "create") {
            setToast("Akses ditolak. Hanya Admin Creator yang dapat menambahkan admin.");
            resetForm();
            setView("list");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canManageAdmins, view]);

    function openCreate() {
        if (!canManageAdmins) {
            setToast("Akses ditolak. Hanya Admin Creator yang dapat menambahkan admin.");
            return;
        }
        setToast("");
        setErr("");
        resetForm();
        setView("create");
    }

    async function handleCreate(e) {
        e.preventDefault();

        if (!canManageAdmins) {
            setToast("Akses ditolak. Hanya Admin Creator yang dapat menambahkan admin.");
            resetForm();
            setView("list");
            return;
        }

        setToast("");
        setErr("");

        const ok = validate();
        if (!ok) return;

        try {
            setSaving(true);

            const payload = { fullName: name, email, password };

            await apiAdmin(ENDPOINTS.create, {
                method: "POST",
                body: JSON.stringify(payload),
            });

            await fetchAdmins({ silent: true });

            setToast("Admin berhasil ditambahkan");
            resetForm();
            setView("list");
        } catch (e2) {
            if (String(e2.message).includes("UNAUTHORIZED")) {
                clearAdminToken();
                navigate("/admin/login", { replace: true });
                return;
            }

            const msg = (e2?.data?.message || e2.message || "").toLowerCase();
            const next = { email: "", password: "" };

            if (msg.includes("email") || msg.includes("registered") || msg.includes("exists")) {
                next.email = "Email sudah terdaftar";
            } else if (msg.includes("password")) {
                next.password = "Password tidak memenuhi requirement";
            } else {
                setErr(e2.message || "Gagal menambahkan admin");
            }

            setFe((p) => ({ ...p, ...next }));
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteAdmin(row) {
        if (!canManageAdmins) {
            setToast("Akses ditolak. Hanya Admin Creator yang dapat menghapus admin.");
            return;
        }

        // UX guard (backend tetap sumber kebenaran)
        if (row?.email === ADMIN_CREATOR_EMAIL) {
            setToast("Admin Creator tidak bisa dihapus.");
            return;
        }
        if (row?.email === currentEmail) {
            setToast("Tidak boleh menghapus akun sendiri.");
            return;
        }

        const ok = window.confirm(`Hapus admin "${row.fullName}" (${row.email})?`);
        if (!ok) return;

        try {
            setDeletingId(row.id);
            setToast("");
            setErr("");

            await apiAdmin(ENDPOINTS.del(row.id), { method: "DELETE" });

            await fetchAdmins({ silent: true });
            setToast("Admin berhasil dihapus");
        } catch (e) {
            if (String(e.message).includes("UNAUTHORIZED")) {
                clearAdminToken();
                navigate("/admin/login", { replace: true });
                return;
            }
            setErr(e?.data?.message || e.message || "Gagal menghapus admin");
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div className="min-h-[calc(100vh-120px)]">
            <div className="flex min-h-[calc(100vh-120px)] flex-col">
                <div className="flex-1">
                    {view === "list" ? (
                        <div className="space-y-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-3xl font-extrabold text-slate-900">Data Admin</h2>
                                </div>

                                {canManageAdmins && (
                                    <button
                                        onClick={openCreate}
                                        className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
                                    >
                                        <FiPlusCircle />
                                        Tambah Admin
                                    </button>
                                )}
                            </div>

                            {toast && (
                                <div className="flex items-center justify-end">
                                    <div className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200">
                                        <FiCheckCircle className="text-slate-700" />
                                        <span>{toast}</span>
                                        <button
                                            className="ml-4 text-slate-500 hover:text-slate-800"
                                            onClick={() => setToast("")}
                                        >
                                            <FiX />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {err && (
                                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                    {err}
                                </div>
                            )}

                            <div className="rounded-2xl border border-slate-200 bg-white p-6">
                                <div className="mb-4 text-base font-bold text-slate-900">
                                    Daftar Administrator
                                </div>

                                {loading ? (
                                    <div className="py-10 text-center text-sm text-slate-500">Memuat data...</div>
                                ) : rows.length ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[860px] text-left text-sm">
                                            <thead className="text-xs font-bold text-slate-500">
                                                <tr className="border-b border-slate-200">
                                                    <th className="py-3">Nama</th>
                                                    <th className="py-3">Email</th>
                                                    <th className="py-3">Role</th>
                                                    <th className="py-3">Dibuat</th>
                                                    {canManageAdmins && <th className="py-3 text-right">Aksi</th>}
                                                </tr>
                                            </thead>

                                            <tbody className="text-slate-700">
                                                {rows.map((r) => {
                                                    const isCreator = r.email === ADMIN_CREATOR_EMAIL;
                                                    const isSelf = r.email === currentEmail;
                                                    const disabled = deletingId === r.id || isCreator || isSelf;

                                                    return (
                                                        <tr key={r.id} className="border-b border-slate-100 last:border-b-0">
                                                            <td className="py-4">{r.fullName}</td>
                                                            <td className="py-4">{r.email}</td>
                                                            <td className="py-4">{r.role}</td>
                                                            <td className="py-4">{formatDate(r.createdAt)}</td>

                                                            {canManageAdmins && (
                                                                <td className="py-4 text-right">
                                                                    <button
                                                                        type="button"
                                                                        disabled={disabled}
                                                                        onClick={() => handleDeleteAdmin(r)}
                                                                        title={
                                                                            isCreator
                                                                                ? "Admin Creator tidak bisa dihapus"
                                                                                : isSelf
                                                                                    ? "Tidak boleh menghapus akun sendiri"
                                                                                    : "Hapus admin"
                                                                        }
                                                                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                                    >
                                                                        <FiTrash2 />
                                                                        {deletingId === r.id ? "Menghapus..." : "Hapus"}
                                                                    </button>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
                                        Belum ada data admin.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8">
                                <h2 className="text-2xl font-extrabold text-slate-900">Tambah Admin Baru</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Masukkan detail untuk membuat akun administrator baru.
                                </p>

                                {err && (
                                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                        {err}
                                    </div>
                                )}

                                <form className="mt-8 space-y-5" onSubmit={handleCreate}>
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700">Nama</label>
                                        <input
                                            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                                            placeholder="Nama Lengkap"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            disabled={saving}
                                        />
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                                        <div>
                                            <label className="text-sm font-semibold text-slate-700">Email</label>
                                            <input
                                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                                                placeholder="email@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                disabled={saving}
                                            />
                                        </div>
                                        {fe.email && (
                                            <div className="md:mt-7">
                                                <InlineError>{fe.email}</InlineError>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                                        <div>
                                            <label className="text-sm font-semibold text-slate-700">Kata Sandi</label>
                                            <input
                                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                                                placeholder="********"
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                disabled={saving}
                                            />
                                        </div>
                                        {fe.password && (
                                            <div className="md:mt-7">
                                                <InlineError>{fe.password}</InlineError>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-800 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                                    >
                                        {saving ? "Memproses..." : "Buat Akun"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setErr("");
                                            setToast("");
                                            resetForm();
                                            setView("list");
                                        }}
                                        className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                        Kembali
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-10 border-t border-slate-200 py-4 text-center text-xs text-slate-500">
                    © 2025 Architect Admin Panel. All rights reserved.
                </div>
            </div>
        </div>
    );
}
