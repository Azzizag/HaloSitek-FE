import { useNavigate } from "react-router-dom";
import AuthShell from "../layouts/AuthShell";
import Logo from "../components/Logo";
import { Button } from "../components/ui";

const BG_URL =
    "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=1920&auto=format&fit=crop";

export default function UserRegisterSuccess() {
    const navigate = useNavigate();

    return (
        <AuthShell bgUrl={BG_URL}>
            <div className="w-full max-w-md rounded-2xl border border-white/50 bg-white/80 p-8 text-center shadow-xl backdrop-blur">
                <div className="mb-4 flex flex-col items-center gap-3">
                    <Logo className="h-10" />
                    <h1 className="text-2xl font-extrabold text-slate-900">Registrasi Berhasil!</h1>
                    <p className="text-sm text-slate-600">
                        Akun Anda telah berhasil dibuat. Anda sekarang dapat masuk dan menjelajahi platform kami.
                    </p>
                </div>

                {/* Ikon centang sederhana */}
                <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full border-4 border-slate-700">
                    <svg viewBox="0 0 24 24" className="h-8 w-8 text-slate-700" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>

                <Button onClick={() => navigate("/login")}>Masuk</Button>
            </div>
        </AuthShell>
    );
}
