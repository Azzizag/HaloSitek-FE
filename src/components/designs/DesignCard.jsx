import { Link } from "react-router-dom";

export default function DesignCard({ item }) {
    const cover =
        item?.coverUrl ||
        item?.thumbnailUrl ||
        item?.imageUrl ||
        item?.images?.[0] ||
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=70";

    return (
        <Link
            to={`/katalog/${item?.id || "detail"}`}
            state={{ item }}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
        >
            <div className="relative h-44 w-full bg-slate-100">
                <img src={cover} alt={item?.title || "cover"} className="h-full w-full object-cover" />
                <div className="absolute inset-0 opacity-0 transition group-hover:opacity-10" />
            </div>

            <div className="p-5">
                <div className="text-base font-extrabold text-slate-900 line-clamp-1">
                    {item?.title || item?.name || "Judul Proyek"}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                    {item?.year || item?.createdAt?.slice?.(0, 4) || "2023"}
                </div>

                <p className="mt-3 text-sm text-slate-600 line-clamp-2">
                    {item?.summary || item?.description || "Deskripsi singkat proyek belum tersedia."}
                </p>
            </div>
        </Link>
    );
}
