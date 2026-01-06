import { useEffect, useMemo, useRef, useState } from "react";
import { FiX, FiUpload, FiTrash2 } from "react-icons/fi";

const MAX_MB = 5;

export default function EditDesignModal({
    open,
    saving,
    design,
    onClose,
    onSave,

    value, // {title, description, kategori, luas_bangunan, luas_tanah}
    onChange,

    bangunanPicked,
    denahPicked,
    setBangunanPicked,
    setDenahPicked,

    bangunanDeleted,
    denahDeleted,
    setBangunanDeleted,
    setDenahDeleted,
}) {
    // ✅ HOOKS harus selalu dieksekusi, jangan taruh return sebelum ini
    const fileRef = useRef(null);

    // mode: "replace" => ganti index tertentu (single file)
    // mode: "append"  => tambah foto baru (bisa multi file)
    const [pickTarget, setPickTarget] = useState({ kind: "bangunan", mode: "append", index: null });

    const fotoBangunan = useMemo(() => (Array.isArray(design?.foto_bangunan) ? design.foto_bangunan : []), [design]);
    const fotoDenah = useMemo(() => (Array.isArray(design?.foto_denah) ? design.foto_denah : []), [design]);

    // ✅ error handler foto
    const [fotoError, setFotoError] = useState({ bangunan: "", denah: "" });

    // reset target & error tiap modal dibuka
    useEffect(() => {
        if (!open) return;
        setPickTarget({ kind: "bangunan", mode: "append", index: null });
        setFotoError({ bangunan: "", denah: "" });
    }, [open]);

    // ===== helpers =====
    function setKindError(kind, msg) {
        setFotoError((prev) => ({ ...prev, [kind]: msg || "" }));
    }

    function clearKindError(kind) {
        setFotoError((prev) => (prev?.[kind] ? { ...prev, [kind]: "" } : prev));
    }

    function validateFile(file) {
        if (!file) return "File kosong.";
        if (!file.type?.startsWith("image/")) return "File harus gambar (JPG/PNG/WebP).";
        if (file.size > MAX_MB * 1024 * 1024) return `Ukuran maksimal ${MAX_MB}MB.`;
        return null;
    }

    function makePreview(file) {
        return URL.createObjectURL(file);
    }

    function revokePreview(item) {
        if (item?.preview?.startsWith("blob:")) URL.revokeObjectURL(item.preview);
    }

    function requestPickReplace(kind, index) {
        setPickTarget({ kind, mode: "replace", index });
        clearKindError(kind);

        if (fileRef.current) {
            fileRef.current.value = "";
            fileRef.current.click();
        }
    }

    function requestPickAppend(kind) {
        setPickTarget({ kind, mode: "append", index: null });
        clearKindError(kind);

        if (fileRef.current) {
            fileRef.current.value = "";
            fileRef.current.click();
        }
    }

    function upsertReplacePicked(kind, index, file) {
        const preview = makePreview(file);
        const payload = {
            id: `rep-${kind}-${index}`, // id stabil
            op: "replace",
            index,
            file,
            preview,
        };

        const setter = kind === "bangunan" ? setBangunanPicked : setDenahPicked;
        setter((prev) => {
            const next = Array.isArray(prev) ? [...prev] : [];
            const i = next.findIndex((x) => x?.op === "replace" && x?.index === index);
            if (i >= 0) {
                revokePreview(next[i]);
                next[i] = payload;
            } else {
                next.push(payload);
            }
            return next;
        });
    }

    function pushAppendPicked(kind, files) {
        const setter = kind === "bangunan" ? setBangunanPicked : setDenahPicked;

        setter((prev) => {
            const next = Array.isArray(prev) ? [...prev] : [];
            files.forEach((file) => {
                const preview = makePreview(file);
                next.push({
                    id: `app-${kind}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                    op: "append",
                    index: null,
                    file,
                    preview,
                });
            });
            return next;
        });
    }

    function onPickFile(e) {
        const kind = pickTarget?.kind || "bangunan";
        const mode = pickTarget?.mode || "append";

        const fileList = Array.from(e.target.files || []);
        if (!fileList.length) return;

        // ✅ validate + kumpulkan error
        const valid = [];
        const rejected = [];

        for (const f of fileList) {
            const err = validateFile(f);
            if (!err) valid.push(f);
            else rejected.push({ name: f?.name || "unknown", err });
        }

        // ✅ tampilkan banner error jika ada yang ditolak
        if (rejected.length) {
            const lines = rejected.slice(0, 5).map((x) => `• ${x.name}: ${x.err}`);
            const more = rejected.length > 5 ? `\n• +${rejected.length - 5} file lain juga ditolak.` : "";
            setKindError(kind, `Beberapa file ditolak:\n${lines.join("\n")}${more}`);
        } else {
            // kalau semua valid, bersihkan error
            clearKindError(kind);
        }

        if (!valid.length) {
            e.target.value = "";
            return;
        }

        // ✅ replace: ambil 1 file pertama, beri info jika user pilih banyak
        if (mode === "replace") {
            if (valid.length > 1) {
                setKindError(kind, `Mode ganti hanya bisa 1 file. Dipakai: "${valid[0].name}".`);
            }
            upsertReplacePicked(kind, pickTarget.index, valid[0]);
        } else {
            // ✅ append: boleh multi
            pushAppendPicked(kind, valid);
        }

        e.target.value = "";
    }

    function cancelReplace(kind, index) {
        const setter = kind === "bangunan" ? setBangunanPicked : setDenahPicked;
        setter((prev) => {
            const next = Array.isArray(prev) ? [...prev] : [];
            const i = next.findIndex((x) => x?.op === "replace" && x?.index === index);
            if (i >= 0) {
                revokePreview(next[i]);
                next.splice(i, 1);
            }
            return next;
        });
    }

    function removeAppend(kind, id) {
        const setter = kind === "bangunan" ? setBangunanPicked : setDenahPicked;
        setter((prev) => {
            const next = Array.isArray(prev) ? [...prev] : [];
            const i = next.findIndex((x) => x?.op === "append" && x?.id === id);
            if (i >= 0) {
                revokePreview(next[i]);
                next.splice(i, 1);
            }
            return next;
        });
    }

    function markDelete(kind, index) {
        const delSetter = kind === "bangunan" ? setBangunanDeleted : setDenahDeleted;

        // kalau foto itu sudah ada replace picked, cancel dulu supaya konsisten
        cancelReplace(kind, index);

        delSetter((prev) => {
            const arr = Array.isArray(prev) ? prev : [];
            if (arr.includes(index)) return arr;
            return [...arr, index];
        });
    }

    function undoDelete(kind, index) {
        const delSetter = kind === "bangunan" ? setBangunanDeleted : setDenahDeleted;
        delSetter((prev) => (Array.isArray(prev) ? prev.filter((x) => x !== index) : []));
    }

    function getPicked(kind) {
        return kind === "bangunan"
            ? (Array.isArray(bangunanPicked) ? bangunanPicked : [])
            : (Array.isArray(denahPicked) ? denahPicked : []);
    }

    function getDeleted(kind) {
        return kind === "bangunan"
            ? (Array.isArray(bangunanDeleted) ? bangunanDeleted : [])
            : (Array.isArray(denahDeleted) ? denahDeleted : []);
    }

    function renderExisting(kind, photos) {
        const picked = getPicked(kind);
        const deleted = getDeleted(kind);

        return (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {photos.length ? (
                    photos.map((url, idx) => {
                        const isDel = deleted.includes(idx);
                        const rep = picked.find((x) => x?.op === "replace" && x?.index === idx);
                        const showUrl = rep?.preview || url;

                        return (
                            <div key={`${kind}-exist-${idx}`} className="rounded-xl border border-slate-200 p-3">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="text-xs font-semibold text-slate-700">#{idx + 1}</div>

                                    <div className="flex items-center gap-2">
                                        {rep && !isDel && (
                                            <button
                                                type="button"
                                                onClick={() => cancelReplace(kind, idx)}
                                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                title="Batalkan penggantian"
                                                disabled={saving}
                                            >
                                                <FiTrash2 />
                                                Batal Ganti
                                            </button>
                                        )}

                                        {isDel ? (
                                            <button
                                                type="button"
                                                onClick={() => undoDelete(kind, idx)}
                                                className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                                                disabled={saving}
                                            >
                                                Undo Hapus
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => markDelete(kind, idx)}
                                                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                                                disabled={saving}
                                                title="Hapus foto ini (akan diterapkan saat disimpan)"
                                            >
                                                <FiTrash2 />
                                                Hapus
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => requestPickReplace(kind, idx)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                            disabled={saving || isDel}
                                            title={isDel ? "Foto ditandai hapus, undo dulu jika ingin ganti" : "Ganti foto"}
                                        >
                                            <FiUpload />
                                            Ganti
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                                    <img
                                        src={showUrl}
                                        alt="foto"
                                        className={`h-28 w-full object-cover ${isDel ? "opacity-40" : ""}`}
                                    />
                                </div>

                                {isDel ? (
                                    <div className="mt-2 text-[11px] text-red-700">Foto ini akan dihapus saat disimpan.</div>
                                ) : rep ? (
                                    <div className="mt-2 text-[11px] text-emerald-700">Foto ini akan diganti saat disimpan.</div>
                                ) : null}
                            </div>
                        );
                    })
                ) : (
                    <div className="text-sm text-slate-500">Tidak ada foto.</div>
                )}
            </div>
        );
    }

    function renderAppended(kind) {
        const picked = getPicked(kind).filter((x) => x?.op === "append");

        if (!picked.length) return null;

        return (
            <div className="mt-3">
                <div className="text-xs font-semibold text-slate-600">Foto baru (belum disimpan)</div>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {picked.map((p) => (
                        <div key={p.id} className="rounded-xl border border-slate-200 p-3">
                            <div className="flex items-center justify-between">
                                <div className="text-xs font-semibold text-slate-700">Baru</div>
                                <button
                                    type="button"
                                    onClick={() => removeAppend(kind, p.id)}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                    disabled={saving}
                                    title="Hapus foto baru ini"
                                >
                                    <FiTrash2 />
                                    Hapus
                                </button>
                            </div>
                            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                                <img src={p.preview} alt="new" className="h-28 w-full object-cover" />
                            </div>
                            <div className="mt-2 text-[11px] text-slate-500">Akan ditambahkan saat disimpan.</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ✅ return boleh di sini (setelah hooks)
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
                    <div>
                        <div className="text-lg font-extrabold text-slate-900">Edit Design</div>
                        <div className="mt-1 text-sm text-slate-500">
                            Edit judul/deskripsi/dll + (opsional) kelola foto bangunan & denah.
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        disabled={saving}
                    >
                        <FiX />
                    </button>
                </div>

                <div className="max-h-[75vh] overflow-y-auto px-6 py-5">
                    <div className="grid gap-4">
                        <div>
                            <label className="text-sm font-semibold text-slate-700">Judul</label>
                            <input
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                                value={value.title}
                                onChange={(e) => onChange({ ...value, title: e.target.value })}
                                disabled={saving}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-slate-700">Deskripsi</label>
                            <textarea
                                className="mt-2 min-h-[96px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-300"
                                value={value.description}
                                onChange={(e) => onChange({ ...value, description: e.target.value })}
                                disabled={saving}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-semibold text-slate-700">Kategori</label>
                                <input
                                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                                    value={value.kategori}
                                    onChange={(e) => onChange({ ...value, kategori: e.target.value })}
                                    disabled={saving}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700">Luas Bangunan</label>
                                <input
                                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                                    value={value.luas_bangunan}
                                    onChange={(e) => onChange({ ...value, luas_bangunan: e.target.value })}
                                    disabled={saving}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-slate-700">Luas Tanah</label>
                            <input
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                                value={value.luas_tanah}
                                onChange={(e) => onChange({ ...value, luas_tanah: e.target.value })}
                                disabled={saving}
                            />
                        </div>

                        {/* FOTO SECTION */}
                        <div className="rounded-2xl border border-slate-200 p-4">
                            <div className="text-sm font-extrabold text-slate-900">Foto Design</div>
                            <div className="mt-1 text-xs text-slate-500">
                                Ganti foto per-index, tambah banyak foto baru sekaligus, atau hapus foto.
                                {" "}Maks ukuran: {MAX_MB}MB / file.
                            </div>

                            {/* Bangunan */}
                            <div className="mt-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-semibold text-slate-800">Foto Bangunan</div>
                                    <button
                                        type="button"
                                        onClick={() => requestPickAppend("bangunan")}
                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                        disabled={saving}
                                        title="Tambah foto bangunan (bisa pilih banyak)"
                                    >
                                        <FiUpload />
                                        Tambah Foto
                                    </button>
                                </div>

                                {fotoError.bangunan ? (
                                    <div className="mt-3 whitespace-pre-line rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                                        {fotoError.bangunan}
                                    </div>
                                ) : null}

                                {renderExisting("bangunan", fotoBangunan)}
                                {renderAppended("bangunan")}
                            </div>

                            {/* Denah */}
                            <div className="mt-6">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-semibold text-slate-800">Foto Denah</div>
                                    <button
                                        type="button"
                                        onClick={() => requestPickAppend("denah")}
                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                        disabled={saving}
                                        title="Tambah foto denah (bisa pilih banyak)"
                                    >
                                        <FiUpload />
                                        Tambah Foto
                                    </button>
                                </div>

                                {fotoError.denah ? (
                                    <div className="mt-3 whitespace-pre-line rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                                        {fotoError.denah}
                                    </div>
                                ) : null}

                                {renderExisting("denah", fotoDenah)}
                                {renderAppended("denah")}
                            </div>

                            {/* input file */}
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                multiple={pickTarget.mode === "append"} // ✅ append bisa multi
                                className="hidden"
                                onChange={onPickFile}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        disabled={saving}
                    >
                        Batal
                    </button>

                    <button
                        type="button"
                        onClick={onSave}
                        className="h-11 rounded-xl bg-slate-800 px-6 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                        disabled={saving}
                    >
                        {saving ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                </div>
            </div>
        </div>
    );
}
