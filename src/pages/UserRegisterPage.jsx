import { useNavigate } from "react-router-dom";
import { useState } from "react";
import AuthShell from "../layouts/AuthShell";
import Logo from "../components/Logo";
import { Button, Input, Label } from "../components/ui";

const BG_URL =
    "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=1920&auto=format&fit=crop";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL;

export default function UserRegisterPage() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});

    async function handleSubmit(e) {
        e.preventDefault();
        setErrorMsg("");
        setFieldErrors({});

        const f = new FormData(e.currentTarget);
        const fullName = (f.get("fullName") || "").toString().trim();
        const username = (f.get("username") || "").toString().trim();
        const email = (f.get("email") || "").toString().trim();
        const password = (f.get("password") || "").toString().trim();

        if (!fullName || !username || !email || !password) {
            setErrorMsg("Semua field wajib diisi.");
            return;
        }

        try {
            setLoading(true);

            const res = await fetch(`${API_BASE_URL}/users/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ fullName, username, email, password }),
            });

            const data = await res.json().catch(() => ({}));

            // ✅ Email sudah terdaftar → tampilkan error saja (tanpa navigate, tanpa ubah tombol)
            if (res.status === 409 || (data.message && /email/i.test(data.message))) {
                setErrorMsg("Email sudah terdaftar. Silakan gunakan email lain.");
                setFieldErrors((prev) => ({ ...prev, email: "Email sudah terdaftar" }));
                return;
            }

            // ❌ Error lain dari backend
            if (!res.ok) {
                if (Array.isArray(data.errors)) {
                    const mapped = {};
                    for (const err of data.errors) {
                        if (err.field && err.message) mapped[err.field] = err.message;
                    }
                    setFieldErrors(mapped);
                }
                setErrorMsg(data.message || "Gagal mendaftarkan akun");
                return;
            }

            // ✅ Sukses
            navigate("/register/users/success");
        } catch (err) {
            setErrorMsg(err?.message || "Terjadi kesalahan");
        } finally {
            setLoading(false);
        }
    }

    // helper: saat user mengetik ulang, hapus error untuk field tersebut (UX register normal)
    function clearFieldError(field) {
        setFieldErrors((prev) => {
            if (!prev?.[field]) return prev;
            const next = { ...prev };
            delete next[field];
            return next;
        });
        // optional: hilangkan banner kalau user mulai memperbaiki
        if (errorMsg) setErrorMsg("");
    }

    return (
        <AuthShell bgUrl={BG_URL}>
            <div className="w-full max-w-md rounded-2xl border border-white/50 bg-white/70 p-6 shadow-xl backdrop-blur">
                <div className="mb-5 flex flex-col items-center gap-3">
                    <Logo className="h-10" />
                    <h1 className="text-center text-2xl font-extrabold text-slate-900">
                        Daftar Akun Baru
                    </h1>
                    <p className="text-center text-sm text-slate-600">
                        Buat akun Anda untuk mulai menjelajahi platform kami.
                    </p>
                </div>

                {errorMsg && (
                    <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="fullName">Nama Lengkap</Label>
                        <Input
                            id="fullName"
                            name="fullName"
                            placeholder="Masukkan nama lengkap Anda"
                            onChange={() => clearFieldError("fullName")}
                        />
                        {fieldErrors.fullName && (
                            <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="username">Nama Pengguna</Label>
                        <Input
                            id="username"
                            name="username"
                            placeholder="Pilih nama pengguna Anda"
                            onChange={() => clearFieldError("username")}
                        />
                        {fieldErrors.username && (
                            <p className="mt-1 text-xs text-red-600">{fieldErrors.username}</p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="Masukkan alamat email Anda"
                            onChange={() => clearFieldError("email")}
                        />
                        {fieldErrors.email && (
                            <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="password">Kata Sandi</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Buat kata sandi Anda"
                            onChange={() => clearFieldError("password")}
                        />
                        {fieldErrors.password && (
                            <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
                        )}
                    </div>

                    {/* ✅ Register normal: tombol tidak berubah-ubah saat error */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <Button
                            type="button"
                            variant="muted"
                            onClick={() => navigate("/login?role=User")}
                            className="w-full"
                            disabled={loading}
                        >
                            Kembali
                        </Button>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Memproses..." : "Daftar"}
                        </Button>
                    </div>
                </form>
            </div>
        </AuthShell>
    );
}
