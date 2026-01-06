import { useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import AuthShell from "../layouts/AuthShell";
import Logo from "../components/Logo";
import { Button, Checkbox, Input, Label } from "../components/ui";
import { setAccessToken } from "../lib/authClient";

const BG_URL_2 =
    "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=1920&auto=format&fit=crop";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function LoginPage() {
    const [params] = useSearchParams();
    const roleParam = (params.get("role") || "").toLowerCase(); // "user" | "admin" | "arsitek" | ""
    const navigate = useNavigate();

    const [identity, setIdentity] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // mapping role -> path segment
    const pathRole = roleParam === "admin" ? "admins" : roleParam === "arsitek" ? "architects" : "users";

    const registerTarget = pathRole === "architects" ? "/register/architect/basic" : "/register/users";

    const roleLabel = roleParam ? roleParam.charAt(0).toUpperCase() + roleParam.slice(1) : "";

    async function handleSubmit(e) {
        e.preventDefault();
        setErrorMsg("");

        const id = identity.trim();
        const pw = password.trim();

        if (!id || !pw) {
            setErrorMsg("Nama pengguna/email dan kata sandi wajib diisi.");
            return;
        }

        // payload beda sesuai role
        const payload =
            pathRole === "users"
                ? { identifier: id, password: pw } // USER pakai identifier
                : { email: id, password: pw }; // ARCHITECT & ADMIN pakai email

        try {
            setLoading(true);

            const res = await fetch(`${API_BASE_URL}/${pathRole}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setErrorMsg(data?.message || "Login gagal. Periksa kredensial Anda.");
                return;
            }

            const token = data?.data?.tokens?.accessToken;
            if (!token) {
                setErrorMsg("Token tidak ditemukan pada response login.");
                return;
            }

            setAccessToken(token);

            // redirect sesuai role
            if (pathRole === "admins") {
                navigate("/admin/dashboard", { replace: true });
            } else if (pathRole === "architects") {
                navigate("/dashboard/architect", { replace: true });
            } else {
                navigate("/dashboard/user", { replace: true });
            }
        } catch (err) {
            setErrorMsg(err?.message || "Terjadi kesalahan koneksi.");
        } finally {
            setLoading(false);
        }
    }
    const loginHeaderText = (role) => {
        if (role === "users") {
            return "Username"
        } else {
            return "Email "
        };
    }

    const placeHolderText = (role) => {
        if (role === "users") {
            return "Masukan Username Anda"
        } else {
            return "Masukan Email Anda"
        };
    }

    return (
        <AuthShell bgUrl={BG_URL_2}>
            <div className="w-full max-w-md rounded-2xl border border-white/50 bg-white/70 p-6 shadow-xl backdrop-blur">
                {/* ✅ Header + Back */}
                <div className="mb-3 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="text-sm font-semibold text-slate-700 hover:text-slate-900 hover:underline disabled:opacity-60"
                        disabled={loading}
                    >
                        ← Kembali
                    </button>

                    {roleLabel ? (
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                            {roleLabel}
                        </span>
                    ) : null}
                </div>

                <div className="mb-5 flex flex-col items-center gap-4">
                    <Logo className="pt-10" />
                    <h1 className="text-center text-2xl font-extrabold text-slate-900">Selamat Datang!!</h1>
                    <p className="text-center text-sm text-slate-600">
                        Masuk ke akun Anda untuk melanjutkan{roleLabel ? ` sebagai ${roleLabel}` : ""}.
                    </p>
                </div>

                {errorMsg && (
                    <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="identity">{loginHeaderText(pathRole)}</Label>
                        <Input
                            id="identity"
                            name="identity"
                            autoComplete="username"
                            placeholder={placeHolderText(pathRole)}
                            value={identity}
                            onChange={(e) => setIdentity(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="password">Kata sandi</Label>
                        <Input
                            id="password"
                            type="password"
                            name="password"
                            autoComplete="current-password"
                            placeholder="Masukkan kata sandi Anda"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex cursor-pointer items-center gap-2" onClick={() => setRemember((v) => !v)}>
                            <Checkbox id="remember" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                            <Label htmlFor="remember" className="cursor-pointer">
                                Ingat Saya
                            </Label>
                        </div>
                    </div>

                    <Button type="submit" disabled={loading}>
                        {loading ? "Memproses..." : "Masuk"}
                    </Button>

                    <Button type="button" variant="muted" onClick={() => navigate(registerTarget)} disabled={loading}>
                        Daftar
                    </Button>
                </form>
            </div>
        </AuthShell>
    );
}
