// src/pages/admin/DashboardPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUsers, FiDollarSign, FiHome, FiShield } from "react-icons/fi";
import StatCard from "../../components/admin/StatCard";
import { apiAdmin } from "../../lib/apiAdmin";
import { clearAdminToken } from "../../lib/adminAuth";

const ENDPOINTS = {
    dashboard: "/api/admins/auth/dashboard",
};

function isUnauthorized(e) {
    return String(e?.message || "").includes("UNAUTHORIZED");
}

function rupiah(n) {
    return Number(n || 0).toLocaleString("id-ID", { style: "currency", currency: "IDR" });
}

export default function DashboardPage() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const [stats, setStats] = useState({
        architects: { unpaid: 0, active: 0, banned: 0, total: 0 },
        transactions: { pending: 0, success: 0, failed: 0, expired: 0, total: 0, totalAmount: 0 },
        users: { verified: 0, unverified: 0, total: 0 },
        admins: 0,
    });

    const fetchDashboard = useCallback(async () => {
        try {
            setLoading(true);
            setErr("");

            const res = await apiAdmin(ENDPOINTS.dashboard);
            const data = res?.data;

            const mapped = {
                architects: {
                    unpaid: data?.architects?.unpaid ?? 0,
                    active: data?.architects?.active ?? 0,
                    banned: data?.architects?.banned ?? 0,
                    total: data?.architects?.total ?? 0,
                },
                transactions: {
                    pending: data?.transactions?.pending ?? 0,
                    success: data?.transactions?.success ?? 0,
                    failed: data?.transactions?.failed ?? 0,
                    expired: data?.transactions?.expired ?? 0,
                    total: data?.transactions?.total ?? 0,
                    totalAmount: data?.transactions?.totalAmount ?? 0,
                },
                users: {
                    verified: data?.users?.verified ?? 0,
                    unverified: data?.users?.unverified ?? 0,
                    total: data?.users?.total ?? 0,
                },
                admins: data?.admins ?? 0,
            };

            setStats(mapped);
        } catch (e) {
            if (isUnauthorized(e)) {
                clearAdminToken();
                navigate("/admin/login", { replace: true });
                return;
            }
            setErr(e?.message || "Gagal mengambil data dashboard");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    const cards = useMemo(() => {
        return [
            {
                title: "Total Pengguna",
                value: loading ? "…" : Number(stats.users.total).toLocaleString("id-ID"),
                subtitle: `Verified ${stats.users.verified} • Unverified ${stats.users.unverified}`,
                Icon: FiUsers,
            },
            {
                title: "Arsitek",
                value: loading ? "…" : Number(stats.architects.total).toLocaleString("id-ID"),
                subtitle: `Active ${stats.architects.active} • Unpaid ${stats.architects.unpaid} • Banned ${stats.architects.banned}`,
                Icon: FiHome,
            },
            {
                title: "Total Pendapatan",
                value: loading ? "…" : rupiah(stats.transactions.totalAmount),
                subtitle: `Success ${stats.transactions.success} • Pending ${stats.transactions.pending}`,
                Icon: FiDollarSign,
            },
            {
                title: "Total Admin",
                value: loading ? "…" : Number(stats.admins).toLocaleString("id-ID"),
                subtitle: "Akun admin terdaftar",
                Icon: FiShield,
            },
        ];
    }, [loading, stats]);

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-extrabold text-slate-900">Dashboard Admin</h2>
                    <p className="mt-2 text-slate-500">Ringkasan statistik sistem (users, arsitek, transaksi, admin).</p>
                </div>

                <button
                    onClick={fetchDashboard}
                    disabled={loading}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                    {loading ? "Memuat..." : "Refresh"}
                </button>
            </div>

            {err ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{err}</div>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-4">
                {cards.map((c) => (
                    <StatCard key={c.title} title={c.title} value={c.value} subtitle={c.subtitle} Icon={c.Icon} />
                ))}
            </div>
        </div>
    );
}
