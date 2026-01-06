import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadDesignImages } from "../../../lib/apiDesigns";
import { loadDraft } from "../../../lib/designDraft";

const MAX_FILES = 10;

// ✅ batas ukuran per file
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function isImageFile(file) {
    return file?.type?.startsWith("image/");
}

function addFilesWithValidation(prev, fileList, label = "file") {
    const incoming = Array.from(fileList || []);
    const messages = [];

    // filter: hanya image + max size
    const accepted = [];
    for (const f of incoming) {
        if (!isImageFile(f)) {
            messages.push(`"${f.name}" ditolak: hanya file gambar yang diperbolehkan.`);
            continue;
        }
        if (f.size > MAX_FILE_BYTES) {
            const sizeMb = (f.size / (1024 * 1024)).toFixed(2);
            messages.push(`"${f.name}" ditolak: ukuran ${sizeMb}MB melebihi batas ${MAX_FILE_SIZE_MB}MB.`);
            continue;
        }
        accepted.push(f);
    }

    // dedupe berdasarkan name+size+lastModified
    const map = new Map(prev.map((f) => [`${f.name}-${f.size}-${f.lastModified}`, f]));
    for (const f of accepted) {
        map.set(`${f.name}-${f.size}-${f.lastModified}`, f);
    }

    const merged = Array.from(map.values());
    const sliced = merged.slice(0, MAX_FILES);

    if (merged.length > MAX_FILES) {
        messages.push(`Maksimal ${MAX_FILES} ${label}. Sebagian file tidak ditambahkan.`);
    }

    return { nextFiles: sliced, messages };
}

function getApiErrorMessage(err) {
    // axios error shape
    const status = err?.response?.status;
    const data = err?.response?.data;

    // jika backend mengirim pesan
    if (data) {
        if (typeof data === "string") return data;

        const msg = data?.message || data?.error;
        if (msg) {
            // kalau backend kirim errors array, gabungkan
            if (Array.isArray(data.errors) && data.errors.length) {
                const details = data.errors
                    .map((x) => x?.message || x?.msg || x?.error || String(x))
                    .filter(Boolean)
                    .join("\n");
                return details ? `${msg}\n${details}` : msg;
            }
            return msg;
        }
    }

    // fallback dari error message
    const raw = err?.message || "Gagal upload gambar.";

    // jangan tampilkan default axios yang jelek
    if (/Request failed with status code/i.test(raw)) {
        if (status === 413) return "Ukuran upload terlalu besar. Coba kurangi jumlah/ukuran gambar.";
        if (status === 500) return "Server sedang bermasalah (500). Coba lagi beberapa saat.";
        if (status) return `Gagal memproses request (HTTP ${status}).`;
        return "Gagal memproses request.";
    }

    if (/Network Error/i.test(raw)) {
        return "Tidak bisa terhubung ke server. Periksa koneksi atau API base URL.";
    }

    return raw;
}


function removeAt(arr, idx) {
    return arr.filter((_, i) => i !== idx);
}

function PreviewGrid({ files, onRemove }) {
    return (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {files.map((f, idx) => {
                const url = URL.createObjectURL(f);
                return (
                    <div key={`${f.name}-${f.size}-${f.lastModified}`} className="group relative overflow-hidden rounded-xl border border-slate-200">
                        <img
                            src={url}
                            alt={f.name}
                            className="h-24 w-full object-cover"
                            onLoad={() => URL.revokeObjectURL(url)}
                        />
                        <button
                            type="button"
                            className="absolute right-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100"
                            onClick={() => onRemove(idx)}
                        >
                            Hapus
                        </button>
                        <div className="truncate px-2 py-1 text-xs text-slate-600">{f.name}</div>
                    </div>
                );
            })}
        </div>
    );
}

export default function DesignImagesPage() {
    const navigate = useNavigate();
    const draft = useMemo(() => loadDraft(), []);
    const [saving, setSaving] = useState(false);

    const [fotoBangunan, setFotoBangunan] = useState([]);
    const [fotoDenah, setFotoDenah] = useState([]);

    // ✅ error handler
    const [pageError, setPageError] = useState("");
    const [errBangunan, setErrBangunan] = useState("");
    const [errDenah, setErrDenah] = useState("");

    const bangunanRef = useRef(null);
    const denahRef = useRef(null);

    function onPickBangunan(e) {
        const { nextFiles, messages } = addFilesWithValidation(fotoBangunan, e.target.files, "foto bangunan");
        setFotoBangunan(nextFiles);
        setErrBangunan(messages.join("\n"));
        setPageError("");
        e.target.value = ""; // supaya bisa pilih file yang sama lagi
    }

    function onPickDenah(e) {
        const { nextFiles, messages } = addFilesWithValidation(fotoDenah, e.target.files, "foto denah");
        setFotoDenah(nextFiles);
        setErrDenah(messages.join("\n"));
        setPageError("");
        e.target.value = "";
    }

    async function onNext() {
        setPageError("");
        setErrBangunan("");
        setErrDenah("");

        if (!draft.designId) {
            setPageError("Draft belum dibuat. Kembali ke step 1.");
            return;
        }

        // ✅ wajib minimal 1 foto bangunan
        if (fotoBangunan.length === 0) {
            setPageError("Minimal upload 1 foto bangunan sebelum lanjut.");
            return;
        }

        setSaving(true);
        try {
            await uploadDesignImages(draft.designId, { fotoBangunan, fotoDenah });
            navigate("/dashboard/architect/upload/review");
        } catch (e) {
            setPageError(getApiErrorMessage(e));
        } finally {
            setSaving(false);
        }

    }

    return (
        <div className="mx-auto w-full max-w-3xl px-4 py-10">
            <h1 className="text-3xl font-extrabold">Unggah Gambar Desain Anda</h1>
            <p className="mt-2 text-slate-600">
                Maksimal {MAX_FILES} foto per kategori. Maks ukuran per foto: {MAX_FILE_SIZE_MB}MB.
            </p>

            <div className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                {pageError ? (
                    <div className="whitespace-pre-line rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        {pageError}
                    </div>
                ) : null}

                {/* Foto Bangunan */}
                <div>
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-extrabold text-slate-900">
                            Foto Bangunan <span className="text-red-600">*</span>
                        </div>
                        <div className="text-xs font-semibold text-slate-500">
                            {fotoBangunan.length}/{MAX_FILES}
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        <input
                            ref={bangunanRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={onPickBangunan}
                        />
                        <button
                            type="button"
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            onClick={() => bangunanRef.current?.click()}
                            disabled={fotoBangunan.length >= MAX_FILES || saving}
                        >
                            + Tambah Foto
                        </button>

                        {fotoBangunan.length > 0 && (
                            <button
                                type="button"
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                onClick={() => setFotoBangunan([])}
                                disabled={saving}
                            >
                                Hapus Semua
                            </button>
                        )}
                    </div>

                    {errBangunan ? (
                        <div className="mt-3 whitespace-pre-line rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                            {errBangunan}
                        </div>
                    ) : null}

                    {fotoBangunan.length > 0 && (
                        <PreviewGrid
                            files={fotoBangunan}
                            onRemove={(idx) => setFotoBangunan((prev) => removeAt(prev, idx))}
                        />
                    )}
                </div>

                {/* Foto Denah */}
                <div>
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-extrabold text-slate-900">Foto Denah</div>
                        <div className="text-xs font-semibold text-slate-500">
                            {fotoDenah.length}/{MAX_FILES}
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        <input
                            ref={denahRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={onPickDenah}
                        />
                        <button
                            type="button"
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            onClick={() => denahRef.current?.click()}
                            disabled={fotoDenah.length >= MAX_FILES || saving}
                        >
                            + Tambah Denah
                        </button>

                        {fotoDenah.length > 0 && (
                            <button
                                type="button"
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                onClick={() => setFotoDenah([])}
                                disabled={saving}
                            >
                                Hapus Semua
                            </button>
                        )}
                    </div>

                    {errDenah ? (
                        <div className="mt-3 whitespace-pre-line rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                            {errDenah}
                        </div>
                    ) : null}

                    {fotoDenah.length > 0 && (
                        <PreviewGrid
                            files={fotoDenah}
                            onRemove={(idx) => setFotoDenah((prev) => removeAt(prev, idx))}
                        />
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                    <button
                        className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        onClick={() => navigate("/dashboard/architect/upload")}
                        disabled={saving}
                    >
                        Kembali
                    </button>

                    <button
                        className="rounded-xl bg-slate-900 px-5 py-2 font-bold text-white disabled:opacity-60"
                        disabled={saving}
                        onClick={onNext}
                    >
                        {saving ? "Mengunggah..." : "Lanjutkan"}
                    </button>
                </div>
            </div>
        </div>
    );
}
