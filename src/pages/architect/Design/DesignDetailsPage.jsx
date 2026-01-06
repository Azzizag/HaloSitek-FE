import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDesignCategories, createDesignDraft, updateDesignDraft } from "../../../lib/apiDesigns";
import { loadDraft, saveDraft } from "../../../lib/designDraft";

export default function DesignDetailsPage() {
    const navigate = useNavigate();
    const draft = loadDraft();

    const [categories, setCategories] = useState([]);
    const [loadingCat, setLoadingCat] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        title: draft.title || "",
        description: draft.description || "",
        kategori: draft.kategori || "",
        luas_bangunan: draft.luas_bangunan || "",
        luas_tanah: draft.luas_tanah || "",
    });

    // ✅ error handler
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState("");

    useEffect(() => {
        getDesignCategories()
            .then(setCategories)
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

        // opsional: kalau mau angka wajib valid
        // if (form.luas_bangunan && isNaN(Number(form.luas_bangunan))) nextErrors.luas_bangunan = "Luas bangunan harus berupa angka.";
        // if (form.luas_tanah && isNaN(Number(form.luas_tanah))) nextErrors.luas_tanah = "Luas tanah harus berupa angka.";

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
            if (!draft.designId) {
                const created = await createDesignDraft(form);
                saveDraft({ ...form, designId: created.id });
            } else {
                await updateDesignDraft(draft.designId, form);
                saveDraft({ ...form, designId: draft.designId });
            }
            navigate("/dashboard/architect/upload/images");
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
                            className={
                                "w-full rounded-xl border px-4 py-3 outline-none " +
                                (errors.luas_bangunan ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-slate-300")
                            }
                            value={form.luas_bangunan}
                            onChange={(e) => setField("luas_bangunan", e.target.value)}
                            placeholder="Luas bangunan (m²)"
                            inputMode="numeric"
                        />
                        {errors.luas_bangunan ? (
                            <div className="text-xs font-semibold text-red-600">{errors.luas_bangunan}</div>
                        ) : null}
                    </div>

                    <div className="space-y-1">
                        <input
                            className={
                                "w-full rounded-xl border px-4 py-3 outline-none " +
                                (errors.luas_tanah ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-slate-300")
                            }
                            value={form.luas_tanah}
                            onChange={(e) => setField("luas_tanah", e.target.value)}
                            placeholder="Luas tanah (m²)"
                            inputMode="numeric"
                        />
                        {errors.luas_tanah ? (
                            <div className="text-xs font-semibold text-red-600">{errors.luas_tanah}</div>
                        ) : null}
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
