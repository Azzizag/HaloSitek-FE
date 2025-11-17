// Menggunakan file dari public/ (Vite/CRA/Next akan menyajikan di root URL)
// Simpan gambar sebagai: public/logo.png


export default function Logo({ className }) {
    const base = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : "/";
    const src = `${base}logo.png`;


    return (
        <img
            src={src}
            alt="Halositek"
            className={`h-20 w-60 object-contain ${className}`}
            draggable={false}
        />
    );
}