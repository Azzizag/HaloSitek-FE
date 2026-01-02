// src/pages/ArchitectPaymentPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import Logo from "../components/Logo";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export default function ArchitectPaymentPage() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const { paymentToken: paymentTokenParam } = useParams();

    const paymentToken = useMemo(() => {
        if (paymentTokenParam) return paymentTokenParam;
        return params.get("payment_token") || params.get("token") || "";
    }, [params, paymentTokenParam]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [info, setInfo] = useState(null);

    const [isSnapReady, setIsSnapReady] = useState(false);
    const [isEmbedded, setIsEmbedded] = useState(false);

    const embeddedTokenRef = useRef(null);

    async function fetchPaymentInfo({ silent = false } = {}) {
        if (!paymentToken) {
            setError("payment_token tidak ditemukan di URL.");
            setLoading(false);
            return null;
        }

        try {
            if (!silent) {
                setLoading(true);
                setError("");
            }

            const res = await fetch(
                `${API_BASE_URL}/api/architects/payment/${encodeURIComponent(paymentToken)}`,
                { method: "GET", headers: { "Content-Type": "application/json" } }
            );

            const json = await res.json().catch(() => ({}));
            if (!res.ok || json?.success === false) {
                throw new Error(json?.message || "Gagal mengambil payment info.");
            }

            setInfo(json.data);
            if (!silent) setLoading(false);
            return json.data;
        } catch (e) {
            setError(e?.message || "Terjadi kesalahan.");
            if (!silent) setLoading(false);
            return null;
        }
    }

    // 1) fetch pertama kali
    useEffect(() => {
        fetchPaymentInfo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paymentToken]);

    // derived values
    const clientKey = info?.payment?.clientKey || "";
    const snapJsUrl = info?.payment?.snapJsUrl || "";
    const orderId = info?.transaction?.orderId || "";
    const amount = info?.transaction?.amount ?? null;
    const status = info?.transaction?.status || ""; // backend: PENDING / SUCCESS / FAILED / EXPIRED
    const expiredAt = info?.transaction?.expiredAt || "";
    const snapToken = info?.transaction?.snapToken || "";

    const formattedAmount =
        typeof amount === "number" ? amount.toLocaleString("id-ID") : "";

    // 2) load snap.js
    useEffect(() => {
        if (!clientKey || !snapJsUrl) return;

        setIsSnapReady(false);

        const existing = document.getElementById("midtrans-snap-script");
        if (existing) {
            if (window.snap) setIsSnapReady(true);
            else {
                const onLoad = () => setIsSnapReady(true);
                existing.addEventListener("load", onLoad, { once: true });
            }
            return;
        }

        const script = document.createElement("script");
        script.src = snapJsUrl;
        script.id = "midtrans-snap-script";
        script.type = "text/javascript";
        script.setAttribute("data-client-key", clientKey);
        script.onload = () => setIsSnapReady(true);
        script.onerror = () => setError("Gagal memuat Midtrans Snap (snap.js).");
        document.body.appendChild(script);
    }, [clientKey, snapJsUrl]);

    // helper: redirect ke halaman status (tanpa tunggu webhook)
    function goToStatus(extraQuery = "") {
        const oid = orderId || info?.transaction?.orderId || "";
        if (!oid) {
            // fallback kalau orderId belum kebaca (jarang)
            setMessage("Pembayaran diproses. Silakan cek status di halaman status.");
            return;
        }
        navigate(`/register/architect/status?order_id=${encodeURIComponent(oid)}${extraQuery}`, {
            replace: true,
        });
    }

    // 3) embed snap (sekali per snapToken)
    useEffect(() => {
        if (!isSnapReady) return;
        if (!snapToken) return;

        // kalau token sudah pernah di-embed, jangan ulang
        if (embeddedTokenRef.current === snapToken) return;

        const snap = window.snap;
        if (!snap || typeof snap.embed !== "function") {
            setError("Midtrans Snap belum siap. Silakan refresh halaman.");
            return;
        }

        embeddedTokenRef.current = snapToken;
        setIsEmbedded(true);
        setError("");
        setMessage("");

        const el = document.getElementById("snap-container");
        if (el) el.innerHTML = "";

        // ✅ perubahan utama: callback langsung redirect, tanpa polling server
        snap.embed(snapToken, {
            embedId: "snap-container",
            onSuccess() {
                // tidak menunggu server/webhook
                goToStatus("&result=success");
            },
            onPending() {
                goToStatus("&result=pending");
            },
            onError() {
                goToStatus("&result=error");
            },
            onClose() {
                // user menutup popup Snap
                goToStatus("&result=close");
            },
        });
    }, [isSnapReady, snapToken]); // deps minimal agar tidak re-embed

    // 4) jika user refresh dan status sudah update di backend, langsung arahkan (opsional)
    useEffect(() => {
        if (!status) return;
        if (status === "SUCCESS") goToStatus("&result=success");
        if (status === "FAILED") goToStatus("&result=failed");
        if (status === "EXPIRED") goToStatus("&result=expired");
        // PENDING biarkan tetap di halaman payment (atau bisa juga goToStatus)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    return (
        <div className="min-h-svh bg-white">
            <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                <Logo className="h-7" />
            </header>

            <main className="mx-auto max-w-6xl px-4 pb-16">
                <section className="mt-6 rounded-3xl border bg-white p-8 shadow-sm">
                    <div className="rounded-2xl bg-slate-50 px-6 py-4">
                        <div className="flex flex-wrap items-end justify-between gap-2">
                            <div className="text-xl font-bold">
                                {formattedAmount ? `Rp${formattedAmount}` : "Pembayaran"}
                            </div>
                            {status && (
                                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                                    Status {status}
                                </span>
                            )}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                            {orderId ? `ID Pesanan ${orderId}` : paymentToken ? `Token ${paymentToken}` : ""}
                        </div>

                        {expiredAt && (
                            <div className="mt-1 text-xs text-slate-500">
                                Expired: {new Date(expiredAt).toLocaleString("id-ID")}
                            </div>
                        )}
                    </div>

                    <div className="mt-8 rounded-3xl bg-slate-50 p-6">
                        <div className="mx-auto w-full max-w-[520px]">
                            <div className="rounded-2xl bg-white p-4 shadow-sm">
                                {!isEmbedded && (
                                    <div className="grid min-h-[220px] place-items-center rounded-xl bg-slate-50">
                                        <div className="text-center">
                                            <div className="text-sm font-medium text-slate-700">
                                                Menyiapkan pembayaran…
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                Memuat Midtrans Snap
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div id="snap-container" className={isEmbedded ? "w-full" : "hidden"} />
                            </div>
                        </div>

                        {loading && (
                            <p className="mt-4 text-center text-sm text-slate-500">
                                Memuat info pembayaran…
                            </p>
                        )}

                        {message && (
                            <p className="mt-4 text-center text-sm text-slate-600">{message}</p>
                        )}

                        {error && (
                            <p className="mt-4 text-center text-sm text-red-500">{error}</p>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
