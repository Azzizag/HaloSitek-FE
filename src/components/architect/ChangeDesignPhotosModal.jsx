import React, { useEffect, useMemo, useState } from "react";
import { FiX, FiUpload, FiTrash2 } from "react-icons/fi";

function ModalShell({ open, children }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-xl">
                {children}
            </div>
        </div>
    );
}

function ThumbGrid({ urls = [] }) {
    if (!urls?.length) {
        return <div className="text-sm text-slate-500">Tidak ada foto.</div>;
    }
    return (
        <div className="grid gap-3 sm:grid-cols-3">
            {urls.map((u, i) => (
                <div key={`${u}-${i}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <img src={u} alt="preview" className="h-28 w-full object-cover" />
                </div>
            ))}
        </div>
    );
}

export default function ChangeDesignPhotosModal({
    open,
    onClose,
    existingBangunan = [],
    existingDenah = [],
    bangunanFiles = [],
    denahFiles = [],
    onApply,
}) {
    const [localBangunan, setLocalBangunan] = useState(bangunanFiles);
    const [localDenah, setLocalDenah] = useState(denahFiles);
    const [err, setErr] = useState("");

    useEffect(() => {
        if (open) {
            setLocalBangunan(bangunanFiles || []);
            setLocalDenah(denahFiles || []);
            setErr("");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const previewBangunan = useMemo(() => {
        return (localBangunan || []).map((f) => URL.createObjectURL(f));
    }, [localBangunan]);

    const previewDenah = useMemo(() => {
        return (localDenah || []).map((f) => URL.createObjectURL(f));
    }, [localDenah]);

    useEffect(() => {
        return () => {
            previewBangunan.forEach((u) => URL.revokeObjectURL(u));
            previewDenah.forEach((u) => URL.revokeObjectURL(u));
        };
    }, [previewBangunan, previewDenah]);

    function validateFiles(files) {
        for (const f of files) {
            if (!f.type?.startsWith("image/")) return "File harus gambar (JPG/PNG/WebP).";
            if (f.size > 5 * 1024 * 1024) return "Ukuran tiap foto maksimal 5MB.";
        }
        return "";
    }

    function onPickBangunan(e) {
        const files = Array.from(e.target.files || []);
        const msg = validateFiles(files);
        if (msg) {
            setErr(msg);
            return;
        }
        setErr("");
        setLocalBangunan(files);
    }

    function onPickDenah(e) {
        const files = Array.from(e.target.files || []);
        const msg = validateFiles(files);
        if (msg) {
            setErr(msg);
            return;
        }
        setErr("");
        setLocalDenah(files);
    }

    function apply() {
        onApply?.({
            bangunanFiles: localBangunan,
            denahFiles: localDenah,
        });
        onClose?.();
    }

    return (
        <ModalShell open={open}>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
                <div>
                    <div className="text-lg font-extrabold text-slate-900">Ganti Foto Design</div>
                    <div className="mt-1 text-sm text-slate-500">
                        Jika kamu memilih foto baru, backend akan <b>mengganti seluruh</b> foto pada kategori tersebut.
                    </div>
                </div>
                <button
                    type="button"
                    className="rounded-xl p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    onClick={onClose}
                >
                    <FiX />
                </button>
            </div>

            <div className="space-y-6 p-6">
                {err && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>
                )}

                {/* FOTO BANGUNAN */}
                <div className="rounded-2xl border border-slate-200 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <div className="font-extrabold text-slate-900">Foto Bangunan</div>
                            <div className="text-sm text-slate-500">Saat ini:</div>
                        </div>

                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                            <FiUpload />
                            Pilih Foto Baru
                            <input type="file" accept="image/*" multiple className="hidden" onChange={onPickBangunan} />
                        </label>
                    </div>

                    <div className="mt-4">
                        <ThumbGrid urls={existingBangunan} />
                    </div>

                    {previewBangunan.length > 0 && (
                        <div className="mt-5">
                            <div className="mb-2 text-sm font-semibold text-slate-700">Preview (akan mengganti):</div>
                            <ThumbGrid urls={previewBangunan} />
                            <button
                                type="button"
                                onClick={() => setLocalBangunan([])}
                                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                <FiTrash2 />
                                Batalkan Pilihan
                            </button>
                        </div>
                    )}
                </div>

                {/* FOTO DENAH */}
                <div className="rounded-2xl border border-slate-200 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <div className="font-extrabold text-slate-900">Foto Denah</div>
                            <div className="text-sm text-slate-500">Saat ini:</div>
                        </div>

                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                            <FiUpload />
                            Pilih Foto Baru
                            <input type="file" accept="image/*" multiple className="hidden" onChange={onPickDenah} />
                        </label>
                    </div>

                    <div className="mt-4">
                        <ThumbGrid urls={existingDenah} />
                    </div>

                    {previewDenah.length > 0 && (
                        <div className="mt-5">
                            <div className="mb-2 text-sm font-semibold text-slate-700">Preview (akan mengganti):</div>
                            <ThumbGrid urls={previewDenah} />
                            <button
                                type="button"
                                onClick={() => setLocalDenah([])}
                                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                <FiTrash2 />
                                Batalkan Pilihan
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 p-6">
                <button
                    type="button"
                    onClick={onClose}
                    className="h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                    Batal
                </button>
                <button
                    type="button"
                    onClick={apply}
                    className="h-11 rounded-xl bg-slate-800 px-6 text-sm font-semibold text-white hover:bg-slate-900"
                >
                    Terapkan
                </button>
            </div>
        </ModalShell>
    );
}
