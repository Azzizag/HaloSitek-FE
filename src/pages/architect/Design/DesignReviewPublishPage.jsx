import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDesignById } from "../../../lib/apiDesigns";
import { clearDraft, loadDraft } from "../../../lib/designDraft";

export default function DesignReviewPublishPage() {
    const navigate = useNavigate();
    const draft = useMemo(() => loadDraft(), []);
    const [design, setDesign] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!draft.designId) {
            navigate("/dashboard/architect/upload");
            return;
        }
        getDesignById(draft.designId)
            .then(setDesign)
            .catch(() => setDesign(null))
            .finally(() => setLoading(false));
    }, [draft.designId, navigate]);

    function onPublish() {
        // Tidak ada status publish -> anggap selesai
        clearDraft();
        navigate(`/catalog/designs/${draft.designId}`);
    }

    if (loading) return <div className="p-10">Loading...</div>;
    if (!design) return <div className="p-10">Design tidak ditemukan.</div>;

    return (
        <div className="mx-auto w-full max-w-5xl px-4 py-10">
            <h1 className="text-3xl font-extrabold">Tinjau & Publikasikan</h1>

            <div className="mt-6 grid gap-6 rounded-2xl border p-6 lg:grid-cols-2">
                <div className="space-y-3">
                    <div><b>Judul:</b> {design.title}</div>
                    <div><b>Kategori:</b> {design.kategori || "-"}</div>
                    <div><b>Luas Bangunan:</b> {design.luas_bangunan || "-"} m²</div>
                    <div><b>Luas Tanah:</b> {design.luas_tanah || "-"} m²</div>
                    <div><b>Deskripsi:</b><br />{design.description || "-"}</div>
                </div>

                <div>
                    <div className="font-bold">Foto Bangunan</div>
                    <div className="mt-2 flex flex-wrap gap-3">
                        {(design.foto_bangunan || []).map((u) => (
                            <img key={u} src={u} alt="" className="h-20 w-28 rounded-xl object-cover" />
                        ))}
                    </div>

                    <div className="mt-5 font-bold">Foto Denah</div>
                    <div className="mt-2 flex flex-wrap gap-3">
                        {(design.foto_denah || []).map((u) => (
                            <img key={u} src={u} alt="" className="h-20 w-28 rounded-xl object-cover" />
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
                <button className="rounded-xl border px-4 py-2" onClick={() => navigate("/dashboard/architect/upload/images")}>
                    Kembali
                </button>
                <button className="rounded-xl bg-slate-900 px-5 py-2 font-bold text-white" onClick={onPublish}>
                    Publikasikan Desain
                </button>
            </div>
        </div>
    );
}
