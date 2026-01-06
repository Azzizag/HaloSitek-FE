// src/components/architect/ProfileDesignCard.jsx
import { FiEye, FiTag, FiEdit3, FiTrash2 } from "react-icons/fi";

export default function ProfileDesignCard({ design, onDetail, onEdit, onDelete }) {
    const title = design?.title || "(Tanpa Judul)";
    const kategori = design?.kategori || "-";
    const views = typeof design?.views === "number" ? design.views : (design?.views ?? 0);
    const cover =
        design?.coverUrl ||
        design?.foto_bangunan?.[0] ||
        design?.foto_denah?.[0] ||
        null;


    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Cover */}
            <div className="relative h-36 w-full bg-slate-100">
                {cover && (
                    <div className="mb-3 overflow-hidden rounded-xl border border-slate-200">
                        <img src={cover} alt="cover" className="h-36 w-full object-cover" />
                    </div>
                )}

                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/40 to-transparent" />
            </div>

            {/* Body */}
            <div className="p-4">
                <div className="text-base font-extrabold text-slate-900 line-clamp-1">{title}</div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <div className="inline-flex items-center gap-2">
                        <FiTag className="text-slate-400" />
                        <span>
                            Kategori: <span className="font-semibold text-slate-700">{kategori}</span>
                        </span>
                    </div>

                    <div className="inline-flex items-center gap-2">
                        <FiEye className="text-slate-400" />
                        <span>
                            Views: <span className="font-semibold text-slate-700">{views}</span>
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                    <button
                        type="button"
                        onClick={() => onDetail?.(design)}
                        className="h-10 flex-1 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Detail
                    </button>

                    <button
                        type="button"
                        onClick={() => onEdit?.(design)}
                        className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-800 text-sm font-semibold text-white hover:bg-slate-900"
                    >
                        <FiEdit3 />
                        Edit
                    </button>

                    <button
                        type="button"
                        onClick={() => onDelete?.(design)}
                        className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                        <FiTrash2 />
                        Hapus
                    </button>
                </div>
            </div>
        </div>
    );
}
