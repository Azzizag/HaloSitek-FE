// src/pages/arsipedia/ArsipediaLandingPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getArsipediaList, mapArsipediaToCard } from "../../lib/apiArsipedia";

function CatPill({ active, children, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "h-9 rounded-xl border px-4 text-xs font-bold transition",
                active
                    ? "border-slate-700 bg-slate-700 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
            ].join(" ")}
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
                <div className="text-sm font-extrabold text-slate-900">{item.title}</div>
                <p className="mt-2 text-xs leading-5 text-slate-600">{item.excerpt}</p>

                {/* tags preview */}
                <div className="mt-3 flex flex-wrap gap-2">
                    {(item.tags || []).slice(0, 3).map((t, i) => (
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

export default function ArsipediaLandingPage() {
    const navigate = useNavigate();

    // ✅ sekarang filter pakai tag
    const [activeTag, setActiveTag] = useState("Semua");

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

    // ✅ buat daftar tag populer untuk pill (max 8)
    const tagPills = useMemo(() => {
        const freq = new Map();
        for (const a of articles) {
            for (const t of a.tags || []) {
                const key = String(t).trim();
                if (!key) continue;
                freq.set(key, (freq.get(key) || 0) + 1);
            }
        }
        const top = [...freq.entries()]
            .sort((x, y) => y[1] - x[1])
            .slice(0, 8)
            .map(([tag]) => tag);

        return ["Semua", ...top];
    }, [articles]);

    const latest = useMemo(() => {
        const list =
            activeTag === "Semua"
                ? articles
                : articles.filter((a) => (a.tags || []).includes(activeTag));

        return list.slice().reverse().slice(0, 6);
    }, [activeTag, articles]);

    return (
        <main className="w-full bg-slate-50">
            {/* Hero */}
            <section className="mx-auto max-w-7xl px-6 py-12">
                <div className="rounded-3xl bg-slate-50">
                    <div className="grid items-center gap-10 lg:grid-cols-2">
                        {/* left image */}
                        <div className="mx-auto w-full max-w-lg">
                            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                                <img
                                    alt="hero"
                                    className="h-[280px] w-full object-cover"
                                    src="https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80"
                                />
                            </div>
                        </div>

                        {/* right copy */}
                        <div className="mx-auto w-full max-w-xl">
                            <h1 className="text-4xl font-extrabold leading-tight text-slate-900">
                                Jelajahi Dunia
                                <br />
                                Arsitektur dengan
                                <br />
                                Arsipedia
                            </h1>
                            <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
                                Sumber terkemuka untuk artikel mendalam tentang bangunan, desain, dan sejarah
                                arsitektur.
                            </p>

                            <button
                                onClick={() => navigate("/arsipedia/search")}
                                className="mt-5 h-10 rounded-xl bg-slate-700 px-5 text-sm font-semibold text-white hover:bg-slate-800"
                            >
                                Jelajahi Artikel
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* “Categories” section tetap, tapi sekarang jadi Tag Filter */}
            <section className="bg-white">
                <div className="mx-auto max-w-7xl px-6 py-14">
                    <h2 className="text-center text-2xl font-extrabold text-slate-900">
                        Jelajahi Tag Populer
                    </h2>

                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        {tagPills.map((t) => (
                            <CatPill key={t} active={t === activeTag} onClick={() => setActiveTag(t)}>
                                {t}
                            </CatPill>
                        ))}
                    </div>
                </div>
            </section>

            {/* Latest */}
            <section className="bg-white">
                <div className="mx-auto max-w-7xl px-6 pb-16">
                    <h2 className="text-center text-2xl font-extrabold text-slate-900">
                        Artikel Terbaru
                    </h2>

                    {loading && (
                        <div className="mt-6 text-center text-sm text-slate-600">Loading...</div>
                    )}
                    {!loading && errMsg && (
                        <div className="mt-6 text-center text-sm text-red-600">{errMsg}</div>
                    )}
                    {!loading && !errMsg && latest.length === 0 && (
                        <div className="mt-6 text-center text-sm text-slate-600">
                            Belum ada artikel.
                        </div>
                    )}

                    <div className="mt-10 grid gap-6 md:grid-cols-3">
                        {latest.map((a) => (
                            <ArticleCard
                                key={a.id}
                                item={a}
                                onClick={() => navigate(`/arsipedia/${a.id}`)}
                            />
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
