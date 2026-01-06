// src/pages/design/CatalogHomePage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CatalogHomePage() {
    const navigate = useNavigate();

    const [q, setQ] = useState("");
    const [category, setCategory] = useState("");

    function onSubmit(e) {
        e.preventDefault();

        const params = new URLSearchParams();

        // 🔎 search keyword → title / description
        if (q.trim()) params.set("q", q.trim());

        // 🏷 kategori → field `kategori`
        if (category) params.set("category", category);

        navigate(`/catalog/results?${params.toString()}`);
    }

    return (
        <main className="mx-auto max-w-7xl px-6 py-10">
            <section className="grid gap-10 lg:grid-cols-[1.05fr_1fr]">
                {/* LEFT */}
                <div>
                    <h1 className="text-5xl font-extrabold leading-[1.05] text-slate-900">
                        Temukan
                        <br />
                        Keunggulan
                        <br />
                        Arsitektur
                        <br />
                        Berikutnya
                    </h1>

                    <p className="mt-6 max-w-xl text-sm leading-6 text-slate-600">
                        Jelajahi portofolio yang dikurasi, hubungkan dengan arsitek terkemuka,
                        dan temukan proyek inspiratif di seluruh dunia.
                    </p>

                    <form
                        onSubmit={onSubmit}
                        className="mt-8 w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                        {/* Keyword */}
                        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Cari judul atau deskripsi proyek..."
                                className="w-full text-sm outline-none"
                            />
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            {/* Kategori */}
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none"
                            >
                                <option value="">Jenis Proyek</option>
                                <option value="Perumahan Residensial">Perumahan Residensial</option>
                                <option value="Komersial">Komersial</option>
                                <option value="Interior">Interior</option>
                                <option value="Publik">Publik</option>
                            </select>

                            <button
                                type="submit"
                                className="h-11 rounded-xl bg-slate-700 px-4 text-sm font-semibold text-white hover:bg-slate-800"
                            >
                                Cari Proyek
                            </button>
                        </div>
                    </form>
                </div>

                {/* RIGHT HERO */}
                <div className="relative h-[420px] w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                    <img
                        src="/stock_katalog.png"
                        alt="hero"
                        className="absolute inset-0 h-full w-full object-cover object-center"
                        loading="lazy"
                        onError={(e) => {
                            if (e.currentTarget.src.includes("/no-image.png")) return;
                            e.currentTarget.src = "/no-image.png";
                        }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/25 via-transparent to-transparent" />

                    <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
                        <div className="text-lg font-extrabold text-slate-900">
                            Membangun Masa Depan, Satu Proyek pada Satu Waktu
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                            Jelajahi inovasi dalam desain dan arsitektur dari para profesional terbaik.
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
