// src/pages/user/UserProfilePage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiUser, FiUserCheck, FiUpload, FiEdit2, FiLock, FiX } from "react-icons/fi";
import { apiClient } from "../../lib/apiClient";
import { getAccessToken, clearAccessToken } from "../../lib/authClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

function isUnauthorized(e) {
    const msg = String(e?.message || "").toUpperCase();
    return e?.status === 401 || e?.status === 403 || msg.includes("UNAUTHORIZED");
}

function toAbsoluteUrl(u) {
    if (!u) return null;
    if (u.startsWith("blob:")) return u;
    if (/^https?:\/\//i.test(u)) return u;
    const cleaned = u.startsWith("/") ? u : `/${u}`;
    return `${API_BASE_URL}${cleaned}`;
}

export default function UserProfilePage() {
    const navigate = useNavigate();
    const fileRef = useRef(null);

    const fallback = useMemo(
        () => ({
            id: "",
            fullName: "—",
            username: "—",
            email: "—",
            profilePictureUrl: null,
        }),
        []
    );

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changing, setChanging] = useState(false);
    const [error, setError] = useState("");

    const [isEdit, setIsEdit] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);

    const [snapshot, setSnapshot] = useState(fallback);

    const [avatarUrl, setAvatarUrl] = useState(fallback.profilePictureUrl);
    const [fullName, setFullName] = useState(fallback.fullName);
    const [username, setUsername] = useState(fallback.username);
    const [email, setEmail] = useState(fallback.email);

    // ✅ simpan file asli di state
    const [selectedFile, setSelectedFile] = useState(null);
    const previewUrlRef = useRef(null);

    // change password
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");

    const initial = (fullName || "U").trim().slice(0, 1).toUpperCase();

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                setLoading(true);
                setError("");

                // GET profile
                const res = await apiClient("/api/users/auth/profile");
                const payload = res?.data ?? res;
                const u = payload?.data ?? payload;

                const mapped = {
                    id: u?.id ?? "",
                    fullName: u?.fullName ?? fallback.fullName,
                    username: u?.username ?? fallback.username,
                    email: u?.email ?? fallback.email,
                    profilePictureUrl: u?.profilePictureUrl ? toAbsoluteUrl(u.profilePictureUrl) : null,
                };

                if (!mounted) return;

                setSnapshot(mapped);
                setFullName(mapped.fullName);
                setUsername(mapped.username);
                setEmail(mapped.email);
                setAvatarUrl(mapped.profilePictureUrl);

                setSelectedFile(null);
                if (previewUrlRef.current) {
                    URL.revokeObjectURL(previewUrlRef.current);
                    previewUrlRef.current = null;
                }

                setIsEdit(false);
                setShowChangePassword(false);
            } catch (e) {
                if (isUnauthorized(e)) {
                    clearAccessToken();
                    navigate("/login?role=user", { replace: true });
                    return;
                }
                if (mounted) setError(e?.message || "Gagal mengambil data profil");
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
            // cleanup object URL
            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current);
                previewUrlRef.current = null;
            }
        };
    }, [navigate, fallback]);

    function onPickFile() {
        if (!isEdit) return;
        fileRef.current?.click();
    }

    function onFileChange(e) {
        const f = e.target.files?.[0];
        if (!f) return;

        setSelectedFile(f);

        // ✅ preview
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
            previewUrlRef.current = null;
        }
        const preview = URL.createObjectURL(f);
        previewUrlRef.current = preview;
        setAvatarUrl(preview);
    }

    function handleEdit() {
        setError("");
        setIsEdit(true);
        setShowChangePassword(false);
    }

    function handleCancelEdit() {
        setError("");

        setFullName(snapshot.fullName);
        setUsername(snapshot.username);
        setEmail(snapshot.email);
        setAvatarUrl(snapshot.profilePictureUrl);

        setSelectedFile(null);
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
            previewUrlRef.current = null;
        }

        setIsEdit(false);
    }

    // ✅ PUT profile + upload file (multipart/form-data)
    async function handleSave() {
        try {
            setSaving(true);
            setError("");

            const token = getAccessToken();
            if (!token) {
                clearAccessToken();
                navigate("/login?role=user", { replace: true });
                return;
            }

            const fd = new FormData();
            fd.append("fullName", fullName || "");
            fd.append("username", username || "");

            // field name HARUS "profilePicture" sesuai backend
            if (selectedFile instanceof File) {
                fd.append("profilePicture", selectedFile);
            }

            const res = await fetch(`${API_BASE_URL}/api/users/auth/profile`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    // jangan set Content-Type untuk FormData
                },
                body: fd,
            });

            let json = {};
            try {
                json = await res.json();
            } catch {
                json = {};
            }

            if (res.status === 401 || res.status === 403) {
                clearAccessToken();
                navigate("/login?role=user", { replace: true });
                return;
            }

            if (!res.ok || json?.success === false) {
                throw new Error(json?.message || "Gagal menyimpan profil");
            }

            // backend return: { success, message, data: { ...profile } }
            const updated = json?.data ?? {};

            const nextSnap = {
                id: updated?.id ?? snapshot.id,
                fullName: updated?.fullName ?? fullName,
                username: updated?.username ?? username,
                email: updated?.email ?? snapshot.email,
                profilePictureUrl: updated?.profilePictureUrl ? toAbsoluteUrl(updated.profilePictureUrl) : snapshot.profilePictureUrl,
            };

            setSnapshot(nextSnap);
            setFullName(nextSnap.fullName);
            setUsername(nextSnap.username);
            setEmail(nextSnap.email);
            setAvatarUrl(nextSnap.profilePictureUrl);

            setSelectedFile(null);
            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current);
                previewUrlRef.current = null;
            }

            setIsEdit(false);

            // optional: biar navbar bisa refetch
            window.dispatchEvent(new Event("profile-updated"));

            navigate("/dashboard/profile/success", { replace: true });
        } catch (e) {
            if (isUnauthorized(e)) {
                clearAccessToken();
                navigate("/login?role=user", { replace: true });
                return;
            }
            setError(e?.message || "Gagal menyimpan profil");
        } finally {
            setSaving(false);
        }
    }

    function handleOpenChangePassword() {
        setError("");
        setShowChangePassword((v) => !v);
    }

    async function handleChangePassword(e) {
        e.preventDefault();
        setError("");

        if (!oldPassword || !newPassword || !confirmNewPassword) {
            setError("Semua field kata sandi wajib diisi.");
            return;
        }
        if (newPassword.length < 6) {
            setError("Kata sandi baru minimal 6 karakter.");
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setError("Konfirmasi kata sandi baru tidak sama.");
            return;
        }

        try {
            setChanging(true);

            await apiClient("/api/users/auth/change-password", {
                method: "POST",
                body: JSON.stringify({ oldPassword, newPassword }),
            });

            setOldPassword("");
            setNewPassword("");
            setConfirmNewPassword("");

            navigate("/dashboard/profile/success", { replace: true });
        } catch (e2) {
            if (isUnauthorized(e2)) {
                clearAccessToken();
                navigate("/login?role=user", { replace: true });
                return;
            }
            setError(e2?.message || "Gagal mengubah kata sandi");
        } finally {
            setChanging(false);
        }
    }

    return (
        <div className="min-h-[calc(100vh-120px)] bg-white">
            <div className="border-b border-slate-200" />

            <div className="mx-auto max-w-6xl px-6 py-10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-3xl font-extrabold text-slate-900">Profil Saya</h1>

                    <div className="flex items-center gap-2">
                        {!isEdit ? (
                            <>
                                <button
                                    type="button"
                                    onClick={handleEdit}
                                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                                    disabled={loading}
                                >
                                    <FiEdit2 />
                                    Edit Profil
                                </button>

                                <button
                                    type="button"
                                    onClick={handleOpenChangePassword}
                                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                    disabled={loading}
                                >
                                    <FiLock />
                                    Reset Password
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                    disabled={saving}
                                >
                                    <FiX />
                                    Batal
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSave}
                                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                                    disabled={saving || loading}
                                >
                                    {saving ? "Menyimpan…" : "Simpan"}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="mt-10 grid gap-8 lg:grid-cols-[380px_1fr]">
                    {/* LEFT CARD */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="flex flex-col items-center text-center">
                            <div className="h-28 w-28 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="grid h-full w-full place-items-center text-3xl font-extrabold text-slate-600">
                                        {loading ? "…" : initial}
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 text-2xl font-extrabold text-slate-900">
                                {loading ? "…" : fullName}
                            </div>

                            <button
                                type="button"
                                onClick={onPickFile}
                                className={[
                                    "mt-6 inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold",
                                    isEdit
                                        ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                        : "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed",
                                ].join(" ")}
                                disabled={!isEdit || loading}
                                title={!isEdit ? "Klik Edit Profil dulu untuk mengubah foto" : ""}
                            >
                                <FiUpload />
                                Unggah Foto Baru
                            </button>

                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={onFileChange}
                            />

                            {!isEdit && (
                                <p className="mt-3 text-xs text-slate-500">
                                    Untuk mengubah data, tekan <b>Edit Profil</b>.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* RIGHT SIDE */}
                    <div className="space-y-6">
                        {/* Informasi Pribadi */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                            <div className="text-lg font-extrabold text-slate-900">Informasi Pribadi</div>

                            <div className="mt-6 space-y-5">
                                <Row
                                    icon={<FiUser className="text-slate-500" />}
                                    label="Username"
                                    value={
                                        <input
                                            className="w-full bg-transparent text-right text-sm text-slate-700 outline-none disabled:text-slate-500"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            disabled={!isEdit || loading}
                                        />
                                    }
                                />

                                <Row
                                    icon={<FiUserCheck className="text-slate-500" />}
                                    label="Nama"
                                    value={
                                        <input
                                            className="w-full bg-transparent text-right text-sm text-slate-900 outline-none disabled:text-slate-500"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            disabled={!isEdit || loading}
                                        />
                                    }
                                />

                                <Row
                                    icon={<FiMail className="text-slate-500" />}
                                    label="Email"
                                    value={
                                        <input
                                            className="w-full bg-transparent text-right text-sm text-slate-700 outline-none disabled:text-slate-500"
                                            value={email}
                                            disabled
                                            readOnly
                                        />
                                    }
                                />
                            </div>
                        </div>

                        {/* Change Password Panel */}
                        {showChangePassword && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="text-lg font-extrabold text-slate-900">Reset Password</div>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Masukkan kata sandi saat ini, lalu buat kata sandi baru.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                        onClick={() => setShowChangePassword(false)}
                                        aria-label="Tutup"
                                    >
                                        <FiX />
                                    </button>
                                </div>

                                <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700">Kata Sandi Saat Ini</label>
                                        <input
                                            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                                            type="password"
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            disabled={changing || loading}
                                            placeholder="••••••••"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-slate-700">Kata Sandi Baru</label>
                                        <input
                                            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            disabled={changing || loading}
                                            placeholder="Minimal 6 karakter"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-slate-700">Konfirmasi Kata Sandi Baru</label>
                                        <input
                                            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                                            type="password"
                                            value={confirmNewPassword}
                                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                                            disabled={changing || loading}
                                            placeholder="Ulangi kata sandi baru"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            className="h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                            onClick={() => setShowChangePassword(false)}
                                            disabled={changing}
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            className="h-11 rounded-xl bg-slate-800 px-5 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                                            disabled={changing || loading}
                                        >
                                            {changing ? "Memproses…" : "Ubah Kata Sandi"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="flex justify-start pt-1">
                            <button
                                type="button"
                                onClick={() => navigate("/dashboard/user")}
                                className="text-sm font-semibold text-slate-600 hover:text-slate-900"
                            >
                                ← Kembali ke Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Row({ icon, label, value }) {
    return (
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <span className="text-lg">{icon}</span>
            <div className="text-sm font-semibold text-slate-700">{label}</div>
            <div className="ml-auto w-2/3 text-right">{value}</div>
        </div>
    );
}
