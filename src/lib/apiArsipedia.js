import axios from "axios";

const API_ORIGIN = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL = `${API_ORIGIN}`;

export const apiArsipedia = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});


export async function getArsipediaList(config) {
    const res = await apiArsipedia.get("/arsipedia", config);
    return res.data?.data ?? [];
}

export async function getArsipediaDetail(id, config) {
    const res = await apiArsipedia.get(`/arsipedia/${id}`, config);
    return res.data?.data ?? null;
}

export function toPublicImageUrl(imagePath) {
    if (!imagePath) return null;

    const s = String(imagePath);
    if (s.startsWith("http")) return s;

    const cleaned = s.replace(/\\/g, "/");

    // multer biasanya simpan "uploads/arsipedia/xxx.jpg"
    if (cleaned.startsWith("uploads/")) return `${API_ORIGIN}/${cleaned}`;

    // fallback: anggap file ada di /uploads
    return `${API_ORIGIN}/uploads/${cleaned.replace(/^\/+/, "")}`;
}

function parseTags(tags) {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags.map(String);

    if (typeof tags === "string") {
        const s = tags.trim();
        if (!s) return [];
        try {
            const parsed = JSON.parse(s);
            if (Array.isArray(parsed)) return parsed.map(String);
        } catch {
            return s.split(",").map((x) => x.trim()).filter(Boolean);
        }
    }
    return [];
}

/** ✅ mapping yang sesuai backend kamu (tags string JSON, tidak ada excerpt, tidak ada category) */
export function mapArsipediaToCard(a) {
    const contentText = a?.content ?? "";
    const excerpt =
        contentText.length > 150 ? contentText.slice(0, 150) + "…" : contentText;

    return {
        id: a?.id,
        title: a?.title ?? "-",
        excerpt,
        author: "Admin",
        createdAt: a?.createdAt ?? null,
        tags: parseTags(a?.tags),
        coverImage:
            toPublicImageUrl(a?.imagePath) ??
            "https://via.placeholder.com/1200x800?text=No+Image",
        content: contentText, // detail page butuh ini
    };
}
