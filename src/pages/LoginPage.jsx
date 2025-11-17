import { useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "../layouts/AuthShell";
import Logo from "../components/Logo";
import { Button, Checkbox, Input, Label } from "../components/ui";


const BG_URL_2 =
    "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=1920&auto=format&fit=crop";


export default function LoginPage() {
    const [params] = useSearchParams();
    const role = params.get("role") || "";
    const navigate = useNavigate();


    function handleSubmit(e) {
        e.preventDefault();
        // TODO: hubungkan ke NextJS API
        navigate("/dashboard");
    }


    return (
        <AuthShell bgUrl={BG_URL_2}>
            <div className="w-full max-w-md rounded-2xl border border-white/50 bg-white/70 p-6 shadow-xl backdrop-blur">
                <div className="mb-5 flex flex-col items-center gap-4">
                    <Logo className="pt-10" />
                    <h1 className="text-center text-2xl font-extrabold text-slate-900">Selamat Datang!!</h1>
                    <p className="text-center text-sm text-slate-600">
                        Masuk ke akun Anda untuk melanjutkan{role ? ` sebagai ${role}` : ""}.
                    </p>
                </div>


                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="identity">Nama pengguna atau email</Label>
                        <Input id="identity" name="identity" autoComplete="username" placeholder="Masukkan nama pengguna atau email Anda" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="password">Kata sandi</Label>
                        <Input id="password" type="password" name="password" autoComplete="current-password" placeholder="Masukkan kata sandi Anda" />
                    </div>


                    <div className="flex items-center justify-between">
                        <Checkbox id="remember" label="Ingat Saya" />
                        <a className="text-sm font-medium text-indigo-700 hover:underline" href="/forgot-password">Lupa Kata Sandi?</a>
                    </div>


                    <Button type="submit">Masuk</Button>
                    <Button type="button" variant="muted" onClick={() => navigate("/register")}>Daftar</Button>
                </form>
            </div>
        </AuthShell>
    );
}