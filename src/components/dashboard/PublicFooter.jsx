import { FiFacebook, FiTwitter, FiInstagram, FiLinkedin } from "react-icons/fi";

export default function PublicFooter({ variant = "simple" }) {
    if (variant === "simple") {
        return (
            <footer className="w-full border-t border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 text-sm text-slate-600">
                    <div className="font-semibold italic text-slate-800">halositek</div>
                    <div>© 2024 Referensiku. Semua hak dilindungi undang-undang.</div>
                </div>
            </footer>
        );
    }

    return (
        <footer className="w-full border-t border-slate-200 bg-white">
            <div className="mx-auto max-w-7xl px-6 py-10">
                <div className="grid gap-10 md:grid-cols-5">
                    <div className="md:col-span-2">
                        <div className="text-xl font-extrabold italic text-slate-900">halositek</div>
                        <p className="mt-3 max-w-sm text-sm text-slate-600">
                            Sumber inspirasi desain UI/UX, branding, dan banyak lagi.
                        </p>

                        <div className="mt-4 flex items-center gap-4 text-slate-600">
                            <FiFacebook className="text-lg" />
                            <FiTwitter className="text-lg" />
                            <FiInstagram className="text-lg" />
                            <FiLinkedin className="text-lg" />
                        </div>
                    </div>

                    <div>
                        <div className="text-sm font-bold text-slate-900">Perusahaan</div>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>Tentang Kami</li>
                            <li>Karir</li>
                            <li>Blog</li>
                            <li>Mitra</li>
                        </ul>
                    </div>

                    <div>
                        <div className="text-sm font-bold text-slate-900">Produk</div>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>Fitur</li>
                            <li>Harga</li>
                            <li>Integrasi</li>
                            <li>FAQ</li>
                        </ul>
                    </div>

                    <div>
                        <div className="text-sm font-bold text-slate-900">Sumber Daya</div>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>Pusat Bantuan</li>
                            <li>Tutorial</li>
                            <li>Komunitas</li>
                        </ul>

                        <div className="mt-6">
                            <div className="text-sm font-bold text-slate-900">Siap untuk Terinspirasi?</div>
                            <button className="mt-3 h-11 w-full rounded-xl bg-slate-800 text-sm font-semibold text-white hover:bg-slate-900">
                                Mulai Sekarang
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500">
                    © 2024 Referensiku. Semua hak dilindungi undang-undang.
                </div>
            </div>
        </footer>
    );
}
