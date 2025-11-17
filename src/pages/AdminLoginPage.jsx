import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "../layouts/AuthShell";
import Logo from "../components/Logo";
import { Button, Checkbox, Input, Label } from "../components/ui";

export default function AdminLoginPage() {
    const [params] = useSearchParams();
    const navigate = useNavigate();

    // ?error=conn | cred
    const errorType = params.get("error");
    const hasConnError = errorType === "conn";
    const hasCredError = errorType === "cred";

    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        if (hasConnError) return; // pada state error, tombol adalah Kembali

        try {
            setSubmitting(true);
            // TODO: panggil NextJS API admin login
            // const res = await fetch("/api/admin/login", {...});
            // if (!res.ok) throw new Error("cred");
            navigate("/dashboard");
        } catch {
            // contoh: tampilkan error kredensial via query
            navigate("/admin/login?error=cred");
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

                {/* Banner error koneksi */}
                {hasConnError && (
                    <div className="mb-4 flex items-start gap-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-700">
                        <svg
                            className="mt-0.5 h-5 w-5 flex-none"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-11.5a.75.75 0 011.5 0v5a.75.75 0 01-1.5 0v-5zM10 14.75a1 1 0 100-2 1 1 0 000 2z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <p className="text-sm">
                            Terjadi kesalahan koneksi, silahkan coba lagi nanti
                        </p>
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
                        />
                        {hasCredError && (
                            <p className="mt-1 text-xs font-medium text-red-600">
                                *Nama Pengguna atau Kata Sandi salah
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <Checkbox id="remember" label="Ingat saya" />
                        <a
                            className="text-sm font-medium text-indigo-700 hover:underline"
                            href="/forgot-password"
                        >
                            Lupa Kata Sandi?
                        </a>
                    </div>

                    {/* Tombol: jika ada error → Kembali, kalau normal → Masuk */}
                    {hasConnError || hasCredError ? (
                        <Button type="button" variant="muted" onClick={() => navigate(-1)}>
                            Kembali
                        </Button>
                    ) : (
                        <Button type="submit" disabled={submitting}>
                            {submitting ? "Memproses..." : "Masuk"}
                        </Button>
                    )}
                </form>
            </div>
        </AuthShell>
    );
}
