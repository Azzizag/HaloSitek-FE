import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import AuthShell from "../layouts/AuthShell";
import Logo from "../components/Logo";
import { Button, Checkbox, Input, Label } from "../components/ui";
import { useMemo, useState } from "react";
import { setAdminToken } from "../lib/adminAuth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AdminLoginPage() {
    const [params] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();

    const errorType = params.get("error");
    const hasConnError = errorType === "conn";
    const hasCredError = errorType === "cred";

    const [submitting, setSubmitting] = useState(false);

    function clearErrorQuery() {
        navigate("/admin/login", { replace: true });
    }

    async function handleSubmit(e) {
        e.preventDefault();

        const form = new FormData(e.currentTarget);
        const identity = (form.get("identity") || "").toString().trim();
        const password = (form.get("password") || "").toString().trim();

        if (!identity || !password) {
            navigate("/admin/login?error=cred", { replace: true });
            return;
        }

        try {
            setSubmitting(true);

            const res = await fetch(`${API_BASE_URL}/admins/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email: identity, password }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                if (res.status === 400 || res.status === 401) {
                    navigate("/admin/login?error=cred", { replace: true });
                } else {
                    navigate("/admin/login?error=conn", { replace: true });
                }
                return;
            }

            const accessToken = data?.data?.tokens?.accessToken || data?.tokens?.accessToken;
            // const refreshToken = data?.data?.tokens?.refreshToken || data?.tokens?.refreshToken;

            if (!accessToken) {
                console.error("Login success but accessToken missing. Response:", data);
                navigate("/admin/login?error=conn", { replace: true });
                return;
            }

            setAdminToken(accessToken);

            const redirectTo = location.state?.from?.pathname || "/admin";
            navigate(redirectTo, { replace: true });
        } catch (err) {
            console.error(err);
            navigate("/admin/login?error=conn", { replace: true });
        } finally {
            setSubmitting(false);
        }
    }

    const headline = useMemo(
        () => (
            <div className="mb-5 flex flex-col items-center gap-4">
                <Logo className="h-10" />
                <h1 className="text-center text-3xl font-extrabold leading-tight text-slate-900">
                    Masuk ke HalositeK Web
                    <br />
                    Admin
                </h1>
                <p className="text-center text-sm text-slate-600 max-w-sm">
                    Masukkan kredensial Anda untuk mengakses panel admin.
                </p>
            </div>
        ),
        []
    );

    return (
        <AuthShell>
            <div className="w-full max-w-md rounded-2xl border border-white/50 bg-white/70 p-6 shadow-xl backdrop-blur">
                {headline}

                {/* Error box */}
                {(hasConnError || hasCredError) && (
                    <div className="mb-4 flex items-start justify-between gap-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-700">
                        <div className="flex items-start gap-3">
                            <svg className="mt-0.5 h-5 w-5 flex-none" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-11.5a.75.75 0 011.5 0v5a.75.75 0 01-1.5 0v-5zM10 14.75a1 1 0 100-2 1 1 0 000 2z"
                                    clipRule="evenodd"
                                />
                            </svg>

                            <p className="text-sm">
                                {hasCredError
                                    ? "Nama Pengguna atau Kata Sandi salah."
                                    : "Terjadi kesalahan koneksi, silakan coba lagi."}
                            </p>
                        </div>

                        {/* tombol kecil untuk clear query error */}
                        <button
                            type="button"
                            onClick={clearErrorQuery}
                            className="text-sm font-semibold text-red-700 hover:underline"
                        >
                            Coba lagi
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="identity">Nama Pengguna atau Email</Label>
                        <Input
                            id="identity"
                            name="identity"
                            autoComplete="username"
                            placeholder="Masukkan nama pengguna atau email Anda"
                            onChange={() => {
                                // kalau user mulai ngetik, hilangkan error query biar UX enak
                                if (hasConnError || hasCredError) clearErrorQuery();
                            }}
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="password">Kata Sandi</Label>
                        <Input
                            id="password"
                            type="password"
                            name="password"
                            autoComplete="current-password"
                            placeholder="********"
                            onChange={() => {
                                if (hasConnError || hasCredError) clearErrorQuery();
                            }}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <Checkbox id="remember" label="Ingat saya" />
                        <a className="text-sm font-medium text-indigo-700 hover:underline" href="/forgot-password">
                            Lupa Kata Sandi?
                        </a>
                    </div>

                    {/* ✅ tombol submit tetap ada walau error */}
                    <Button type="submit" disabled={submitting}>
                        {submitting ? "Memproses..." : "Masuk"}
                    </Button>
                </form>
            </div>
        </AuthShell>
    );
}
