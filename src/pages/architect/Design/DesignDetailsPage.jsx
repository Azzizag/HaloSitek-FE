// src/pages/.../DesignDetailsPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getDesignCategories, createDesignDraft, updateDesignDraft } from "../../../lib/apiDesigns";

export default function DesignDetailsPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // ✅ kalau mode edit, kirim designId di URL: ?designId=xxxx
    const designId = searchParams.get("designId");

    const [categories, setCategories] = useState([]);
    const [loadingCat, setLoadingCat] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        title: "",
        description: "",
        kategori: "",
        luas_bangunan: "",
        luas_tanah: "",
    });

    // ✅ error handler
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState("");

    useEffect(() => {
        getDesignCategories()
            .then((cats) => setCategories(Array.isArray(cats) ? cats : []))
            .catch(() => setCategories([]))
            .finally(() => setLoadingCat(false));
    }, []);

    function setField(k, v) {
        setForm((s) => ({ ...s, [k]: v }));
        // clear error per field saat user mengetik
        setErrors((prev) => {
            if (!prev?.[k]) return prev;
            const next = { ...prev };
            delete next[k];
            return next;
        });
        setFormError("");
    }

    function validate() {
        const nextErrors = {};
        if (!form.title.trim()) nextErrors.title = "Judul proyek wajib diisi.";
        if (!form.kategori) nextErrors.kategori = "Kategori wajib dipilih.";
        return nextErrors;
    }

    async function onNext() {
        const nextErrors = validate();
        setErrors(nextErrors);
        setFormError("");

        if (Object.keys(nextErrors).length) {
            setFormError("Mohon lengkapi field yang wajib diisi.");
            return;
        }

        setSaving(true);
        try {
            let id = designId;

            if (!id) {
                const created = await createDesignDraft(form);
                id = created?.id;
            } else {
                await updateDesignDraft(id, form);
            }

            if (!id) throw new Error("DesignId tidak ditemukan setelah simpan.");

            // ✅ lanjut step upload gambar (bawa designId via query)
            navigate(`/dashboard/architect/upload/images?designId=${encodeURIComponent(id)}`);
        } catch (e) {
            setFormError(e?.message || "Gagal menyimpan draft.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="mx-auto w-full max-w-2xl px-4 py-10">
            <h1 className="text-3xl font-extrabold">Unggah Desain Anda</h1>

            <div className="mt-6 space-y-4 rounded-2xl border p-6">
                {formError ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        {formError}
                    </div>
                ) : null}

                <div className="space-y-1">
                    <input
                        className={
                            "w-full rounded-xl border px-4 py-3 outline-none " +
                            (errors.title ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-slate-300")
                        }
                        value={form.title}
                        onChange={(e) => setField("title", e.target.value)}
                        placeholder="Judul proyek *"
                    />
                    {errors.title ? <div className="text-xs font-semibold text-red-600">{errors.title}</div> : null}
                </div>

                <div className="space-y-1">
                    <textarea
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-300"
                        value={form.description}
                        onChange={(e) => setField("description", e.target.value)}
                        placeholder="Deskripsi"
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                        <input
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-300"
                            value={form.luas_bangunan}
                            onChange={(e) => setField("luas_bangunan", e.target.value)}
                            placeholder="Luas bangunan (m²)"
                            inputMode="numeric"
                        />
                    </div>

                    <div className="space-y-1">
                        <input
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-300"
                            value={form.luas_tanah}
                            onChange={(e) => setField("luas_tanah", e.target.value)}
                            placeholder="Luas tanah (m²)"
                            inputMode="numeric"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <select
                        className={
                            "w-full rounded-xl border px-4 py-3 outline-none " +
                            (errors.kategori ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-slate-300")
                        }
                        value={form.kategori}
                        disabled={loadingCat}
                        onChange={(e) => setField("kategori", e.target.value)}
                    >
                        <option value="">{loadingCat ? "Memuat kategori..." : "Pilih kategori *"}</option>
                        {categories.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                    {errors.kategori ? <div className="text-xs font-semibold text-red-600">{errors.kategori}</div> : null}
                </div>

                <div className="flex justify-end">
                    <button
                        className="rounded-xl bg-slate-900 px-5 py-2 font-bold text-white disabled:opacity-60"
                        disabled={saving}
                        onClick={onNext}
                    >
                        {saving ? "Menyimpan..." : "Lanjutkan ke Gambar"}
                    </button>
                </div>
            </div>
        </div>
    );
}
