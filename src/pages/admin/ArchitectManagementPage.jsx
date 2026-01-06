// src/pages/admin/ArchitectManagementPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiSearch, FiRefreshCw, FiUser, FiDollarSign, FiShield, FiTrash2, FiX, FiCheckCircle } from "react-icons/fi";
import { apiAdmin } from "../../lib/apiAdmin";
import { clearAdminToken } from "../../lib/adminAuth";
import { useNavigate } from "react-router-dom";

const ENDPOINTS = {
    architects: "/admin/architects",
    architectDetail: (id) => `/admin/architects/${id}`,
    architectStatus: (id) => `/admin/architects/${id}/status`,
    architectDelete: (id) => `/admin/architects/${id}`,
    txList: "/admin/transactions", // query: architectId
};

function isUnauthorized(e) {
    return String(e?.message || "").includes("UNAUTHORIZED");
}

function formatDateTime(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(d);
}

function Badge({ text, tone = "slate" }) {
    const cls =
        tone === "green"
            ? "bg-emerald-100 text-emerald-700"
            : tone === "red"
                ? "bg-red-100 text-red-700"
                : tone === "yellow"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-700";
    return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>{text}</span>;
}

function statusTone(s) {
    const x = String(s || "").toUpperCase();
    if (x === "ACTIVE") return "green";
    if (x === "BANNED") return "red";
    if (x === "UNPAID") return "yellow";
    return "slate";
}

function txTone(s) {
    const x = String(s || "").toUpperCase();
    if (x === "SUCCESS") return "green";
    if (x === "FAILED" || x === "EXPIRED") return "red";
    if (x === "PENDING") return "yellow";
    return "slate";
}

function Toast({ text, onClose }) {
    if (!text) return null;
    return (
        <div className="fixed right-6 top-6 z-50">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm text-slate-700 shadow-lg ring-1 ring-slate-200">
                <FiCheckCircle />
                <span>{text}</span>
                <button onClick={onClose} className="ml-2 rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="Close">
                    <FiX />
                </button>
            </div>
        </div>
    );
}

function ConfirmModal({ open, title, desc, confirmText = "Hapus", loading, onClose, onConfirm }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
                        <p className="mt-1 text-sm text-slate-500">{desc}</p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-60"
                    >
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

export default function ArchitectManagementPage() {
    const navigate = useNavigate();

    // list state
    const [loadingList, setLoadingList] = useState(true);
    const [architects, setArchitects] = useState([]);
    const [page, setPage] = useState(1);
    const limit = 12;

    const [statusFilter, setStatusFilter] = useState("ALL"); // ALL|UNPAID|ACTIVE|BANNED
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");

    // selection
    const [selectedId, setSelectedId] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [architect, setArchitect] = useState(null);

    // tx
    const [tab, setTab] = useState("PROFILE"); // PROFILE|TX|ACTIONS
    const [loadingTx, setLoadingTx] = useState(false);
    const [transactions, setTransactions] = useState([]);

    // ui
    const [err, setErr] = useState("");
    const [toast, setToast] = useState("");

    // delete
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const goLogin = useCallback(() => {
        clearAdminToken();
        navigate("/admin/login", { replace: true });
    }, [navigate]);

    const listQuery = useMemo(() => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter);
        if (search.trim()) params.set("search", search.trim());
        return params.toString();
    }, [page, limit, statusFilter, search]);

    const fetchArchitects = useCallback(async () => {
        try {
            setErr("");
            setLoadingList(true);

            const res = await apiAdmin(`${ENDPOINTS.architects}?${listQuery}`);
            const payload = res?.data;

            // dukung dua bentuk: {data:[...], pagination:{...}} atau langsung array
            const rows = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
            setArchitects(rows);

            // auto select pertama jika belum ada selectedId
            if (!selectedId && rows.length) setSelectedId(rows[0].id);
            if (selectedId && rows.length && !rows.some((x) => x.id === selectedId)) {
                setSelectedId(rows[0].id);
            }
        } catch (e) {
            if (isUnauthorized(e)) return goLogin();
            setErr(e?.message || "Gagal mengambil data architect");
            setArchitects([]);
        } finally {
            setLoadingList(false);
        }
    }, [listQuery, selectedId, goLogin]);

    const fetchDetail = useCallback(
        async (id) => {
            if (!id) {
                setArchitect(null);
                return;
            }
            try {
                setErr("");
                setLoadingDetail(true);

                const res = await apiAdmin(ENDPOINTS.architectDetail(id));
                setArchitect(res?.data || null);
            } catch (e) {
                if (isUnauthorized(e)) return goLogin();
                setErr(e?.message || "Gagal memuat detail architect");
                setArchitect(null);
            } finally {
                setLoadingDetail(false);
            }
        },
        [goLogin]
    );

    const fetchTransactions = useCallback(
        async (architectId) => {
            if (!architectId) {
                setTransactions([]);
                return;
            }
            try {
                setErr("");
                setLoadingTx(true);

                const params = new URLSearchParams();
                params.set("architectId", architectId);
                params.set("page", "1");
                params.set("limit", "10");

                const res = await apiAdmin(`${ENDPOINTS.txList}?${params.toString()}`);
                const payload = res?.data;

                const rows = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
                setTransactions(rows);
            } catch (e) {
                if (isUnauthorized(e)) return goLogin();
                setErr(e?.message || "Gagal mengambil transaksi");
                setTransactions([]);
            } finally {
                setLoadingTx(false);
            }
        },
        [goLogin]
    );

    // initial list fetch + any filter/page change
    useEffect(() => {
        fetchArchitects();
    }, [fetchArchitects]);

    // detail & tx when selected changes
    useEffect(() => {
        fetchDetail(selectedId);
        fetchTransactions(selectedId);
    }, [selectedId, fetchDetail, fetchTransactions]);

    const selectedRow = useMemo(() => architects.find((x) => x.id === selectedId) || null, [architects, selectedId]);

    const latestTx = useMemo(() => {
        if (!transactions?.length) return null;
        // asumsi sudah orderBy createdAt desc dari backend, tapi kita tetap amankan:
        const sorted = [...transactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return sorted[0] || null;
    }, [transactions]);

    const canActivate = useMemo(() => {
        const st = String(architect?.status || selectedRow?.status || "").toUpperCase();
        if (st === "ACTIVE") return false;
        // rule minimal: boleh activate bila ada tx SUCCESS
        return transactions.some((t) => String(t.status || "").toUpperCase() === "SUCCESS");
    }, [architect, selectedRow, transactions]);

    const onApplySearch = () => {
        setPage(1);
        setSearch(searchInput);
    };

    const onRefresh = () => {
        fetchArchitects();
        if (selectedId) {
            fetchDetail(selectedId);
            fetchTransactions(selectedId);
        }
    };

    async function updateStatus(nextStatus) {
        if (!selectedId) return;
        try {
            setErr("");
            await apiAdmin(ENDPOINTS.architectStatus(selectedId), {
                method: "PATCH",
                body: JSON.stringify({ status: nextStatus }),
            });

            setToast(`Status architect diubah menjadi ${nextStatus}`);
            // refresh detail + list
            await fetchArchitects();
            await fetchDetail(selectedId);
        } catch (e) {
            if (isUnauthorized(e)) return goLogin();
            setErr(e?.message || "Gagal mengubah status");
        }
    }

    async function handleDelete() {
        if (!selectedId) return;
        try {
            setDeleting(true);
            setErr("");

            await apiAdmin(ENDPOINTS.architectDelete(selectedId), { method: "DELETE" });

            setToast("Architect berhasil dihapus");
            setDeleteOpen(false);

            // refresh list then select first
            await fetchArchitects();
            setArchitect(null);
            setSelectedId(null);
        } catch (e) {
            if (isUnauthorized(e)) return goLogin();
            setErr(e?.message || "Gagal menghapus architect");
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="min-h-[calc(100vh-120px)]">
            <Toast text={toast} onClose={() => setToast("")} />

            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900">Architect Management</h2>
                    <p className="mt-1 text-sm text-slate-500">Kelola status arsitek dan pantau transaksi pembayaran dalam satu halaman.</p>
                </div>

                <button
                    onClick={onRefresh}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                    <FiRefreshCw />
                    Refresh
                </button>
            </div>

            {err ? (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{err}</div>
            ) : null}

            <div className="mt-6 grid gap-6 lg:grid-cols-[420px_1fr]">
                {/* LEFT: LIST */}
                <aside className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) => (e.key === "Enter" ? onApplySearch() : null)}
                                placeholder="Cari nama / email…"
                                className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-slate-300"
                            />
                        </div>
                        <button
                            onClick={onApplySearch}
                            className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-900"
                        >
                            Cari
                        </button>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setPage(1);
                                setStatusFilter(e.target.value);
                            }}
                            className="h-11 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-300"
                        >
                            <option value="ALL">Semua Status</option>
                            <option value="UNPAID">UNPAID</option>
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="BANNED">BANNED</option>
                        </select>

                        <button
                            onClick={() => {
                                setSearchInput("");
                                setSearch("");
                                setStatusFilter("ALL");
                                setPage(1);
                            }}
                            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Reset
                        </button>
                    </div>

                    <div className="mt-4 text-xs font-bold text-slate-700">Daftar Architect</div>

                    {loadingList ? (
                        <div className="py-10 text-center text-sm text-slate-500">Memuat…</div>
                    ) : architects.length ? (
                        <div className="mt-3 space-y-2">
                            {architects.map((a) => {
                                const active = a.id === selectedId;
                                return (
                                    <button
                                        key={a.id}
                                        onClick={() => setSelectedId(a.id)}
                                        className={
                                            "w-full rounded-xl border px-4 py-3 text-left transition " +
                                            (active
                                                ? "border-slate-300 bg-slate-50"
                                                : "border-slate-200 bg-white hover:bg-slate-50")
                                        }
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-extrabold text-slate-900">{a.name || "-"}</div>
                                                <div className="truncate text-xs text-slate-500">{a.email || "-"}</div>
                                            </div>
                                            <Badge text={String(a.status || "-").toUpperCase()} tone={statusTone(a.status)} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
                            Tidak ada data.
                        </div>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        >
                            Prev
                        </button>
                        <div className="text-xs text-slate-500">Page {page}</div>
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Next
                        </button>
                    </div>
                </aside>

                {/* RIGHT: DETAIL */}
                <main className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <div className="text-lg font-extrabold text-slate-900">
                                    {loadingDetail ? "Memuat detail…" : architect?.name || selectedRow?.name || "Pilih architect"}
                                </div>
                                <div className="mt-1 text-sm text-slate-500">{architect?.email || selectedRow?.email || "-"}</div>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <Badge text={String(architect?.status || selectedRow?.status || "-").toUpperCase()} tone={statusTone(architect?.status || selectedRow?.status)} />
                                    {latestTx ? (
                                        <Badge text={`TX ${String(latestTx.status || "-").toUpperCase()}`} tone={txTone(latestTx.status)} />
                                    ) : (
                                        <Badge text="NO TX" tone="slate" />
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setTab("PROFILE")}
                                    className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold ${tab === "PROFILE" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                        }`}
                                >
                                    <FiUser /> Profile
                                </button>
                                <button
                                    onClick={() => setTab("TX")}
                                    className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold ${tab === "TX" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                        }`}
                                >
                                    <FiDollarSign /> Transactions
                                </button>
                                <button
                                    onClick={() => setTab("ACTIONS")}
                                    className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold ${tab === "ACTIONS" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                        }`}
                                >
                                    <FiShield /> Actions
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* TAB CONTENT */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        {!selectedId ? (
                            <div className="py-10 text-center text-sm text-slate-500">Pilih architect dari daftar.</div>
                        ) : tab === "PROFILE" ? (
                            loadingDetail ? (
                                <div className="py-10 text-center text-sm text-slate-500">Memuat…</div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="rounded-xl border border-slate-200 p-4">
                                        <div className="text-xs font-bold text-slate-700">Info Dasar</div>
                                        <div className="mt-3 space-y-2 text-sm">
                                            <div><span className="text-slate-500">ID:</span> <span className="break-all">{architect?.id || "-"}</span></div>
                                            <div><span className="text-slate-500">Nama:</span> {architect?.name || "-"}</div>
                                            <div><span className="text-slate-500">Email:</span> {architect?.email || "-"}</div>
                                            <div><span className="text-slate-500">Phone:</span> {architect?.phone || "-"}</div>
                                            <div><span className="text-slate-500">Status:</span> {String(architect?.status || "-").toUpperCase()}</div>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 p-4">
                                        <div className="text-xs font-bold text-slate-700">Ringkasan</div>
                                        <div className="mt-3 space-y-2 text-sm">
                                            <div><span className="text-slate-500">Created:</span> {formatDateTime(architect?.createdAt)}</div>
                                            <div><span className="text-slate-500">Updated:</span> {formatDateTime(architect?.updatedAt)}</div>
                                            <div><span className="text-slate-500">Transactions:</span> {transactions?.length || 0}</div>
                                            <div className="text-xs text-slate-500">
                                                *Jika data relasi (certifications/portfolio) tidak tampil, itu tergantung include dari endpoint detail.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        ) : tab === "TX" ? (
                            loadingTx ? (
                                <div className="py-10 text-center text-sm text-slate-500">Memuat transaksi…</div>
                            ) : transactions.length ? (
                                <div className="overflow-hidden rounded-xl border border-slate-200">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 text-left text-xs font-bold text-slate-700">
                                            <tr>
                                                <th className="px-4 py-3">Order ID</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Amount</th>
                                                <th className="px-4 py-3">Created</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transactions.map((t) => (
                                                <tr key={t.id} className="border-t border-slate-200">
                                                    <td className="px-4 py-3">
                                                        <div className="font-semibold text-slate-900">{t.orderId || "-"}</div>
                                                        <div className="text-xs text-slate-500 break-all">{t.id}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge text={String(t.status || "-").toUpperCase()} tone={txTone(t.status)} />
                                                    </td>
                                                    <td className="px-4 py-3">{t.amount ?? "-"}</td>
                                                    <td className="px-4 py-3">{formatDateTime(t.createdAt)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-10 text-center text-sm text-slate-500">Belum ada transaksi.</div>
                            )
                        ) : (
                            // ACTIONS
                            <div className="space-y-4">
                                <div className="rounded-xl border border-slate-200 p-4">
                                    <div className="text-sm font-extrabold text-slate-900">Status Actions</div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <button
                                            onClick={() => updateStatus("ACTIVE")}
                                            disabled={!canActivate}
                                            className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                                            title={!canActivate ? "Aktifkan hanya jika ada transaksi SUCCESS" : "Aktifkan akun"}
                                        >
                                            Activate
                                        </button>

                                        <button
                                            onClick={() => updateStatus("UNPAID")}
                                            className="inline-flex h-11 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-semibold text-amber-800 hover:bg-amber-100"
                                        >
                                            Set UNPAID
                                        </button>

                                        <button
                                            onClick={() => updateStatus("BANNED")}
                                            className="inline-flex h-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 hover:bg-red-100"
                                        >
                                            Ban
                                        </button>
                                    </div>

                                    <div className="mt-2 text-xs text-slate-500">
                                        Activate akan aktif bila ditemukan transaksi berstatus <b>SUCCESS</b>.
                                    </div>
                                </div>

                                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                                    <div className="text-sm font-extrabold text-red-800">Danger Zone</div>
                                    <div className="mt-3">
                                        <button
                                            onClick={() => setDeleteOpen(true)}
                                            className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
                                        >
                                            <FiTrash2 />
                                            Delete Architect
                                        </button>
                                        <div className="mt-2 text-xs text-red-700">
                                            Menghapus architect akan menghapus relasi (certifications/portfolio/transactions/dll) sesuai implementasi backend.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <ConfirmModal
                open={deleteOpen}
                title="Hapus Architect?"
                desc="Anda yakin ingin menghapus architect ini? Tindakan ini tidak bisa dibatalkan."
                confirmText="Hapus"
                loading={deleting}
                onClose={() => (deleting ? null : setDeleteOpen(false))}
                onConfirm={handleDelete}
            />
        </div>
    );
}
