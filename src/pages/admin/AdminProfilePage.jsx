import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiAdmin } from "../../lib/apiAdmin";
import { clearAdminToken } from "../../lib/adminAuth";

export default function AdminProfilePage() {
    const navigate = useNavigate();

    const fallback = useMemo(
        () => ({
            fullName: "Admin",
            role: "ADMIN",
            email: "-",
            createdAt: "-",
            avatarUrl:
                "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=60",
        }),
        []
    );

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changing, setChanging] = useState(false);
    const [error, setError] = useState("");
    const [profile, setProfile] = useState(fallback);

    // form profile
    const [fullName, setFullName] = useState(fallback.fullName);
    const [email, setEmail] = useState(fallback.email);

    // form password
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");

    const goLogin = () => {
        clearAdminToken();
        navigate("/admin/login", { replace: true });
    };

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                setLoading(true);
                setError("");

                const res = await apiAdmin("/api/admins/auth/profile");
                const data = res?.data ?? res;

                const mapped = {
                    fullName: data?.fullName ?? fallback.fullName,
                    role: data?.role ?? fallback.role,
                    email: data?.email ?? fallback.email,
                    createdAt: data?.createdAt ?? fallback.createdAt,
                    avatarUrl: data?.avatarUrl ?? data?.profilePictureUrl ?? fallback.avatarUrl,
                };

                if (!mounted) return;

                setProfile(mapped);
                setFullName(mapped.fullName);
                setEmail(mapped.email);
            } catch (e) {
                if (String(e.message).includes("UNAUTHORIZED")) return goLogin();
                if (mounted) setError(e.message || "Gagal mengambil profil admin");
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => (mounted = false);
    }, [navigate, fallback]);

    async function handleSaveProfile(e) {
        e.preventDefault();
        try {
            setSaving(true);
            setError("");

            // ✅ KIRIM field yang benar: fullName
            const res = await apiAdmin("/api/admins/auth/profile", {
                method: "PUT",
                body: JSON.stringify({ fullName, email }),
            });

            const data = res?.data ?? res;

            // ✅ update state dari response (dan juga dari input)
            setProfile((p) => ({
                ...p,
                fullName: data?.fullName ?? fullName,
                email: data?.email ?? email,
                role: data?.role ?? p.role,
                createdAt: data?.createdAt ?? p.createdAt,
            }));
        } catch (e) {
            if (String(e.message).includes("UNAUTHORIZED")) return goLogin();
            setError(e.message || "Gagal menyimpan profil");
        } finally {
            setSaving(false);
        }
    }

    async function handleChangePassword(e) {
        e.preventDefault();
        if (newPassword !== confirmNewPassword) {
            setError("Konfirmasi kata sandi baru tidak sama.");
            return;
        }

        try {
            setChanging(true);
            setError("");

            await apiAdmin("/api/admins/auth/change-password", {
                method: "POST",
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            });

            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
        } catch (e) {
            if (String(e.message).includes("UNAUTHORIZED")) return goLogin();
            setError(e.message || "Gagal mengubah kata sandi");
        } finally {
            setChanging(false);
        }
    }

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-extrabold text-slate-900">Profil Admin</h2>

            {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Detail Profil */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="text-lg font-extrabold text-slate-900">Detail Profil</h3>

                <div className="mt-6 flex flex-col gap-8 md:flex-row md:items-start">
                    <div className="flex w-[140px] flex-col items-start">
                        <div className="h-24 w-24 overflow-hidden rounded-full bg-slate-100">
                            <img src={profile.avatarUrl} alt="Admin Avatar" className="h-full w-full object-cover" />
                        </div>
                    </div>

                    <div className="grid flex-1 grid-cols-1 gap-x-12 gap-y-6 sm:grid-cols-2">
                        <div>
                            <div className="text-xs font-semibold text-slate-500">Nama</div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                                {loading ? "…" : profile.fullName}
                            </div>

                            <div className="mt-4 text-xs font-semibold text-slate-500">Email</div>
                            <div className="mt-1 text-sm text-slate-700">{loading ? "…" : profile.email}</div>

                            <div className="mt-4 text-xs font-semibold text-slate-500">Dibuat Pada</div>
                            <div className="mt-1 text-sm text-slate-700">
                                {loading ? "…" : String(profile.createdAt).slice(0, 10)}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs font-semibold text-slate-500">Peran</div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">{loading ? "…" : profile.role}</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Update profile */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="text-lg font-extrabold text-slate-900">Perbarui Informasi Profil</h3>
                <p className="mt-1 text-sm text-slate-500">Perbarui detail profil Anda di sini.</p>

                <form onSubmit={handleSaveProfile} className="mt-6 space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600">Nama</label>
                        <input
                            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            disabled={loading || saving}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600">Email</label>
                        <input
                            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            disabled={loading || saving}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={saving || loading}
                        className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                    >
                        {saving ? "Menyimpan…" : "Simpan Perubahan"}
                    </button>
                </form>
            </section>

            {/* Change password */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="text-lg font-extrabold text-slate-900">Ubah Kata Sandi</h3>
                <p className="mt-1 text-sm text-slate-500">Perbarui kata sandi Anda secara berkala untuk keamanan.</p>

                <form onSubmit={handleChangePassword} className="mt-6 space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600">Kata Sandi Saat Ini</label>
                        <input
                            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            type="password"
                            disabled={changing}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600">Kata Sandi Baru</label>
                        <input
                            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            type="password"
                            disabled={changing}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600">Konfirmasi Kata Sandi Baru</label>
                        <input
                            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            type="password"
                            disabled={changing}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={changing}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                        {changing ? "Memproses…" : "Ubah Kata Sandi"}
                    </button>
                </form>
            </section>
        </div>
    );
}
