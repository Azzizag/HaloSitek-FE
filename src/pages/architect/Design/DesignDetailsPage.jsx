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

    useEffect(() => {
        getDesignCategories()
            .then(setCategories)
            .catch(() => setCategories([]))
            .finally(() => setLoadingCat(false));
    }, []);

    function setField(k, v) {
        setForm((s) => ({ ...s, [k]: v }));
    }

    async function onNext() {
        if (!form.title.trim()) return alert("Judul proyek wajib diisi.");
        if (!form.kategori) return alert("Kategori wajib dipilih.");

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
            alert(e?.message || "Gagal menyimpan draft.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="mx-auto w-full max-w-2xl px-4 py-10">
            {/* bebas kamu styling ulang */}
            <h1 className="text-3xl font-extrabold">Unggah Desain Anda</h1>

            <div className="mt-6 space-y-4 rounded-2xl border p-6">
                <input
                    className="w-full rounded-xl border px-4 py-3"
                    value={form.title}
                    onChange={(e) => setField("title", e.target.value)}
                    placeholder="Judul proyek"
                />

                <textarea
                    className="w-full rounded-xl border px-4 py-3"
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    placeholder="Deskripsi"
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <input
                        className="w-full rounded-xl border px-4 py-3"
                        value={form.luas_bangunan}
                        onChange={(e) => setField("luas_bangunan", e.target.value)}
                        placeholder="Luas bangunan (m²)"
                    />
                    <input
                        className="w-full rounded-xl border px-4 py-3"
                        value={form.luas_tanah}
                        onChange={(e) => setField("luas_tanah", e.target.value)}
                        placeholder="Luas tanah (m²)"
                    />
                </div>

                <select
                    className="w-full rounded-xl border px-4 py-3"
                    value={form.kategori}
                    disabled={loadingCat}
                    onChange={(e) => setField("kategori", e.target.value)}
                >
                    <option value="">{loadingCat ? "Memuat kategori..." : "Pilih kategori"}</option>
                    {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>

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
