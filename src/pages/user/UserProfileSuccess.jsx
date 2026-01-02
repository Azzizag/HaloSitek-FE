import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheckCircle } from "react-icons/fi";

export default function UserProfileSuccess() {
    const navigate = useNavigate();

    useEffect(() => {
        const t = setTimeout(() => {
            navigate("/dashboard/profile", { replace: true });
        }, 1800);
        return () => clearTimeout(t);
    }, [navigate]);

    return (
        <div className="min-h-[calc(100vh-120px)] bg-white">
            <div className="border-b border-slate-200" />
            <div className="mx-auto grid max-w-6xl place-items-center px-6 py-20">
                <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                    <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-slate-50">
                        <FiCheckCircle className="text-5xl text-slate-700" />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-slate-800">
                        Profil Berhasil Diperbarui!
                    </h2>
                    <p className="mt-4 text-slate-500">
                        Data profil Anda telah berhasil disimpan.
                        <br />
                        Anda akan segera diarahkan kembali ke halaman profil.
                    </p>
                </div>
            </div>
        </div>
    );
}
