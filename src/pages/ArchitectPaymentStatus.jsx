// src/pages/ArchitectPaymentStatus.jsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { Button } from "../components/ui";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function ArchitectPaymentStatus() {
    const [params] = useSearchParams();
    const navigate = useNavigate();

    // kalau ada ?order_id=...
    const orderId = params.get("order_id");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [status, setStatus] = useState(""); // PENDING | SUCCESS | FAILED | EXPIRED

    async function fetchStatus() {
        if (!orderId) return;

        try {
            setLoading(true);
            setError("");
            const res = await fetch(
                `${API_BASE_URL}/payment/status/${encodeURIComponent(orderId)}`,
                { method: "GET", cache: "no-store" }
            );

            const json = await res.json().catch(() => ({}));
            if (!res.ok || json?.success === false) {
                throw new Error(json?.message || "Gagal mengambil status pembayaran.");
            }

            const rawStatus = (json?.data?.status || "")
                .toString()
                .toUpperCase();

            setStatus(rawStatus || "PENDING");
        } catch (e) {
            setError(e?.message || "Terjadi kesalahan.");
        } finally {
            setLoading(false);
        }
    }

    // hanya cek status kalau orderId ada
    useEffect(() => {
        if (orderId) fetchStatus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId]);

    const ui = useMemo(() => {
        // ✅ MODE 1: setelah registrasi tapi belum ada order_id
        if (!orderId) {
            return {
                title: "Pendaftaran Berhasil ✅",
                desc:
                    "Email pembayaran sudah kami kirim. Silakan cek inbox/spam untuk melanjutkan proses pembayaran. " +
                    "Setelah pembayaran berhasil, Anda bisa kembali ke halaman ini melalui link yang ada di email atau login kembali.",
                showLogin: true,
                showRefresh: false,
                icon: "📩",
            };
        }

        // ✅ MODE 2: ada order_id -> status page
        if (loading) {
            return {
                title: "Memproses Pembayaran",
                desc: "Mohon tunggu, sistem sedang memverifikasi pembayaran Anda.",
                showLogin: false,
                showRefresh: false,
                icon: "⏳",
            };
        }

        if (error) {
            return {
                title: "Terjadi Kesalahan",
                desc: error,
                showLogin: false,
                showRefresh: true,
                icon: "⚠️",
            };
        }

        if (status === "SUCCESS") {
            return {
                title: "Pembayaran Berhasil 🎉",
                desc: "Akun arsitek Anda telah diaktifkan. Silakan masuk untuk melanjutkan.",
                showLogin: true,
                showRefresh: false,
                icon: "✅",
            };
        }

        if (status === "FAILED" || status === "EXPIRED") {
            return {
                title: "Pembayaran Gagal",
                desc: "Pembayaran tidak berhasil atau sudah kedaluwarsa. Silakan coba ulang pembayaran dari email yang dikirimkan.",
                showLogin: false,
                showRefresh: true,
                icon: "❌",
            };
        }

        // default PENDING
        return {
            title: "Menunggu Konfirmasi",
            desc: "Pembayaran Anda sedang diproses. Silakan refresh halaman ini secara manual.",
            showLogin: false,
            showRefresh: true,
            icon: "⏳",
        };
    }, [orderId, loading, error, status]);

    return (
        <div className="min-h-svh bg-white">
            <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                <Logo className="h-3" />
            </header>

            <main className="mx-auto max-w-5xl px-4 pb-16">
                <div className="mt-10 text-center">
                    <h1 className="text-3xl font-extrabold">Status Pendaftaran Arsitek</h1>

                    {/* Kalau tidak ada orderId, jangan tampilkan "-" sebagai “error” */}
                    {orderId ? (
                        <p className="mt-2 text-slate-600">
                            ID Pesanan: <span className="font-semibold">{orderId}</span>
                        </p>
                    ) : (
                        <p className="mt-2 text-slate-600">
                            Silakan lanjutkan pembayaran melalui email.
                        </p>
                    )}
                </div>

                <section className="mt-10 rounded-3xl bg-slate-50 px-10 py-10 h-[496px] flex">
                    <div className="grid items-center gap-8 lg:grid-cols-12 w-full">
                        <div className="lg:col-span-7 col-span-12">
                            <h2 className="text-4xl font-black leading-tight mb-[30px]">
                                {ui.title}
                            </h2>

                            <p className="mt-5 text-slate-700 mb-[70px]">
                                {ui.desc}
                            </p>

                            <div className="flex gap-4">
                                {ui.showRefresh && (
                                    <Button type="button" onClick={fetchStatus}>
                                        Refresh Status
                                    </Button>
                                )}

                                {ui.showLogin && (
                                    <Button
                                        type="button"
                                        onClick={() => navigate("/login?role=arsitek")}
                                    >
                                        Ke Halaman Login
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="lg:col-span-5 col-span-12">
                            <div className="grid place-items-center rounded-2xl bg-white p-6 h-[285px]">
                                <span className="text-7xl">{ui.icon}</span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
