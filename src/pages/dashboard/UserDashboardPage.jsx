import { useNavigate } from "react-router-dom";

export default function UserDashboardPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50">
            <main className="mx-auto w-full max-w-7xl px-6">
                {/* ✅ isi viewport & center vertikal (kurangi space kosong) */}
                <div className="grid min-h-[calc(100vh-88px)] items-center gap-10 py-10 lg:grid-cols-2 lg:py-0">
                    {/* Left */}
                    <div>
                        <h1 className="text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
                            Temukan Inspirasi
                            <br />
                            Desain Terbaik
                        </h1>

                        <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                            Jelajahi perpustakaan referensi desain kami yang luas untuk proyek Anda berikutnya.
                            Dari UI/UX hingga branding, kami memiliki apa yang Anda butuhkan.
                        </p>

                        <button
                            className="mt-8 rounded-xl bg-slate-800 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-900"
                            onClick={() => navigate("/catalog")}
                        >
                            Jelajahi Sekarang
                        </button>
                    </div>

                    {/* Right */}
                    <div className="flex justify-center lg:justify-end">
                        <div className="w-full max-w-xl overflow-hidden rounded-2xl shadow-sm ring-1 ring-slate-200">
                            <img
                                src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80"
                                alt="hero"
                                className="aspect-[16/10] w-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
