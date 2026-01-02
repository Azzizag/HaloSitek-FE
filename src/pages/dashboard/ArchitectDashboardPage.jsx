import PublicNavbar from "../../components/dashboard/PublicNavbar";
import PublicFooter from "../../components/dashboard/PublicFooter";

export default function ArchitectDashboardPage() {

    return (
        <div className="min-h-screen bg-slate-50">

            <main className="mx-auto w-full max-w-7xl px-6 py-16">
                <div className="grid items-center gap-10 lg:grid-cols-2">
                    {/* Left */}
                    <div>
                        <h1 className="text-5xl font-extrabold leading-tight text-slate-900">
                            Temukan Inspirasi
                            <br />
                            Desain Terbaik
                        </h1>
                        <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
                            Jelajahi perpustakaan referensi desain kami yang luas untuk proyek Anda berikutnya.
                            Dari UI/UX hingga branding, kami memiliki apa yang Anda butuhkan.
                        </p>

                        <button className="mt-8 rounded-xl bg-slate-800 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-900">
                            Jelajahi Sekarang
                        </button>
                    </div>

                    {/* Right */}
                    <div className="flex justify-center lg:justify-end">
                        <div className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-slate-200">
                            <img
                                src="https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=1200&q=80"
                                alt="hero"
                                className="h-[320px] w-[560px] object-cover md:h-[360px]"
                            />
                        </div>
                    </div>
                </div>
            </main>

        </div>
    );
}
