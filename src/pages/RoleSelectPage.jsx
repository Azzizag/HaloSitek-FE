import AuthShell from "../layouts/AuthShell";
import Logo from "../components/Logo";
import { Button } from "../components/ui";


const BG_URL_2 =
    "/images/background-login.png"; // modern building


export default function RoleSelectPage() {
    return (
        <AuthShell bgUrl={BG_URL_2}>
            <div className=" w-md h-[534px] rounded-2xl border border-white/50 bg-[#f3f4f6] p-8 shadow-xl backdrop-blur">
                <div className="mb-6 flex flex-col items-center gap-4">
                    <Logo />
                    <h1 className="text-center text-3xl font-extrabold text-slate-900 mb-14 mt-3">Selamat Datang!</h1>
                    <p className="text-center text-sm text-slate-600 mb-14">Pilih peran Anda untuk melanjutkan:</p>
                </div>
                <div className="space-y-3">
                    <a href="/login?role=User">
                        <Button className="bg-[#356BB3]! hover:bg-[#2f5e9c]! mb-6">User</Button>
                    </a>
                    <a href="/login?role=Arsitek">
                        <Button variant="muted">Arsitek</Button>
                    </a>
                </div>
            </div>
        </AuthShell>
    );
}