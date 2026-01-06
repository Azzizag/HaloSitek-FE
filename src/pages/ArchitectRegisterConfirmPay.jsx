import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Logo from "../components/Logo";
import { Button } from "../components/ui";
import { getArchReg, clearArchReg } from "../stores/archRegStore";

// base URL API backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function ArchitectRegisterConfirmPay() {
    const navigate = useNavigate();
    const data = getArchReg();
    const [submitting, setSubmitting] = useState(false);

    // --- Normalisasi key lama & baru untuk tampilan ---
    const fullName = data.name || data.fullName || "-";
    const email = data.email || "-";
    const phone = data.phone || "-";

    const tahunPengalaman = data.tahunPengalaman ?? data.years ?? "";
    const areaPengalaman = data.areaPengalaman ?? data.areas ?? "";

    const skills = data.keahlianKhusus || data.skills || [];
    const certs = data.certifications || data.certs || [];
    const links = data.portfolioLinks || data.links || [];

    async function finish() {
        // Minimal cek data penting
        if (!data.email || !data.password || !(data.name || data.fullName)) {
            alert(
                "Data pendaftaran belum lengkap. Silakan kembali ke langkah sebelumnya dan lengkapi data."
            );
            return;
        }

        setSubmitting(true);
        try {
            // ✅ Step 3 hanya pakai berkasUrl yang sudah diupload & disimpan di store pada step 2
            const certificationsPayload = (certs || [])
                .filter((c) => c && (c.name || c.issuer || c.year || c.berkasUrl || c.fileName))
                .map((c, idx) => {
                    // Kalau user pilih file (ada fileName) tapi berkasUrl kosong,
                    // berarti berkasUrl tidak tersimpan di store -> step 2 perlu diperbaiki
                    if ((c.fileName || c.name || c.issuer || c.year) && !c.berkasUrl) {
                        // kasih warning saja, tetap kirim null biar tidak crash
                        console.warn(
                            `Certification #${idx + 1} tidak punya berkasUrl. Pastikan step 2 menyimpan berkasUrl ke store.`
                        );
                    }

                    return {
                        certificationName: c.name || "",
                        penerbit: c.issuer || "",
                        year: c.year ? Number(c.year) : null,
                        berkasUrl: c.berkasUrl || null, // ✅ ini yang dipakai backend
                    };
                });

            const payload = {
                email: data.email,
                password: data.password,
                name: data.name || data.fullName,
                phone: data.phone,
                tahunPengalaman: Number(data.tahunPengalaman ?? data.years ?? 0),
                areaPengalaman: data.areaPengalaman ?? data.areas ?? "",
                keahlianKhusus: skills,
                certifications: certificationsPayload,

                portfolioLinks: (Array.isArray(links) ? links : [])
                    .map((l) => (typeof l === "string" ? l : l?.url))
                    .filter((u) => u && u.trim())
                    .map((u, idx) => ({ url: u, order: idx })),
            };

            const res = await fetch(`${API_BASE_URL}/architects/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const text = await res.text();
            let body = {};
            try {
                body = text ? JSON.parse(text) : {};
            } catch {
                body = {};
            }

            if (!res.ok) {
                let message = "Pendaftaran arsitek gagal.";

                if (res.status === 409) {
                    message =
                        body?.message ||
                        "Email sudah terdaftar sebagai arsitek. Gunakan email lain.";
                } else if (Array.isArray(body?.errors) && body.errors.length) {
                    const detail = body.errors
                        .map((err) => {
                            if (typeof err === "string") return err;
                            if (err?.field && err?.message) return `${err.field}: ${err.message}`;
                            if (err?.message) return err.message;
                            return JSON.stringify(err);
                        })
                        .join("\n- ");

                    message = body?.message
                        ? `${body.message}:\n- ${detail}`
                        : `Terjadi kesalahan input:\n- ${detail}`;
                } else if (body?.message) {
                    message = body.message;
                }

                console.error("Architect register failed", { status: res.status, body });
                alert(message);
                return;
            }

            clearArchReg();
            navigate("/register/architect/status");
        } catch (err) {
            console.error("Unexpected error when registering architect:", err);
            alert(err?.message || "Terjadi kesalahan tak terduga saat mengirim pendaftaran.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-svh bg-slate-50">
            <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                <Logo className="h-7" />
            </header>

            <main className="mx-auto max-w-5xl px-4 pb-16">
                <div className="mt-4 text-center">
                    <h1 className="text-3xl font-extrabold">Daftar sebagai Arsitek di HalositeK</h1>
                    <p className="mt-2 text-slate-600">
                        Tinjau informasi Anda sebelum mengirim pendaftaran.
                    </p>
                </div>

                <section className="mt-8 rounded-3xl border bg-white px-8 py-8 shadow-sm">
                    <div>
                        <h2 className="text-xl font-semibold">Formulir Pendaftaran Arsitek</h2>
                        <p className="mt-1 text-sm text-slate-600">
                            Konfirmasi data Anda sebelum mengirim.
                        </p>

                        <div className="mt-6 flex items-center gap-6 text-sm font-medium">
                            <div className="flex items-center gap-2 text-slate-700">
                                <span className="grid size-6 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                                    1
                                </span>
                                Informasi Dasar
                            </div>
                            <div className="h-px flex-1 bg-slate-200" />
                            <div className="flex items-center gap-2 text-slate-700">
                                <span className="grid size-6 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                                    2
                                </span>
                                Kualifikasi Profesional
                            </div>
                            <div className="h-px flex-1 bg-slate-200" />
                            <div className="flex items-center gap-2 text-slate-900">
                                <span className="grid size-6 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                                    3
                                </span>
                                Konfirmasi
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 space-y-6">
                        <h3 className="text-base font-semibold">Konfirmasi Pendaftaran</h3>

                        <div className="rounded-2xl border px-6 py-5">
                            <div className="mb-3 flex items-center justify-between">
                                <h4 className="text-[15px] font-semibold">Informasi Pribadi</h4>
                                <a
                                    className="rounded-md border px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50"
                                    href="/register/architect/basic"
                                >
                                    Ubah
                                </a>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-slate-500">Nama Lengkap</div>
                                    <div className="font-medium">{fullName}</div>
                                </div>
                                <div>
                                    <div className="text-slate-500">Email</div>
                                    <div className="font-medium">{email}</div>
                                </div>
                                <div>
                                    <div className="text-slate-500">Nomor Telepon</div>
                                    <div className="font-medium">{phone}</div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border px-6 py-5">
                            <div className="mb-3 flex items-center justify-between">
                                <h4 className="text-[15px] font-semibold">Kualifikasi Profesional</h4>
                                <a
                                    className="rounded-md border px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50"
                                    href="/register/architect/professional"
                                >
                                    Ubah
                                </a>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-slate-500">Sertifikasi</div>
                                    <ul className="mt-1 list-disc pl-5">
                                        {certs.length ? (
                                            certs.map((c, i) => (
                                                <li key={i}>
                                                    {c?.name || "-"} {c?.year ? `(${c.year})` : ""} — {c?.issuer || "-"}
                                                    {c?.berkasUrl ? (
                                                        <span className="ml-2 text-xs text-slate-500">(file OK)</span>
                                                    ) : (
                                                        <span className="ml-2 text-xs text-amber-600">(file belum tersimpan)</span>
                                                    )}
                                                </li>
                                            ))
                                        ) : (
                                            <li>-</li>
                                        )}
                                    </ul>
                                </div>

                                <div>
                                    <div className="text-slate-500">Tahun Pengalaman</div>
                                    <div className="font-medium">{tahunPengalaman || "-"}</div>

                                    <div className="mt-3 text-slate-500">Perangkat & Keahlian</div>
                                    <div className="mt-1 flex flex-wrap gap-2">
                                        {skills.length ? (
                                            skills.map((s, i) => (
                                                <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                                                    {s}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-slate-500">-</span>
                                        )}
                                    </div>
                                </div>

                                <div className="col-span-2">
                                    <div className="text-slate-500">Portofolio</div>
                                    <div className="mt-1 grid grid-cols-1 gap-1 md:grid-cols-2">
                                        {links.length ? (
                                            links.map((l, i) => (
                                                <a
                                                    key={i}
                                                    href={typeof l === "string" ? l : l?.url}
                                                    className="truncate text-indigo-600 hover:underline"
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    {typeof l === "string" ? l : l?.url}
                                                </a>
                                            ))
                                        ) : (
                                            <span className="text-sm text-slate-500">-</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <Button type="button" variant="muted" onClick={() => navigate(-1)} disabled={submitting}>
                            Kembali
                        </Button>
                        <Button type="button" onClick={finish} disabled={submitting}>
                            {submitting ? "Mengirim..." : "Lanjutkan"}
                        </Button>
                    </div>
                </section>
            </main>
        </div>
    );
}
