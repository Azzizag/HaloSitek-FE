import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { Button, Input, Label } from "../components/ui";
import { getArchReg, setArchReg } from "../stores/archRegStore";
import Logo from "../components/Logo";

/* ---------- Komponen Baris Sertifikasi ---------- */
function CertRow({ idx, item, onChange, onRemove }) {
    const fileRef = useRef(null);
    const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL;

    function pickFile() {
        fileRef.current?.click();
    }
    async function onFileChange(e) {
        const f = e.target.files?.[0] || null;

        if (!f) {
            onChange(idx, { ...item, berkasUrl: null, fileName: "" });
            return;
        }

        try {
            // tampilkan loading per item (opsional)
            onChange(idx, { ...item, uploading: true, fileName: f.name });

            const berkasUrl = await uploadCertFile(f);

            // simpan ke state + store sebagai STRING (aman untuk localStorage)
            onChange(idx, {
                ...item,
                uploading: false,
                fileName: f.name,
                berkasUrl,        // ✅ INI YANG DIPAKAI SAAT REGISTER
                // jangan simpan File object
                file: null,
            });
        } catch (err) {
            console.error(err);
            onChange(idx, { ...item, uploading: false, berkasUrl: null });
            alert(err?.message || "Gagal upload file sertifikat");
        }
    }


    async function uploadCertFile(file) {
        const fd = new FormData();
        fd.append("berkas", file);

        const res = await fetch(`${API_BASE_URL}/certifications/public/upload`, {
            method: "POST",
            body: fd,
            cache: "no-store",
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Upload sertifikat gagal");
        return json?.data?.berkasUrl;
    }



    return (
        <div className="grid grid-cols-12 items-end gap-3">
            <div className="col-span-5">
                <Label>Nama Sertifikasi</Label>
                <Input
                    value={item.name}
                    onChange={(e) => onChange(idx, { ...item, name: e.target.value })}
                    placeholder="Contoh: Arsitek Berlisensi"
                />
            </div>

            <div className="col-span-4">
                <Label>Penerbit</Label>
                <Input
                    value={item.issuer}
                    onChange={(e) => onChange(idx, { ...item, issuer: e.target.value })}
                    placeholder="IAI / GBCI / dsb."
                />
            </div>

            {/* Mimic tombol kecil “Pilih File” + label filename */}
            <div className="col-span-2">
                <Label>Upload foto</Label>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={pickFile}
                        className="rounded-md bg-slate-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-700"
                    >
                        Pilih File
                    </button>
                    <span className="min-w-0 truncate rounded-md border px-2 py-1 text-xs text-slate-600">
                        {item.fileName || "—"}
                    </span>
                    <input
                        ref={fileRef}
                        type="file"
                        className="hidden"
                        onChange={onFileChange}
                        accept="image/*,.pdf"
                    />
                </div>
            </div>

            <div className="col-span-1">
                <Label>Tahun</Label>
                <Input
                    value={item.year}
                    onChange={(e) => onChange(idx, { ...item, year: e.target.value })}
                    placeholder="2020"
                />
            </div>

            <div className="col-span-12 sm:col-span-0 flex sm:block justify-end">
                <button
                    type="button"
                    onClick={() => onRemove(idx)}
                    className="rounded-md bg-red-500 px-3 py-2 text-white"
                    aria-label="Hapus sertifikasi"
                    title="Hapus"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}

/* ---------- Halaman ---------- */
export default function ArchitectRegisterProfessional() {
    const navigate = useNavigate();
    const saved = getArchReg();

    const [certs, setCerts] = useState(
        saved.certs?.length
            ? saved.certs
            : [
                { name: "", issuer: "", file: "", year: "" },
                { name: "", issuer: "", file: "", year: "" },
            ]
    );
    const [years, setYears] = useState(saved.years || "");
    const [areas, setAreas] = useState(saved.areas || "");
    const [skillInput, setSkillInput] = useState("");
    const [skills, setSkills] = useState(
        saved.skills || ["AutoCAD", "SketchUp", "Revit", "Desain Interior", "Perencanaan Kota"]
    );
    const [links, setLinks] = useState(
        saved.links || ["https://www.behance.net/contoharsitek", "https://contohportfolio.com/proyek1"]
    );

    function onChangeCert(i, next) {
        setCerts((prev) => prev.map((c, idx) => (idx === i ? next : c)));
    }
    function onRemoveCert(i) {
        setCerts((prev) => prev.filter((_, idx) => idx !== i));
    }
    function addCert() {
        setCerts((prev) => [...prev, { name: "", issuer: "", file: "", year: "" }]);
    }

    function addSkill() {
        if (!skillInput.trim()) return;
        setSkills((prev) => [...prev, skillInput.trim()]);
        setSkillInput("");
    }
    function removeSkill(i) {
        setSkills((prev) => prev.filter((_, idx) => idx !== i));
    }

    function addLink() {
        setLinks((prev) => [...prev, ""]);
    }
    function changeLink(i, val) {
        setLinks((prev) => prev.map((l, idx) => (idx === i ? val : l)));
    }
    function removeLink(i) {
        setLinks((prev) => prev.filter((_, idx) => idx !== i));
    }

    function handleNext() {
        const certsForStore = certs.map(c => ({
            name: c.name,
            issuer: c.issuer,
            year: c.year,
            fileName: c.fileName || "",
            berkasUrl: c.berkasUrl || null,
        }));


        setArchReg({ certs: certsForStore, years, areas, skills, links });
        navigate("/register/architect/confirm");
    }


    return (
        <div className="min-h-svh bg-white">
            {/* Header */}
            <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                <Logo className="h-7" />
            </header>

            <main className="mx-auto max-w-[900px] px-4 pb-16">
                {/* Title */}
                <div className="mt-6 text-center">
                    <h1 className="text-3xl font-extrabold">
                        Daftar sebagai Arsitek di HalositeK
                    </h1>
                    <p className="mt-2 text-slate-600">
                        Bergabunglah dengan jaringan profesional kami dan tingkatkan peluang
                        Anda. Selesaikan pendaftaran singkat ini untuk memulai.
                    </p>
                </div>

                {/* Card utama */}
                <section className="mt-8 rounded-2xl border p-6">
                    <h2 className="mb-1 text-xl font-bold">Formulir Pendaftaran Arsitek</h2>
                    <p className="mb-6 text-sm text-slate-600">
                        Ikuti 3 langkah mudah untuk menyelesaikan pendaftaran Anda.
                    </p>

                    {/* Stepper */}
                    <div className="mb-6 flex items-center gap-6 text-sm font-medium">
                        <div className="flex items-center gap-2">
                            <span className="grid size-6 place-items-center rounded-full bg-slate-900 text-white">1</span>
                            Informasi Dasar
                        </div>
                        <div className="h-px flex-1 bg-slate-200" />
                        <div className="flex items-center gap-2">
                            <span className="grid size-6 place-items-center rounded-full bg-slate-900 text-white">
                                2
                            </span>
                            Kualifikasi Profesional
                        </div>
                        <div className="h-px flex-1 bg-slate-200" />
                        <div className="flex items-center gap-2 text-slate-400">
                            <span className="grid size-6 place-items-center rounded-full border">3</span>
                            Konfirmasi & Pembayaran
                        </div>
                    </div>

                    {/* Judul blok besar */}
                    <h3 className="mb-3 text-lg font-semibold">Kualifikasi Profesional</h3>

                    {/* ---------- Sertifikasi ---------- */}
                    <div className="mb-6 rounded-xl border p-4">
                        <h4 className="font-semibold">Sertifikasi</h4>
                        <p className="mb-4 text-sm text-slate-600">
                            Tambahkan sertifikasi profesional yang relevan.
                        </p>

                        <div className="space-y-3">
                            {certs.map((c, idx) => (
                                <CertRow
                                    key={idx}
                                    idx={idx}
                                    item={c}
                                    onChange={onChangeCert}
                                    onRemove={onRemoveCert}
                                />
                            ))}
                        </div>

                        <div className="mt-3">
                            <button
                                type="button"
                                onClick={addCert}
                                className="rounded-md border px-3 py-2 text-sm"
                            >
                                + Tambah Sertifikasi
                            </button>
                        </div>
                    </div>

                    {/* ---------- Pengalaman Kerja ---------- */}
                    <div className="mb-6 rounded-xl border p-4">
                        <h4 className="font-semibold">Pengalaman Kerja</h4>
                        <p className="mb-3 text-sm text-slate-600">
                            Masukkan total tahun pengalaman profesional Anda.
                        </p>
                        <div className="grid gap-3">
                            <div>
                                <Label>Tahun Pengalaman</Label>
                                <Input
                                    value={years}
                                    onChange={(e) => setYears(e.target.value)}
                                    placeholder="5"
                                />
                            </div>
                            <div>
                                <Label>Area Pengalaman Kunci</Label>
                                <Input
                                    value={areas}
                                    onChange={(e) => setAreas(e.target.value)}
                                    placeholder="Desain Perumahan, Komersial, Tata Kota"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ---------- Keahlian Khusus ---------- */}
                    <div className="mb-6 rounded-xl border p-4">
                        <h4 className="font-semibold">Keahlian Khusus</h4>
                        <p className="mb-3 text-sm text-slate-600">
                            Sebutkan perangkat lunak, metodologi, atau keahlian unik lainnya.
                        </p>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Tambah keahlian baru (mis. AutoCAD, Revit)"
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={addSkill}
                                className="rounded-md bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                            >
                                Tambah
                            </button>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                            {skills.map((s, idx) => (
                                <span
                                    key={idx}
                                    className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm"
                                >
                                    {s}
                                    <button
                                        type="button"
                                        onClick={() => removeSkill(idx)}
                                        className="text-slate-500"
                                        aria-label="Hapus skill"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* ---------- Portofolio ---------- */}
                    <div className="mb-6 rounded-xl border p-4">
                        <h4 className="font-semibold">Portofolio</h4>
                        <p className="mb-3 text-sm text-slate-600">
                            Sertakan tautan ke portofolio online atau proyek Anda.
                        </p>
                        <div className="space-y-2">
                            {links.map((l, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <Input
                                        value={l}
                                        onChange={(e) => changeLink(idx, e.target.value)}
                                        placeholder="https://"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeLink(idx)}
                                        className="rounded-md bg-red-500 px-3 py-2 text-white"
                                        aria-label="Hapus tautan"
                                        title="Hapus"
                                    >
                                        🗑
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3">
                            <button
                                type="button"
                                onClick={addLink}
                                className="rounded-md border px-3 py-2 text-sm"
                            >
                                + Tambah Tautan Portofolio
                            </button>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-4 flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="muted"
                            onClick={() => navigate("/register/architect/basic")} // ← diubah
                        >
                            Kembali
                        </Button>
                        <Button type="button" onClick={handleNext}>
                            Lanjut
                        </Button>
                    </div>

                </section>
            </main>
        </div>
    );
}
