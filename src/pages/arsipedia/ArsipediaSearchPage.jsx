// src/pages/arsipedia/ArsipediaSearchPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { getArsipediaList, mapArsipediaToCard } from "../../lib/apiArsipedia";

function TagPill({ children, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
        >
            {children}
        </button>
    );
}

function ArticleCard({ item, onClick }) {
    return (
        <div
            className={[
                "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
                onClick ? "cursor-pointer hover:shadow-md transition" : "",
            ].join(" ")}
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={(e) => {
                if (!onClick) return;
                if (e.key === "Enter" || e.key === " ") onClick();
            }}
        >
            <div className="h-44 w-full bg-slate-100">
                <img
                    src={item.coverImage}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                        e.currentTarget.src =
                            "https://via.placeholder.com/1200x800?text=No+Image";
                    }}
                />
            </div>

            <div className="p-5">
                <div className="text-sm font-extrabold text-slate-900 line-clamp-2">
                    {item.title}
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-600 line-clamp-3">
                    {item.excerpt}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                    {(item.tags || []).slice(0, 4).map((t, i) => (
                        <span
                            key={`${t}-${i}`}
                            className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700"
                        >
                            {t}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function ArsipediaSearchPage() {
    const navigate = useNavigate();
    const [q, setQ] = useState("");

    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errMsg, setErrMsg] = useState("");

    useEffect(() => {
        let ignore = false;

        (async () => {
            try {
                setLoading(true);
                setErrMsg("");

                const list = await getArsipediaList();
                const mapped = (list || []).map(mapArsipediaToCard);

                if (!ignore) setArticles(mapped);
            } catch (e) {
                const msg =
                    e?.response?.data?.message || e?.message || "Gagal mengambil data Arsipedia";
                if (!ignore) setErrMsg(msg);
            } finally {
                if (!ignore) setLoading(false);
            }
        })();

        return () => {
            ignore = true;
        };
    }, []);

    // kumpulkan tag populer (untuk quick filter)
    const topTags = useMemo(() => {
        const freq = new Map();
        for (const a of articles) {
            for (const t of a.tags || []) {
                const key = String(t).trim();
                if (!key) continue;
                freq.set(key, (freq.get(key) || 0) + 1);
            }
        }
        return [...freq.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([tag]) => tag);
    }, [articles]);

    const results = useMemo(() => {
        const query = q.trim().toLowerCase();
        if (!query) return articles;

        return articles.filter((a) => {
            const hay = [
                a.title,
                a.excerpt,
                a.content, // dari mapArsipediaToCard (kalau kamu simpan)
                (a.tags || []).join(" "),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return hay.includes(query);
        });
    }, [articles, q]);

    return (
        <main className="w-full bg-slate-50">
            <section className="mx-auto max-w-7xl px-6 py-10">
                <div className="text-2xl font-extrabold text-slate-900">Cari Arsipedia</div>
                <p className="mt-2 text-sm text-slate-600">
                    Cari berdasarkan judul, isi artikel, atau tags.
                </p>

                <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <FiSearch className="text-slate-400" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Ketik kata kunci… (mis. BIM, fasade, tapak)"
                        className="w-full bg-transparent text-sm outline-none"
                    />
                </div>

                {topTags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {topTags.map((t) => (
                            <TagPill key={t} onClick={() => setQ(t)}>
                                #{t}
                            </TagPill>
                        ))}
                    </div>
                )}

                {loading && (
                    <div className="mt-8 text-center text-sm text-slate-600">Loading…</div>
                )}
                {!loading && errMsg && (
                    <div className="mt-8 text-center text-sm text-red-600">{errMsg}</div>
                )}

                {!loading && !errMsg && (
                    <div className="mt-6 text-xs text-slate-500">
                        Menampilkan {results.length} dari {articles.length} artikel
                    </div>
                )}

                <div className="mt-6 grid gap-6 md:grid-cols-3">
                    {results.map((a) => (
                        <ArticleCard
                            key={a.id}
                            item={a}
                            onClick={() => navigate(`/arsipedia/${a.id}`)}
                        />
                    ))}
                </div>
            </section>
        </main>
    );
}
