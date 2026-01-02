import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadDesignImages } from "../../../lib/apiDesigns";
import { loadDraft } from "../../../lib/designDraft";

const MAX_FILES = 10;

function addFiles(prev, fileList) {
    const incoming = Array.from(fileList || []);
    // dedupe berdasarkan name+size+lastModified
    const map = new Map(prev.map((f) => [`${f.name}-${f.size}-${f.lastModified}`, f]));
    for (const f of incoming) {
        map.set(`${f.name}-${f.size}-${f.lastModified}`, f);
    }
    return Array.from(map.values()).slice(0, MAX_FILES);
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

    const bangunanRef = useRef(null);
    const denahRef = useRef(null);

    function onPickBangunan(e) {
        const next = addFiles(fotoBangunan, e.target.files);
        setFotoBangunan(next);
        e.target.value = ""; // penting: supaya bisa pilih file yang sama lagi
    }

    function onPickDenah(e) {
        const next = addFiles(fotoDenah, e.target.files);
        setFotoDenah(next);
        e.target.value = "";
    }

    async function onNext() {
        if (!draft.designId) return alert("Draft belum dibuat. Kembali ke step 1.");

        // optional: validasi minimal 1 foto (kalau kamu mau)
        // if (fotoBangunan.length === 0) return alert("Minimal upload 1 foto bangunan.");

        setSaving(true);
        try {
            await uploadDesignImages(draft.designId, { fotoBangunan, fotoDenah });
            navigate("/dashboard/architect/upload/review");
        } catch (e) {
            alert(e?.message || "Gagal upload gambar.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="mx-auto w-full max-w-3xl px-4 py-10">
            <h1 className="text-3xl font-extrabold">Unggah Gambar Desain Anda</h1>
            <p className="mt-2 text-slate-600">
                Maksimal {MAX_FILES} foto per kategori. Kamu bisa menambah foto berkali-kali sebelum menekan “Lanjutkan”.
            </p>

            <div className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                {/* Foto Bangunan */}
                <div>
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-extrabold text-slate-900">Foto Bangunan</div>
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
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                            onClick={() => bangunanRef.current?.click()}
                            disabled={fotoBangunan.length >= MAX_FILES}
                        >
                            + Tambah Foto
                        </button>

                        {fotoBangunan.length > 0 && (
                            <button
                                type="button"
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                                onClick={() => setFotoBangunan([])}
                            >
                                Hapus Semua
                            </button>
                        )}
                    </div>

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
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                            onClick={() => denahRef.current?.click()}
                            disabled={fotoDenah.length >= MAX_FILES}
                        >
                            + Tambah Denah
                        </button>

                        {fotoDenah.length > 0 && (
                            <button
                                type="button"
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                                onClick={() => setFotoDenah([])}
                            >
                                Hapus Semua
                            </button>
                        )}
                    </div>

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
                        className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
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
