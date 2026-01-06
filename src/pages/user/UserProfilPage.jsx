// src/pages/user/UserProfilePage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiUser, FiUserCheck, FiUpload, FiEdit2, FiLock, FiX } from "react-icons/fi";
import { apiClient } from "../../lib/apiClient";
import { getAccessToken, clearAccessToken } from "../../lib/authClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ✅ batas upload avatar
const MAX_AVATAR_MB = 5;
const MAX_AVATAR_BYTES = MAX_AVATAR_MB * 1024 * 1024;

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

// ✅ ambil payload error dari berbagai bentuk (apiClient custom / axios / fetch)
function getErrorPayload(err) {
    return (
        err?.data ||
        err?.response?.data ||
        err?.payload ||
        err?.body ||
        null
    );
}

// ✅ extract error per-field dari payload backend (flexible)
function extractFieldErrorsFromPayload(payload) {
    if (!payload) return null;

    // format: { errors: { field: "msg" } }
    if (payload?.errors && typeof payload.errors === "object" && !Array.isArray(payload.errors)) {
        return payload.errors;
    }

    // format: { fieldErrors: { field: "msg" } }
    if (payload?.fieldErrors && typeof payload.fieldErrors === "object" && !Array.isArray(payload.fieldErrors)) {
        return payload.fieldErrors;
    }

    // format: { error: { fieldErrors: { ... } } }
    if (payload?.error?.fieldErrors && typeof payload.error.fieldErrors === "object") {
        return payload.error.fieldErrors;
    }

    // format: { errors: [{ field, message }] }
    if (Array.isArray(payload?.errors)) {
        const out = {};
        for (const it of payload.errors) {
            const k = it?.field || it?.path || it?.name;
            const m = it?.message || it?.msg;
            if (k && m) out[k] = m;
        }
        return Object.keys(out).length ? out : null;
    }

    // format: { message, details: [{ ... }] }
    if (Array.isArray(payload?.details)) {
        const out = {};
        for (const it of payload.details) {
            const k = it?.field || it?.path || it?.name;
            const m = it?.message || it?.msg;
            if (k && m) out[k] = m;
        }
        return Object.keys(out).length ? out : null;
    }

    return null;
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

    // ✅ global error banner (umum)
    const [error, setError] = useState("");

    // ✅ per-field errors
    const [profileErrors, setProfileErrors] = useState({}); // { fullName, username, profilePicture }
    const [pwdErrors, setPwdErrors] = useState({}); // { oldPassword, newPassword, confirmNewPassword }

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
                setProfileErrors({});
                setPwdErrors({});

                // GET profile
                const res = await apiClient("/users/auth/profile");
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
            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current);
                previewUrlRef.current = null;
            }
        };
    }, [navigate, fallback]);

    function clearProfileFieldError(field) {
        setProfileErrors((prev) => {
            if (!prev?.[field]) return prev;
            const next = { ...prev };
            delete next[field];
            return next;
        });
    }

    function clearPwdFieldError(field) {
        setPwdErrors((prev) => {
            if (!prev?.[field]) return prev;
            const next = { ...prev };
            delete next[field];
            return next;
        });
    }

    function onPickFile() {
        if (!isEdit) return;
        fileRef.current?.click();
    }

    function onFileChange(e) {
        const f = e.target.files?.[0];
        if (!f) return;

        setError("");

        // ✅ validasi tipe file
        if (!String(f.type || "").startsWith("image/")) {
            setProfileErrors((p) => ({ ...p, profilePicture: "File harus berupa gambar (JPG/PNG/WebP)." }));
            setError("Gagal memilih file: bukan gambar.");
            e.target.value = "";
            return;
        }

        // ✅ validasi ukuran
        if (f.size > MAX_AVATAR_BYTES) {
            const sizeMb = (f.size / (1024 * 1024)).toFixed(2);
            setProfileErrors((p) => ({
                ...p,
                profilePicture: `Ukuran foto ${sizeMb}MB melebihi batas ${MAX_AVATAR_MB}MB.`,
            }));
            setError("Ukuran foto terlalu besar.");
            e.target.value = "";
            return;
        }

        setSelectedFile(f);
        clearProfileFieldError("profilePicture");

        // ✅ preview
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
            previewUrlRef.current = null;
        }
        const preview = URL.createObjectURL(f);
        previewUrlRef.current = preview;
        setAvatarUrl(preview);

        // allow reselect same file
        e.target.value = "";
    }

    function handleEdit() {
        setError("");
        setProfileErrors({});
        setPwdErrors({});
        setIsEdit(true);
        setShowChangePassword(false);
    }

    function handleCancelEdit() {
        setError("");
        setProfileErrors({});

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
            setProfileErrors({});

            const token = getAccessToken();
            if (!token) {
                clearAccessToken();
                navigate("/login?role=user", { replace: true });
                return;
            }

            // ✅ validasi FE (wajib isi)
            const localErrors = {};
            if (!String(username || "").trim()) localErrors.username = "Username wajib diisi.";
            if (!String(fullName || "").trim()) localErrors.fullName = "Nama wajib diisi.";
            if (Object.keys(localErrors).length) {
                setProfileErrors(localErrors);
                setError("Mohon lengkapi field yang wajib diisi.");
                return;
            }

            const fd = new FormData();
            fd.append("fullName", fullName || "");
            fd.append("username", username || "");

            // field name HARUS "profilePicture" sesuai backend
            if (selectedFile instanceof File) {
                fd.append("profilePicture", selectedFile);
            }

            const res = await fetch(`${API_BASE_URL}/users/auth/profile`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
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
                // ✅ ambil error per-field dari backend
                const fieldErrors = extractFieldErrorsFromPayload(json);
                if (fieldErrors) {
                    const mapped = {};
                    if (fieldErrors.username) mapped.username = fieldErrors.username;
                    if (fieldErrors.fullName || fieldErrors.name) mapped.fullName = fieldErrors.fullName || fieldErrors.name;
                    if (fieldErrors.profilePicture || fieldErrors.avatar || fieldErrors.profilePictureUrl) {
                        mapped.profilePicture =
                            fieldErrors.profilePicture || fieldErrors.avatar || fieldErrors.profilePictureUrl;
                    }
                    setProfileErrors(mapped);
                }

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
        setPwdErrors({});
        setShowChangePassword((v) => !v);
    }

    async function handleChangePassword(e) {
        e.preventDefault();
        setError("");
        setPwdErrors({});

        // ✅ validasi FE
        const local = {};
        if (!oldPassword) local.oldPassword = "Kata sandi saat ini wajib diisi.";
        if (!newPassword) local.newPassword = "Kata sandi baru wajib diisi.";
        if (!confirmNewPassword) local.confirmNewPassword = "Konfirmasi kata sandi wajib diisi.";

        if (newPassword && newPassword.length < 6) local.newPassword = "Kata sandi baru minimal 6 karakter.";
        if (newPassword && confirmNewPassword && newPassword !== confirmNewPassword) {
            local.confirmNewPassword = "Konfirmasi kata sandi baru tidak sama.";
        }

        if (Object.keys(local).length) {
            setPwdErrors(local);
            setError("Mohon periksa input kata sandi.");
            return;
        }

        try {
            setChanging(true);

            await apiClient("/users/auth/change-password", {
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

            // ✅ ambil error per-field dari backend
            const payload = getErrorPayload(e2);
            const fieldErrors = extractFieldErrorsFromPayload(payload);
            if (fieldErrors) {
                setPwdErrors({
                    oldPassword: fieldErrors.oldPassword || fieldErrors.currentPassword,
                    newPassword: fieldErrors.newPassword,
                    confirmNewPassword: fieldErrors.confirmNewPassword,
                });
            }

            setError(e2?.message || payload?.message || "Gagal mengubah kata sandi");
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

                            {profileErrors?.profilePicture ? (
                                <div className="mt-3 text-xs font-semibold text-red-600">
                                    {profileErrors.profilePicture}
                                </div>
                            ) : (
                                <p className="mt-3 text-xs text-slate-500">
                                    Maks ukuran foto: {MAX_AVATAR_MB}MB.
                                </p>
                            )}

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
                                        <div className="w-full">
                                            <input
                                                className={[
                                                    "w-full bg-transparent text-right text-sm outline-none disabled:text-slate-500",
                                                    profileErrors?.username ? "text-red-700" : "text-slate-700",
                                                ].join(" ")}
                                                value={username}
                                                onChange={(e) => {
                                                    setUsername(e.target.value);
                                                    clearProfileFieldError("username");
                                                    setError("");
                                                }}
                                                disabled={!isEdit || loading}
                                            />
                                            {profileErrors?.username ? (
                                                <div className="mt-1 text-right text-xs font-semibold text-red-600">
                                                    {profileErrors.username}
                                                </div>
                                            ) : null}
                                        </div>
                                    }
                                />

                                <Row
                                    icon={<FiUserCheck className="text-slate-500" />}
                                    label="Nama"
                                    value={
                                        <div className="w-full">
                                            <input
                                                className={[
                                                    "w-full bg-transparent text-right text-sm outline-none disabled:text-slate-500",
                                                    profileErrors?.fullName ? "text-red-700" : "text-slate-900",
                                                ].join(" ")}
                                                value={fullName}
                                                onChange={(e) => {
                                                    setFullName(e.target.value);
                                                    clearProfileFieldError("fullName");
                                                    setError("");
                                                }}
                                                disabled={!isEdit || loading}
                                            />
                                            {profileErrors?.fullName ? (
                                                <div className="mt-1 text-right text-xs font-semibold text-red-600">
                                                    {profileErrors.fullName}
                                                </div>
                                            ) : null}
                                        </div>
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
                                        onClick={() => {
                                            setShowChangePassword(false);
                                            setPwdErrors({});
                                            setError("");
                                        }}
                                        aria-label="Tutup"
                                    >
                                        <FiX />
                                    </button>
                                </div>

                                <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700">Kata Sandi Saat Ini</label>
                                        <input
                                            className={[
                                                "mt-2 h-11 w-full rounded-xl border px-4 text-sm outline-none",
                                                pwdErrors?.oldPassword ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-slate-300",
                                            ].join(" ")}
                                            type="password"
                                            value={oldPassword}
                                            onChange={(e) => {
                                                setOldPassword(e.target.value);
                                                clearPwdFieldError("oldPassword");
                                                setError("");
                                            }}
                                            disabled={changing || loading}
                                            placeholder="••••••••"
                                        />
                                        {pwdErrors?.oldPassword ? (
                                            <div className="mt-1 text-xs font-semibold text-red-600">
                                                {pwdErrors.oldPassword}
                                            </div>
                                        ) : null}
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-slate-700">Kata Sandi Baru</label>
                                        <input
                                            className={[
                                                "mt-2 h-11 w-full rounded-xl border px-4 text-sm outline-none",
                                                pwdErrors?.newPassword ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-slate-300",
                                            ].join(" ")}
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => {
                                                setNewPassword(e.target.value);
                                                clearPwdFieldError("newPassword");
                                                setError("");
                                            }}
                                            disabled={changing || loading}
                                            placeholder="Minimal 6 karakter"
                                        />
                                        {pwdErrors?.newPassword ? (
                                            <div className="mt-1 text-xs font-semibold text-red-600">
                                                {pwdErrors.newPassword}
                                            </div>
                                        ) : null}
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-slate-700">Konfirmasi Kata Sandi Baru</label>
                                        <input
                                            className={[
                                                "mt-2 h-11 w-full rounded-xl border px-4 text-sm outline-none",
                                                pwdErrors?.confirmNewPassword ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-slate-300",
                                            ].join(" ")}
                                            type="password"
                                            value={confirmNewPassword}
                                            onChange={(e) => {
                                                setConfirmNewPassword(e.target.value);
                                                clearPwdFieldError("confirmNewPassword");
                                                setError("");
                                            }}
                                            disabled={changing || loading}
                                            placeholder="Ulangi kata sandi baru"
                                        />
                                        {pwdErrors?.confirmNewPassword ? (
                                            <div className="mt-1 text-xs font-semibold text-red-600">
                                                {pwdErrors.confirmNewPassword}
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            className="h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                            onClick={() => {
                                                setShowChangePassword(false);
                                                setPwdErrors({});
                                                setError("");
                                            }}
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
