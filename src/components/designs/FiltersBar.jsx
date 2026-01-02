export default function FiltersBar({
    q, setQ,
    category, setCategory,
    location, setLocation,
    dateRange, setDateRange,
    onSubmit,
    loading,
}) {
    return (
        <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4">
                <div className="relative">
                    <input
                        className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-300"
                        placeholder="Cari berdasarkan kata kunci, gaya, atau arsitek..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                    <select
                        className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-300"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option value="">Jenis Proyek</option>
                        <option value="Rumah Minimalis">Rumah Minimalis</option>
                        <option value="Perumahan Residensial">Perumahan Residensial</option>
                        <option value="Hotel">Hotel</option>
                        <option value="Kantor">Kantor</option>
                    </select>

                    <select
                        className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-300"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    >
                        <option value="">Lokasi</option>
                        <option value="Jakarta">Jakarta</option>
                        <option value="Bandung">Bandung</option>
                        <option value="Surabaya">Surabaya</option>
                    </select>

                    <select
                        className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-300"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                    >
                        <option value="">Rentang Tanggal</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                    </select>

                    <button
                        disabled={loading}
                        className="h-11 rounded-xl bg-slate-800 px-5 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                        type="submit"
                    >
                        {loading ? "Memuat..." : "Cari Proyek"}
                    </button>
                </div>
            </div>
        </form>
    );
}
