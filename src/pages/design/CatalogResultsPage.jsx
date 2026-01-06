// src/pages/design/CatalogResultsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
});

const FALLBACK_IMG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
    <rect width="100%" height="100%" fill="#f1f5f9"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
      fill="#64748b" font-family="Arial" font-size="48" font-weight="700">
      No Image
    </text>
  </svg>
`);

function unwrap(res) {
    const payload = res?.data ?? res;
    if (payload && typeof payload === "object" && "data" in payload) return payload.data;
    return payload;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "").replace(/\/+$/, "");

export function normalizeFileUrl(url) {
    if (!url) return null;

    let s = String(url).trim();

    s = s.replace(/\\/g, "/");

    if (/^https?:\/\//i.test(s)) {
        s = s.replace(/^https?:\/\/localhost:3000\/(https?:\/\/)/i, "$1");
        return s;
    }

    s = s.replace(/^\/+/, "");
    return `${BACKEND_ORIGIN}/${s}`;
}

function pickCover(design) {
    const bangunan = Array.isArray(design?.foto_bangunan) ? design.foto_bangunan : [];
    const denah = Array.isArray(design?.foto_denah) ? design.foto_denah : [];
    return normalizeFileUrl(bangunan[0] || denah[0]) || FALLBACK_IMG;
}

function DesignCard({ item }) {
    return (
        <Link
            to={`/catalog/designs/${item.id}`}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
            <div className="h-44 w-full bg-slate-100">
                <img
                    src={item.coverImageUrl}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_IMG;
                    }}
                />
            </div>

            <div className="p-5">
                <div className="text-sm font-extrabold text-slate-900">{item.title}</div>
                <div className="mt-1 text-xs text-slate-500">
                    {item.kategori || "-"}
                </div>
                <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-600">
                    {item.description || "-"}
                </p>
            </div>
        </Link>
    );
}

export default function CatalogResultsPage() {
    const [params, setParams] = useSearchParams();

    // URL params (sesuai CatalogHomePage.jsx)
    const page = Number(params.get("page") || "1");
    const limit = Number(params.get("limit") || "12");
    const q = params.get("q") || "";
    const category = params.get("category") || "";

    // Draft inputs
    const [qDraft, setQDraft] = useState(q);
    const [categoryDraft, setCategoryDraft] = useState(category);

    // ✅ kategori dinamis dari backend
    const [categories, setCategories] = useState([]);
    const [catLoading, setCatLoading] = useState(true);

    const [loading, setLoading] = useState(true);
    const [errMsg, setErrMsg] = useState("");
    const [items, setItems] = useState([]);

    const [pagination, setPagination] = useState({
        page,
        limit,
        total: 0,
        totalPages: null,
    });

    // sync draft ketika url param berubah
    useEffect(() => {
        setQDraft(q);
        setCategoryDraft(category);
    }, [q, category]);

    function onReset() {
        setQDraft("");
        setCategoryDraft("");

        const next = new URLSearchParams();
        next.set("page", "1");
        next.set("limit", "12");
        setParams(next);
    }

    // ✅ Fetch hasil list/search
    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                setLoading(true);
                setErrMsg("");

                // ✅ selalu baca dari URL params TERBARU
                const pageNow = Number(params.get("page") || "1");
                const limitNow = Number(params.get("limit") || "12");
                const qNow = params.get("q") || "";
                const categoryNow = params.get("category") || "";

                const hasFilter = Boolean(qNow || categoryNow);

                let payload;
                if (hasFilter) {
                    const qs = new URLSearchParams();
                    qs.set("page", String(pageNow));
                    qs.set("limit", String(limitNow));

                    if (qNow) qs.set("q", qNow);

                    if (categoryNow) {
                        qs.set("kategori", categoryNow); // ✅ backend kamu pakai ini
                        qs.set("category", categoryNow); // fallback
                    }

                    const res = await api.get(`/designs/search?${qs.toString()}`);
                    payload = unwrap(res);
                } else {
                    const res = await api.get(`/designs?page=${pageNow}&limit=${limitNow}`);
                    payload = unwrap(res);
                }

                const list = Array.isArray(payload?.data)
                    ? payload.data
                    : Array.isArray(payload)
                        ? payload
                        : [];

                const pg = payload?.pagination || {};
                const total = pg.total ?? pg.count ?? list.length;
                const totalPages =
                    pg.totalPages ?? (pg.total && limitNow ? Math.ceil(pg.total / limitNow) : null);

                const mapped = list.map((d) => ({
                    id: d.id,
                    title: d.title || "Untitled",
                    kategori: d.kategori || "",
                    description: d.description || "",
                    coverImageUrl: pickCover(d),
                }));

                if (!alive) return;

                setItems(mapped);
                setPagination({ page: pageNow, limit: limitNow, total, totalPages });
            } catch (e) {
                if (!alive) return;
                setItems([]);
                setPagination({ page: 1, limit: 12, total: 0, totalPages: null });
                setErrMsg(
                    e?.response?.data?.message ||
                    e?.message ||
                    "Gagal mengambil data katalog"
                );
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => { alive = false; };
    }, [params.toString()]);

    // ✅ Fetch kategori dari backend: /designs/meta/categories
    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                setCatLoading(true);
                const res = await api.get("/designs/meta/categories");
                const list = unwrap(res);
                if (!alive) return;
                setCategories(Array.isArray(list) ? list : []);
            } catch (e) {
                if (!alive) return;
                setCategories([]);
                console.error("Fetch categories failed:", e?.response?.data || e?.message || e);
            } finally {
                if (alive) setCatLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    const subtitle = useMemo(() => {
        const parts = [];
        if (q) parts.push(`kunci: "${q}"`);
        if (category) parts.push(`kategori: ${category}`);
        return parts.length ? parts.join(" • ") : "Semua proyek";
    }, [q, category]);

    function onSubmit(e) {
        e.preventDefault();
        const next = new URLSearchParams(params);

        // reset page saat filter berubah
        next.delete("page");

        if (qDraft.trim()) next.set("q", qDraft.trim());
        else next.delete("q");

        if (categoryDraft) next.set("category", categoryDraft);
        else next.delete("category");

        setParams(next);
    }

    function goPage(nextPage) {
        const next = new URLSearchParams(params);
        next.set("page", String(nextPage));
        setParams(next);
    }

    const canPrev = page > 1;
    const canNext =
        pagination.totalPages != null ? page < pagination.totalPages : items.length === limit;

    return (
        <div className="mx-auto w-full max-w-7xl px-6 py-10">
            {/* Filter bar */}
            <form
                onSubmit={onSubmit}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="flex-1 rounded-xl border border-slate-200 px-4 py-3">
                        <input
                            className="w-full text-sm outline-none"
                            placeholder="Cari judul atau deskripsi proyek..."
                            value={qDraft}
                            onChange={(e) => setQDraft(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3">
                        {/* ✅ kategori dinamis */}
                        <select
                            className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none"
                            value={categoryDraft}
                            onChange={(e) => setCategoryDraft(e.target.value)}
                            disabled={catLoading}
                            title={catLoading ? "Memuat kategori..." : "Pilih kategori"}
                        >
                            <option value="">
                                {catLoading ? "Memuat..." : "Jenis Proyek"}
                            </option>
                            {categories.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={onReset}
                            className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Reset
                        </button>

                        <button
                            type="submit"
                            className="h-11 rounded-xl bg-slate-700 px-5 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                            Cari
                        </button>
                    </div>
                </div>
            </form>

            {/* Heading */}
            <div className="mt-8">
                <h1 className="text-3xl font-extrabold text-slate-900">
                    Hasil Pencarian Proyek
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                    {subtitle}
                    {" • "}
                    Menampilkan {items.length} hasil{pagination.total ? ` dari ${pagination.total}` : ""}
                </p>
            </div>

            {/* Results */}
            <section className="mt-6">
                {loading ? (
                    <div className="grid gap-6 md:grid-cols-3">
                        {Array.from({ length: 9 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-slate-50"
                            />
                        ))}
                    </div>
                ) : errMsg ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {errMsg}
                    </div>
                ) : items.length ? (
                    <div className="grid gap-6 md:grid-cols-3">
                        {items.map((it) => (
                            <DesignCard key={it.id} item={it} />
                        ))}
                    </div>
                ) : (
                    <div className="py-16 text-center text-slate-400">
                        Pencarian Tidak Ditemukan
                    </div>
                )}
            </section>

            {/* Pagination */}
            <div className="mt-10 flex items-center justify-center gap-3 text-xs">
                <button
                    onClick={() => goPage(Math.max(1, page - 1))}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    disabled={!canPrev}
                    type="button"
                >
                    Prev
                </button>

                <span className="text-slate-600">
                    Page {page}
                    {pagination.totalPages ? ` / ${pagination.totalPages}` : ""}
                </span>

                <button
                    onClick={() => goPage(page + 1)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    disabled={!canNext}
                    type="button"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
