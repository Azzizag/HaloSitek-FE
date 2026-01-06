// src/pages/ArchitectRegisterBasic.jsx
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { Input, Button, Label } from "../components/ui";
import Logo from "../components/Logo";
import { setArchReg, getArchReg } from "../stores/archRegStore";

export default function ArchitectRegisterBasic() {
    const navigate = useNavigate();
    const data = getArchReg();

    // -------- Avatar upload state --------
    const fileRef = useRef(null);
    const [avatar, setAvatar] = useState(
        data.photoDataUrl ||
        "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=128&h=128&auto=format&fit=crop"
    );
    const [errorMsg, setErrorMsg] = useState("");

    function pickAvatar() {
        fileRef.current?.click();
    }

    function onAvatarChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        const maxMB = 3;
        if (file.size > maxMB * 1024 * 1024) {
            alert(`Ukuran gambar maksimal ${maxMB} MB`);
            e.target.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setAvatar(reader.result); // data URL → preview
        };
        reader.readAsDataURL(file);
    }

    function clearAvatar() {
        setAvatar("");
    }

    function handleSubmit(e) {
        e.preventDefault();
        setErrorMsg("");

        const form = new FormData(e.currentTarget);

        const fullName = (form.get("fullName") || "").toString().trim();
        const email = (form.get("email") || "").toString().trim();
        const password = (form.get("password") || "").toString();
        const confirm = (form.get("confirmPassword") || "").toString();
        const phone = (form.get("phone") || "").toString().trim();

        // ---- Validasi dasar ----
        if (!fullName || !email || !password || !confirm || !phone) {
            setErrorMsg("Semua field wajib diisi.");
            return;
        }

        if (password !== confirm) {
            setErrorMsg("Password dan Ulangi Password tidak sama.");
            return;
        }

        // (opsional) validasi panjang password
        if (password.length < 8) {
            setErrorMsg("Password minimal 8 karakter.");
            return;
        }

        // Simpan ke store (merge dengan data lama kalau ada)
        setArchReg({
            ...data,
            fullName,
            email,
            password,
            phone,
            photoDataUrl: avatar,
        });

        // Lanjut ke step 2
        navigate("/register/architect/professional");
    }

    return (
        <div className="min-h-svh bg-white">
            {/* Header */}
            <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                <Logo className="h-7" />

            </header>

            {/* Title + Subtitle */}
            <main className="mx-auto max-w-4xl px-4 pb-16">
                <div className="mt-6 text-center">
                    <h1 className="text-3xl font-extrabold">
                        Daftar sebagai Arsitek di HalositeK
                    </h1>
                    <p className="mt-2 text-[18px] leading-relaxed text-slate-600">
                        Bergabunglah dengan jaringan profesional kami dan tingkatkan peluang
                        Anda. Selesaikan pendaftaran singkat ini untuk memulai.
                    </p>
                </div>

                {/* Card utama */}
                <section className="mx-auto mt-8 w-[899px] rounded-2xl border p-6">
                    <h2 className="mb-1 text-xl font-bold">Formulir Pendaftaran Arsitek</h2>
                    <p className="mb-6 text-sm text-slate-600">
                        Ikuti 3 langkah mudah untuk menyelesaikan pendaftaran Anda.
                    </p>

                    {/* Stepper */}
                    <div className="mb-6 flex items-center gap-6 text-sm font-medium">
                        <div className="flex items-center gap-2">
                            <span className="grid size-8 place-items-center rounded-full bg-slate-900 text-white">
                                1
                            </span>
                            Informasi Dasar
                        </div>
                        <div className="h-px flex-1 bg-slate-200" />
                        <div className="flex items-center gap-2 text-slate-400">
                            <span className="grid size-8 place-items-center rounded-full border">
                                2
                            </span>
                            Kualifikasi Profesional
                        </div>
                        <div className="h-px flex-1 bg-slate-200" />
                        <div className="flex items-center gap-2 text-slate-400">
                            <span className="grid size-8 place-items-center rounded-full border">
                                3
                            </span>
                            Konfirmasi & Pembayaran
                        </div>
                    </div>

                    {/* Info error */}
                    {errorMsg && (
                        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                            {errorMsg}
                        </div>
                    )}

                    {/* Subsection: Informasi Dasar */}
                    <div className="mb-3">
                        <h3 className="text-[18px] font-semibold">Informasi Dasar</h3>
                        <p className="text-sm text-slate-600">
                            Masukkan informasi dasar Anda seperti nama lengkap, email, dan
                            nomor telepon.
                        </p>
                    </div>

                    {/* Avatar Upload */}
                    <div className="my-4 grid place-items-center">
                        <button
                            type="button"
                            onClick={pickAvatar}
                            className="group relative"
                            aria-label="Unggah foto profil"
                        >
                            <img
                                src={
                                    avatar ||
                                    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
                                }
                                alt="avatar"
                                className="h-20 w-20 rounded-full object-cover ring-1 ring-black/30 shadow"
                            />
                            <span className="pointer-events-none absolute inset-0 rounded-full bg-black/0 transition group-hover:bg-black/20" />
                        </button>
                        <p className="mt-2 text-xs text-slate-500">
                            Klik foto untuk mengunggah (maks. 3 MB)
                        </p>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={onAvatarChange}
                        />
                        {avatar && (
                            <button
                                type="button"
                                onClick={clearAvatar}
                                className="mt-2 text-xs text-red-600 hover:underline"
                            >
                                Hapus foto
                            </button>
                        )}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <div>
                            <Label htmlFor="fullName">Nama Lengkap</Label>
                            <Input
                                id="fullName"
                                name="fullName"
                                placeholder="Masukkan nama lengkap Anda"
                                defaultValue={data.fullName || ""}
                            />
                        </div>

                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Masukkan alamat email Anda"
                                defaultValue={data.email || ""}
                            />
                        </div>

                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Masukkan Password Anda"
                            />
                        </div>

                        <div>
                            <Label htmlFor="confirmPassword">Ulangi Password</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                placeholder="Masukkan Kembali Password Anda"
                            />
                        </div>

                        <div>
                            <Label htmlFor="phone">Nomor Telepon</Label>
                            <Input
                                id="phone"
                                name="phone"
                                placeholder="Masukkan nomor telepon Anda"
                                defaultValue={data.phone || ""}
                            />
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="muted"
                                onClick={() => navigate(-1)}
                            >
                                Kembali
                            </Button>
                            <Button type="submit">Lanjut</Button>
                        </div>
                    </form>
                </section>
            </main>
        </div>
    );
}
