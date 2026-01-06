import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiMail,
    FiPhone,
    FiUser,
    FiUpload,
    FiEdit3,
    FiLock,
    FiX,
    FiCheckCircle,
    FiAlertTriangle,
    FiPlus,
    FiTrash2,
} from "react-icons/fi";

import { apiArchitect } from "../../lib/apiArchitect";
import { clearAccessToken } from "../../lib/authClient";

import {
    getMyDesigns,
    normalizeUrl,
    toStringArray,
    updateMyDesign,
    deleteMyDesign,
} from "../../lib/apiDesigns";

import DesignCard from "../../components/architect/ProfileDesignCard";
import EditDesignModal from "../../components/architect/EditDesignModal";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ENDPOINTS = {
    getProfile: "/architects/auth/profile",
    updateProfile: "/architects/auth/profile",
    changePassword: "/users/auth/change-password",
};

function handleArchUnauthorized(err, navigate) {
    if (err?.status === 401 || err?.status === 403 || err?.message === "ARCH_UNAUTHORIZED") {
        clearAccessToken();
        navigate("/login?role=arsitek", { replace: true });
        return true;
    }
    return false;
}

function Banner({ type = "info", title, desc, onClose }) {
    const styles =
        type === "error"
            ? "border-red-200 bg-red-50 text-red-700"
            : type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-700";

    const Icon = type === "error" ? FiAlertTriangle : FiCheckCircle;

    return (
        <div className={`rounded-xl border p-4 text-sm ${styles}`}>
            <div className="flex items-start gap-3">
                <Icon className="mt-0.5 text-base" />
                <div className="flex-1">
                    {title && <div className="font-semibold">{title}</div>}
                    {desc && <div className="mt-1 opacity-90">{desc}</div>}
                </div>
                {onClose && (
                    <button onClick={onClose} className="opacity-70 hover:opacity-100" type="button">
                        <FiX />
                    </button>
                )}
            </div>
        </div>
    );
}

function Field({ label, disabled, value, onChange, placeholder, type = "text", rightIcon }) {
    return (
        <div>
            <label className="text-sm font-semibold text-slate-700">{label}</label>
            <div className="relative mt-2">
                <input
                    type={type}
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 pr-10 text-sm outline-none focus:border-slate-300 disabled:bg-slate-50"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                />
                {rightIcon && (
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {rightIcon}
                    </span>
                )}
            </div>
        </div>
    );
}

function Chip({ text }) {
    return (
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
            {text}
        </span>
    );
}

function toAbsoluteUrl(u) {
    if (!u) return null;
    if (u.startsWith("blob:")) return u;
    if (/^https?:\/\//i.test(u)) return u;
    const cleaned = u.startsWith("/") ? u : `/${u}`;
    return `${API_BASE_URL}${cleaned}`;
}

export default function ArchitectProfilePage() {
    const navigate = useNavigate();
    const fileRef = useRef(null);

    const fallback = useMemo(
        () => ({
            name: "Eko Prasetyo",
            email: "eko.prasetyo@architect.com",
            phone: "085678901234",
            profilePictureUrl: null,
            tahunPengalaman: 0,
            areaPengalaman: "",
            keahlianKhusus: ["AutoCAD", "Revit"],
            certifications: [],
            portfolioLinks: [],
        }),
        []
    );

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // reset password
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [changingPass, setChangingPass] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");

    // profile
    const [avatarUrl, setAvatarUrl] = useState(fallback.profilePictureUrl);
    const [avatarFile, setAvatarFile] = useState(null);
    const [name, setName] = useState(fallback.name);
    const [email, setEmail] = useState(fallback.email);
    const [phone, setPhone] = useState(fallback.phone);

    const [tahunPengalaman, setTahunPengalaman] = useState(String(fallback.tahunPengalaman || ""));
    const [areaPengalaman, setAreaPengalaman] = useState(fallback.areaPengalaman || "");
    const [keahlianKhusus, setKeahlianKhusus] = useState(fallback.keahlianKhusus || []);
    const [newSkill, setNewSkill] = useState("");

    const [portfolioLinks, setPortfolioLinks] = useState(fallback.portfolioLinks || []);
    const [newPortfolio, setNewPortfolio] = useState("");

    // certifications
    const [certifications, setCertifications] = useState(fallback.certifications || []);
    const [newCertName, setNewCertName] = useState("");
    const [newCertIssuer, setNewCertIssuer] = useState("");
    const [newCertYear, setNewCertYear] = useState("");
    const [newCertFile, setNewCertFile] = useState(null);
    const [certUploading, setCertUploading] = useState(false);

    const [snapshot, setSnapshot] = useState(null);
    const initial = (name || "A").trim().slice(0, 1).toUpperCase();

    // ================= DESIGNS =================
    const [designs, setDesigns] = useState([]);
    const [designLoading, setDesignLoading] = useState(true);
    const [designError, setDesignError] = useState("");
    const [designPage, setDesignPage] = useState(1);
    const [designHasMore, setDesignHasMore] = useState(false);
    const [designLoadingMore, setDesignLoadingMore] = useState(false);

    // Edit modal
    const [editOpen, setEditOpen] = useState(false);
    const [editSaving, setEditSaving] = useState(false);
    const [editDesignId, setEditDesignId] = useState(null);
    const [editDesignObj, setEditDesignObj] = useState(null);

    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editKategori, setEditKategori] = useState("");
    const [editLuasBangunan, setEditLuasBangunan] = useState("");
    const [editLuasTanah, setEditLuasTanah] = useState("");

    // photo ops state
    const [bangunanPicked, setBangunanPicked] = useState([]); // [{ op:'replace'|'append', index?:number, id?:string, file, preview }]
    const [denahPicked, setDenahPicked] = useState([]);
    const [bangunanDeleted, setBangunanDeleted] = useState([]); // [index...]
    const [denahDeleted, setDenahDeleted] = useState([]);

    function mapDesign(d) {
        const fotoBangunan = toStringArray(d?.foto_bangunan).map(normalizeUrl).filter(Boolean);
        const fotoDenah = toStringArray(d?.foto_denah).map(normalizeUrl).filter(Boolean);

        return {
            ...d,
            foto_bangunan: fotoBangunan,
            foto_denah: fotoDenah,
            coverUrl: fotoBangunan?.[0] || fotoDenah?.[0] || null,
        };
    }

    async function fetchMyDesignsFirstPage() {
        try {
            setDesignLoading(true);
            setDesignError("");

            const limit = 8;
            const data = await getMyDesigns({ page: 1, limit });
            const arr = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
            const mapped = arr.map(mapDesign);

            setDesigns(mapped);
            setDesignPage(1);
            setDesignHasMore(mapped.length >= limit);
        } catch (e) {
            if (handleArchUnauthorized(e, navigate)) return;
            setDesignError(e?.message || "Gagal mengambil data design");
        } finally {
            setDesignLoading(false);
        }
    }

    async function loadMoreDesigns() {
        try {
            setDesignLoadingMore(true);
            setDesignError("");

            const nextPage = designPage + 1;
            const limit = 8;

            const data = await getMyDesigns({ page: nextPage, limit });
            const arr = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
            const mapped = arr.map(mapDesign);

            setDesigns((prev) => [...prev, ...mapped]);
            setDesignPage(nextPage);
            if (mapped.length < limit) setDesignHasMore(false);
        } catch (e) {
            if (handleArchUnauthorized(e, navigate)) return;
            setDesignError(e?.message || "Gagal memuat design berikutnya");
        } finally {
            setDesignLoadingMore(false);
        }
    }

    function cleanupPickedBlobs() {
        bangunanPicked.forEach((x) => x?.preview?.startsWith("blob:") && URL.revokeObjectURL(x.preview));
        denahPicked.forEach((x) => x?.preview?.startsWith("blob:") && URL.revokeObjectURL(x.preview));
    }

    function openEditDesign(d) {
        setError("");
        setSuccessMsg("");

        const mapped = mapDesign(d);
        setEditDesignObj(mapped);

        setEditDesignId(mapped?.id || null);
        setEditTitle(mapped?.title || "");
        setEditDescription(mapped?.description || "");
        setEditKategori(mapped?.kategori || "");
        setEditLuasBangunan(mapped?.luas_bangunan || "");
        setEditLuasTanah(mapped?.luas_tanah || "");

        cleanupPickedBlobs();
        setBangunanPicked([]);
        setDenahPicked([]);
        setBangunanDeleted([]);
        setDenahDeleted([]);

        setEditOpen(true);
    }

    function closeEditDesign() {
        setEditOpen(false);
        setEditDesignId(null);
        setEditDesignObj(null);

        cleanupPickedBlobs();
        setBangunanPicked([]);
        setDenahPicked([]);
        setBangunanDeleted([]);
        setDenahDeleted([]);
    }

    async function handleSaveDesignEdit() {
        if (!editDesignId) return;

        try {
            setEditSaving(true);
            setError("");
            setSuccessMsg("");

            const fd = new FormData();
            fd.append("title", editTitle || "");
            fd.append("description", editDescription || "");
            fd.append("kategori", editKategori || "");
            fd.append("luas_bangunan", editLuasBangunan || "");
            fd.append("luas_tanah", editLuasTanah || "");

            // FOTO BANGUNAN
            const bangIndices = [];
            (bangunanPicked || []).forEach((x) => {
                if (!x?.file) return;
                fd.append("foto_bangunan", x.file);
                if (x.op === "replace") bangIndices.push(Number(x.index));
                else bangIndices.push(-1); // append
            });
            fd.append("foto_bangunan_indices", JSON.stringify(bangIndices));
            fd.append("remove_foto_bangunan_indices", JSON.stringify(bangunanDeleted || []));

            // FOTO DENAH
            const denIndices = [];
            (denahPicked || []).forEach((x) => {
                if (!x?.file) return;
                fd.append("foto_denah", x.file);
                if (x.op === "replace") denIndices.push(Number(x.index));
                else denIndices.push(-1);
            });
            fd.append("foto_denah_indices", JSON.stringify(denIndices));
            fd.append("remove_foto_denah_indices", JSON.stringify(denahDeleted || []));

            // penting: backend harus mendukung indices/delete (lihat patch di bawah)
            const updated = await updateMyDesign(editDesignId, fd);
            const normalized = mapDesign(updated);

            setDesigns((prev) => prev.map((x) => (x.id === editDesignId ? normalized : x)));
            setEditDesignObj(normalized);

            setSuccessMsg("Design berhasil diperbarui.");
            closeEditDesign();
        } catch (e) {
            if (handleArchUnauthorized(e, navigate)) return;
            setError(e?.message || "Gagal mengedit design");
        } finally {
            setEditSaving(false);
        }
    }

    async function handleDeleteDesign(d) {
        const id = d?.id;
        if (!id) return;

        const ok = window.confirm(`Hapus design "${d?.title || "(Tanpa Judul)"}"?`);
        if (!ok) return;

        try {
            setError("");
            setSuccessMsg("");

            await deleteMyDesign(id);
            setDesigns((prev) => prev.filter((x) => x.id !== id));
            setSuccessMsg("Design berhasil dihapus.");
        } catch (e) {
            if (handleArchUnauthorized(e, navigate)) return;
            setError(e?.message || "Gagal menghapus design");
        }
    }

    // ================= LOAD PROFILE =================
    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                setLoading(true);
                setError("");
                setSuccessMsg("");

                const json = await apiArchitect(ENDPOINTS.getProfile);
                const p = json?.data ?? json;

                const mapped = {
                    name: p?.name ?? fallback.name,
                    email: p?.email ?? fallback.email,
                    phone: p?.phone ?? fallback.phone,
                    profilePictureUrl: p?.profilePictureUrl ?? null,
                    tahunPengalaman: p?.tahunPengalaman ?? 0,
                    areaPengalaman: p?.areaPengalaman ?? "",
                    keahlianKhusus: Array.isArray(p?.keahlianKhusus) ? p.keahlianKhusus : [],
                    certifications: Array.isArray(p?.certifications) ? p.certifications : [],
                    portfolioLinks: Array.isArray(p?.portfolioLinks) ? p.portfolioLinks : [],
                };

                if (!mounted) return;

                setName(mapped.name);
                setEmail(mapped.email);
                setPhone(mapped.phone);
                setAvatarUrl(mapped.profilePictureUrl ? toAbsoluteUrl(mapped.profilePictureUrl) : null);
                setAvatarFile(null);

                setTahunPengalaman(String(mapped.tahunPengalaman ?? ""));
                setAreaPengalaman(mapped.areaPengalaman ?? "");
                setKeahlianKhusus(mapped.keahlianKhusus ?? []);
                setPortfolioLinks(mapped.portfolioLinks ?? []);
                setCertifications(mapped.certifications ?? []);

                setSnapshot({
                    ...mapped,
                    profilePictureUrl: mapped.profilePictureUrl ? toAbsoluteUrl(mapped.profilePictureUrl) : null,
                });
            } catch (e) {
                if (handleArchUnauthorized(e, navigate)) return;
                if (mounted) setError(e.message || "Gagal mengambil data profil arsitek");
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [navigate, fallback]);

    // LOAD DESIGNS
    useEffect(() => {
        fetchMyDesignsFirstPage();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function startEdit() {
        setError("");
        setSuccessMsg("");
        setIsEditing(true);
    }

    function cancelEdit() {
        if (!snapshot) {
            setIsEditing(false);
            return;
        }

        setName(snapshot.name);
        setEmail(snapshot.email);
        setPhone(snapshot.phone);
        setAvatarUrl(snapshot.profilePictureUrl);
        setAvatarFile(null);

        setTahunPengalaman(String(snapshot.tahunPengalaman ?? ""));
        setAreaPengalaman(snapshot.areaPengalaman ?? "");
        setKeahlianKhusus(snapshot.keahlianKhusus ?? []);
        setPortfolioLinks(snapshot.portfolioLinks ?? []);
        setCertifications(snapshot.certifications ?? []);

        setNewSkill("");
        setNewPortfolio("");

        setNewCertName("");
        setNewCertIssuer("");
        setNewCertYear("");
        setNewCertFile(null);

        setIsEditing(false);
        setError("");
        setSuccessMsg("");
    }

    function onPickFile() {
        if (!isEditing) return;
        fileRef.current?.click();
    }

    function onFileChange(e) {
        const f = e.target.files?.[0];
        if (!f) return;

        if (!f.type?.startsWith("image/")) {
            setError("File foto profil harus berupa gambar (JPG/PNG/WebP).");
            return;
        }
        if (f.size > 5 * 1024 * 1024) {
            setError("Ukuran foto profil maksimal 5MB.");
            return;
        }

        const preview = URL.createObjectURL(f);
        setAvatarUrl(preview);
        setAvatarFile(f);
        setError("");
        setSuccessMsg("");
    }

    function addSkill() {
        const s = newSkill.trim();
        if (!s) return;
        if (keahlianKhusus.map((x) => x.toLowerCase()).includes(s.toLowerCase())) return;
        setKeahlianKhusus((prev) => [...prev, s]);
        setNewSkill("");
    }

    function removeSkill(skill) {
        setKeahlianKhusus((prev) => prev.filter((x) => x !== skill));
    }

    function addPortfolio() {
        const url = newPortfolio.trim();
        if (!url) return;
        setPortfolioLinks((prev) => [...prev, { id: `tmp-${Date.now()}`, url, order: prev.length }]);
        setNewPortfolio("");
    }

    function removePortfolio(id) {
        setPortfolioLinks((prev) => prev.filter((x) => x.id !== id));
    }

    async function uploadCertificationFile(file) {
        const fd = new FormData();
        fd.append("berkas", file);

        const json = await apiArchitect("/certifications/public/upload", {
            method: "POST",
            body: fd,
        });

        const berkasUrl = json?.data?.berkasUrl;
        if (!berkasUrl) throw new Error("Upload berhasil tapi berkasUrl tidak ditemukan.");
        return berkasUrl;
    }

    async function addCertification() {
        const nameVal = newCertName.trim();
        const issuerVal = newCertIssuer.trim();
        const yearVal = newCertYear.trim();

        if (!nameVal && !newCertFile) return;
        if (!yearVal) {
            setError("Tahun sertifikasi wajib diisi.");
            return;
        }

        try {
            setCertUploading(true);
            setError("");
            setSuccessMsg("");

            let berkasUrl = null;
            let fileName = "";

            if (newCertFile instanceof File) {
                fileName = newCertFile.name;
                berkasUrl = await uploadCertificationFile(newCertFile);
            }

            setCertifications((prev) => [
                ...prev,
                {
                    id: `tmp-cert-${Date.now()}`,
                    certificationName: nameVal || "(Tanpa Nama)",
                    penerbit: issuerVal || "",
                    year: Number(yearVal),
                    berkasUrl,
                    fileName,
                },
            ]);

            setNewCertName("");
            setNewCertIssuer("");
            setNewCertYear("");
            setNewCertFile(null);

            setSuccessMsg("Sertifikasi ditambahkan (sementara lokal).");
        } catch (e) {
            if (handleArchUnauthorized(e, navigate)) return;
            setError(e?.message || "Gagal menambahkan sertifikasi");
        } finally {
            setCertUploading(false);
        }
    }

    function removeCertification(idOrIndex) {
        setCertifications((prev) => prev.filter((c, idx) => (c?.id ? c.id !== idOrIndex : idx !== idOrIndex)));
    }

    async function handleSaveProfile() {
        try {
            setSaving(true);
            setError("");
            setSuccessMsg("");

            const fd = new FormData();
            fd.append("name", name || "");
            fd.append("phone", phone || "");
            fd.append("tahunPengalaman", String(Number(tahunPengalaman || 0)));
            fd.append("areaPengalaman", areaPengalaman || "");
            fd.append("keahlianKhusus", JSON.stringify(keahlianKhusus || []));

            fd.append(
                "portfolioLinks",
                JSON.stringify(
                    (portfolioLinks || []).map((p, idx) => ({
                        url: p?.url || p,
                        order: p?.order ?? idx,
                    }))
                )
            );

            fd.append(
                "certifications",
                JSON.stringify(
                    (certifications || [])
                        .filter((c) => c && (c.certificationName || c.name || c.penerbit || c.issuer || c.year))
                        .map((c) => ({
                            certificationName: c?.certificationName || c?.name || "",
                            penerbit: c?.penerbit || c?.issuer || "",
                            year: Number(c?.year || 0),
                            berkasUrl: c?.berkasUrl || null,
                        }))
                )
            );

            if (avatarFile instanceof File) fd.append("profilePicture", avatarFile);

            const json = await apiArchitect(ENDPOINTS.updateProfile, { method: "PUT", body: fd });
            const updated = json?.data ?? json;

            const serverAvatar = updated?.profilePictureUrl ? toAbsoluteUrl(updated.profilePictureUrl) : avatarUrl;
            setAvatarUrl(serverAvatar);
            setAvatarFile(null);

            const nextSnap = {
                ...(snapshot || {}),
                name: updated?.name ?? name,
                email: updated?.email ?? email,
                phone: updated?.phone ?? phone,
                profilePictureUrl: serverAvatar,
                tahunPengalaman: updated?.tahunPengalaman ?? Number(tahunPengalaman || 0),
                areaPengalaman: updated?.areaPengalaman ?? areaPengalaman,
                keahlianKhusus: Array.isArray(updated?.keahlianKhusus) ? updated.keahlianKhusus : keahlianKhusus,
                certifications: Array.isArray(updated?.certifications) ? updated.certifications : certifications,
                portfolioLinks: Array.isArray(updated?.portfolioLinks) ? updated.portfolioLinks : portfolioLinks,
            };

            setSnapshot(nextSnap);
            setIsEditing(false);
            setSuccessMsg("Profil berhasil diperbarui.");
        } catch (e) {
            if (handleArchUnauthorized(e, navigate)) return;
            setError(e?.message || "Gagal menyimpan profil arsitek");
        } finally {
            setSaving(false);
        }
    }

    function togglePasswordForm() {
        setError("");
        setSuccessMsg("");
        setShowPasswordForm((v) => !v);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
    }

    async function handleChangePassword(e) {
        e.preventDefault();
        setError("");
        setSuccessMsg("");

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            setError("Semua field password wajib diisi.");
            return;
        }
        if (newPassword.length < 6) {
            setError("Password baru minimal 6 karakter.");
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setError("Konfirmasi password baru tidak sama.");
            return;
        }

        try {
            setChangingPass(true);
            await apiArchitect(ENDPOINTS.changePassword, {
                method: "POST",
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            setSuccessMsg("Password berhasil diperbarui.");
            setShowPasswordForm(false);
        } catch (e2) {
            if (handleArchUnauthorized(e2, navigate)) return;
            setError(e2.message || "Gagal mengubah password");
        } finally {
            setChangingPass(false);
        }
    }

    return (
        <div className="min-h-[calc(100vh-120px)] bg-white">
            <div className="border-b border-slate-200" />

            <div className="mx-auto max-w-6xl px-6 py-10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900">Profil Saya</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Profil khusus role <span className="font-semibold">Arsitek</span>.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {!isEditing ? (
                            <button
                                type="button"
                                onClick={startEdit}
                                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                                disabled={loading}
                            >
                                <FiEdit3 />
                                Edit Profil
                            </button>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                    disabled={saving}
                                >
                                    <FiX />
                                    Batal Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveProfile}
                                    className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                                    disabled={saving || loading}
                                >
                                    {saving ? "Menyimpan…" : "Simpan"}
                                </button>
                            </>
                        )}

                        <button
                            type="button"
                            onClick={togglePasswordForm}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            <FiLock />
                            Reset Password
                        </button>
                    </div>
                </div>

                <div className="mt-6 space-y-4">
                    {error && <Banner type="error" title="Terjadi kesalahan" desc={error} onClose={() => setError("")} />}
                    {successMsg && <Banner type="success" title="Berhasil" desc={successMsg} onClose={() => setSuccessMsg("")} />}
                </div>

                {showPasswordForm && (
                    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-lg font-extrabold text-slate-900">Ubah Password</div>
                                <div className="mt-1 text-sm text-slate-500">Masukkan password saat ini dan password baru.</div>
                            </div>
                            <button
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                onClick={() => setShowPasswordForm(false)}
                                type="button"
                            >
                                <FiX />
                            </button>
                        </div>

                        <form onSubmit={handleChangePassword} className="mt-6 grid gap-4 md:grid-cols-3">
                            <div className="md:col-span-1">
                                <label className="text-sm font-semibold text-slate-700">Password Saat Ini</label>
                                <input
                                    type="password"
                                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    disabled={changingPass}
                                />
                            </div>

                            <div className="md:col-span-1">
                                <label className="text-sm font-semibold text-slate-700">Password Baru</label>
                                <input
                                    type="password"
                                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={changingPass}
                                />
                            </div>

                            <div className="md:col-span-1">
                                <label className="text-sm font-semibold text-slate-700">Konfirmasi Password Baru</label>
                                <input
                                    type="password"
                                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    disabled={changingPass}
                                />
                            </div>

                            <div className="md:col-span-3 flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    className="h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                    onClick={() => setShowPasswordForm(false)}
                                    disabled={changingPass}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="h-11 rounded-xl bg-slate-800 px-6 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                                    disabled={changingPass}
                                >
                                    {changingPass ? "Memproses…" : "Simpan Password"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="mt-10 grid gap-8 lg:grid-cols-[380px_1fr]">
                    {/* LEFT */}
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

                            <div className="mt-6 text-2xl font-extrabold text-slate-900">{loading ? "…" : name}</div>

                            <button
                                type="button"
                                onClick={onPickFile}
                                className={[
                                    "mt-6 inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold",
                                    isEditing
                                        ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                        : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400",
                                ].join(" ")}
                                disabled={loading || !isEditing}
                                title={!isEditing ? "Klik Edit Profil untuk mengubah foto" : ""}
                            >
                                <FiUpload />
                                Unggah Foto Baru
                            </button>

                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div className="space-y-6">
                        {/* Info pribadi */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                            <div className="text-lg font-extrabold text-slate-900">Informasi Pribadi</div>

                            <div className="mt-6 grid gap-4">
                                <Field
                                    label="Nama"
                                    value={name}
                                    onChange={setName}
                                    disabled={loading || !isEditing}
                                    placeholder="Nama lengkap"
                                    rightIcon={<FiUser />}
                                />
                                <Field
                                    label="Email"
                                    value={email}
                                    onChange={setEmail}
                                    disabled={true}
                                    placeholder="email@contoh.com"
                                    rightIcon={<FiMail />}
                                />
                                <Field
                                    label="Kontak"
                                    value={phone}
                                    onChange={setPhone}
                                    disabled={loading || !isEditing}
                                    placeholder="08xxxxxxxxxx"
                                    rightIcon={<FiPhone />}
                                />

                                <div className="grid gap-4 md:grid-cols-2">
                                    <Field
                                        label="Pengalaman (Tahun)"
                                        value={tahunPengalaman}
                                        onChange={setTahunPengalaman}
                                        disabled={loading || !isEditing}
                                        placeholder="contoh: 5"
                                        type="number"
                                    />
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700">Area Pengalaman</label>
                                        <textarea
                                            className="mt-2 min-h-[44px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-300 disabled:bg-slate-50"
                                            value={areaPengalaman}
                                            onChange={(e) => setAreaPengalaman(e.target.value)}
                                            disabled={loading || !isEditing}
                                            placeholder="contoh: Urban Design, Heritage Conservation..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Skills */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                            <div className="text-lg font-extrabold text-slate-900">Keahlian Khusus</div>

                            <div className="mt-6 flex flex-wrap gap-2">
                                {keahlianKhusus?.length ? (
                                    keahlianKhusus.map((s) => (
                                        <div key={s} className="inline-flex items-center gap-2">
                                            <Chip text={s} />
                                            {isEditing && (
                                                <button
                                                    className="rounded-lg p-1 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                                    onClick={() => removeSkill(s)}
                                                    type="button"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-slate-500">Belum ada keahlian.</div>
                                )}
                            </div>

                            {isEditing && (
                                <div className="mt-5 flex gap-2">
                                    <input
                                        className="h-11 flex-1 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                                        value={newSkill}
                                        onChange={(e) => setNewSkill(e.target.value)}
                                        placeholder="Tambah keahlian (contoh: SketchUp)"
                                    />
                                    <button
                                        type="button"
                                        onClick={addSkill}
                                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-900"
                                    >
                                        <FiPlus />
                                        Tambah
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* DESIGNS */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="text-lg font-extrabold text-slate-900">Design Saya</div>
                                    <div className="mt-1 text-sm text-slate-500">
                                        Judul, kategori, dan views. (Edit/Hapus tersedia)
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                    onClick={() => navigate("/dashboard/architect/designs")}
                                >
                                    Kelola Design
                                </button>
                            </div>

                            {designError && (
                                <div className="mt-4">
                                    <Banner
                                        type="error"
                                        title="Gagal memuat design"
                                        desc={designError}
                                        onClose={() => setDesignError("")}
                                    />
                                </div>
                            )}

                            <div className="mt-6">
                                {designLoading ? (
                                    <div className="text-sm text-slate-500">Memuat design...</div>
                                ) : designs?.length ? (
                                    <>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            {designs.map((d) => (
                                                <DesignCard
                                                    key={d?.id}
                                                    design={d}
                                                    onDetail={(x) => navigate(`/dashboard/architect/designs/${x.id}`)}
                                                    onEdit={openEditDesign}
                                                    onDelete={handleDeleteDesign}
                                                />
                                            ))}
                                        </div>

                                        {designHasMore && (
                                            <div className="mt-6 flex justify-center">
                                                <button
                                                    type="button"
                                                    onClick={loadMoreDesigns}
                                                    disabled={designLoadingMore}
                                                    className="h-11 rounded-xl bg-slate-800 px-6 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                                                >
                                                    {designLoadingMore ? "Memuat..." : "Muat Lebih Banyak"}
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                                        Belum ada design. Silakan upload design pertama Anda.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* EDIT MODAL (props lengkap & valid JSX) */}
                        <EditDesignModal
                            open={editOpen}
                            saving={editSaving}
                            design={editDesignObj}
                            onClose={closeEditDesign}
                            onSave={handleSaveDesignEdit}
                            value={{
                                title: editTitle,
                                description: editDescription,
                                kategori: editKategori,
                                luas_bangunan: editLuasBangunan,
                                luas_tanah: editLuasTanah,
                            }}
                            onChange={(next) => {
                                setEditTitle(next.title);
                                setEditDescription(next.description);
                                setEditKategori(next.kategori);
                                setEditLuasBangunan(next.luas_bangunan);
                                setEditLuasTanah(next.luas_tanah);
                            }}
                            bangunanPicked={bangunanPicked}
                            denahPicked={denahPicked}
                            setBangunanPicked={setBangunanPicked}
                            setDenahPicked={setDenahPicked}
                            bangunanDeleted={bangunanDeleted}
                            denahDeleted={denahDeleted}
                            setBangunanDeleted={setBangunanDeleted}
                            setDenahDeleted={setDenahDeleted}
                        />

                        {/* Sertifikasi */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                            <div className="text-lg font-extrabold text-slate-900">Sertifikasi</div>
                            <div className="mt-1 text-sm text-slate-500">Daftar sertifikasi profesional Anda.</div>

                            <div className="mt-6 space-y-3">
                                {certifications?.length ? (
                                    certifications.map((c, idx) => {
                                        const key = c?.id || c?.certificationId || `${idx}-${c?.certificationName || c?.name || "cert"}`;
                                        const certName = c?.certificationName || c?.name || "(Tanpa Nama)";
                                        const issuer = c?.penerbit || c?.issuer || "-";
                                        const year = c?.year ? String(c.year) : "";
                                        const fileUrlRaw = c?.berkasUrl || c?.fileUrl || c?.url || null;
                                        const abs = toAbsoluteUrl(fileUrlRaw);

                                        const isPdf = abs ? abs.toLowerCase().endsWith(".pdf") : false;
                                        const isImage = abs ? /\.(png|jpg|jpeg|webp|gif)$/i.test(abs) : false;

                                        return (
                                            <div key={key} className="rounded-xl border border-slate-200 px-4 py-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="truncate text-sm font-semibold text-slate-800">
                                                            {certName} {year ? `(${year})` : ""}
                                                        </div>
                                                        <div className="mt-0.5 text-xs text-slate-500">
                                                            Penerbit: <span className="font-semibold text-slate-700">{issuer}</span>
                                                        </div>
                                                    </div>

                                                    {isEditing && (
                                                        <button
                                                            type="button"
                                                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                                            onClick={() => removeCertification(c?.id ? c.id : idx)}
                                                            title="Hapus sertifikasi"
                                                        >
                                                            <FiTrash2 />
                                                        </button>
                                                    )}
                                                </div>

                                                {abs ? (
                                                    <div className="mt-3">
                                                        <div className="flex items-center gap-3">
                                                            <a
                                                                href={abs}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-xs font-semibold text-indigo-600 hover:underline"
                                                            >
                                                                Lihat Berkas
                                                            </a>
                                                        </div>

                                                        {isImage && (
                                                            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                                                                <img src={abs} alt="sertifikat" className="h-40 w-full object-cover" />
                                                            </div>
                                                        )}

                                                        {isPdf && (
                                                            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                                                                <iframe src={abs} title="preview-pdf" className="h-64 w-full" />
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="mt-2 text-xs text-slate-400">Tidak ada berkas terlampir.</div>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-sm text-slate-500">Belum ada sertifikasi.</div>
                                )}
                            </div>

                            {isEditing && (
                                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div>
                                            <label className="text-sm font-semibold text-slate-700">Nama Sertifikasi</label>
                                            <input
                                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                                                value={newCertName}
                                                onChange={(e) => setNewCertName(e.target.value)}
                                                placeholder="contoh: SKA / Autodesk Certified..."
                                                disabled={certUploading}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold text-slate-700">Penerbit</label>
                                            <input
                                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                                                value={newCertIssuer}
                                                onChange={(e) => setNewCertIssuer(e.target.value)}
                                                placeholder="contoh: IAI / BNSP / Autodesk..."
                                                disabled={certUploading}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold text-slate-700">Tahun</label>
                                            <input
                                                type="number"
                                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                                                value={newCertYear}
                                                onChange={(e) => setNewCertYear(e.target.value)}
                                                placeholder="contoh: 2024"
                                                disabled={certUploading}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold text-slate-700">Upload Berkas (PDF/JPG/PNG)</label>
                                            <input
                                                type="file"
                                                accept="application/pdf,image/*"
                                                className="mt-2 block w-full text-sm"
                                                disabled={certUploading}
                                                onChange={(e) => setNewCertFile(e.target.files?.[0] || null)}
                                            />
                                            {newCertFile?.name && (
                                                <div className="mt-2 text-xs text-slate-600">
                                                    File dipilih: <span className="font-semibold">{newCertFile.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={addCertification}
                                            disabled={certUploading}
                                            className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                                        >
                                            <FiPlus />
                                            {certUploading ? "Mengunggah..." : "Tambah Sertifikasi"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Portofolio */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                            <div className="text-lg font-extrabold text-slate-900">Portofolio</div>

                            <div className="mt-6 space-y-3">
                                {portfolioLinks?.length ? (
                                    portfolioLinks.map((p) => (
                                        <div
                                            key={p.id}
                                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
                                        >
                                            <a
                                                href={p.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="truncate text-sm font-semibold text-slate-700 hover:underline"
                                            >
                                                {p.url}
                                            </a>
                                            {isEditing && (
                                                <button
                                                    type="button"
                                                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                                    onClick={() => removePortfolio(p.id)}
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-slate-500">Belum ada link portofolio.</div>
                                )}
                            </div>

                            {isEditing && (
                                <div className="mt-5 flex gap-2">
                                    <input
                                        className="h-11 flex-1 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                                        value={newPortfolio}
                                        onChange={(e) => setNewPortfolio(e.target.value)}
                                        placeholder="Tambah link portofolio (https://...)"
                                    />
                                    <button
                                        type="button"
                                        onClick={addPortfolio}
                                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-900"
                                    >
                                        <FiPlus />
                                        Tambah
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => navigate("/dashboard/architect")}
                                className="h-11 rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Kembali ke Dashboard
                            </button>
                        </div>

                        <div className="text-xs text-slate-500">
                            * Tombol <b>Simpan</b> memanggil backend <span className="font-mono">{ENDPOINTS.updateProfile}</span>.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
