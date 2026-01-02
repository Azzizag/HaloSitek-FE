// src/lib/apiDesign.js (punyamu: apiDesigns.js)
import axios from "axios";
import { getAccessToken } from "./authClient"; // ✅ tambah ini (sesuaikan path)

const API_ORIGIN = "http://localhost:3000";
const API_BASE_URL = `${API_ORIGIN}/api`;

export const apiDesign = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

// ✅ inject Bearer token (penting untuk endpoint verifyArchitect)
apiDesign.interceptors.request.use((config) => {
    const token = getAccessToken?.();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ResponseFormatter.success -> unwrap
function unwrap(res) {
    const payload = res?.data ?? res;
    if (payload && typeof payload === "object" && "data" in payload) return payload.data;
    return payload;
}

export async function getDesignById(id) {
    const res = await apiDesign.get(`/designs/${id}`);
    return unwrap(res);
}

export async function getDesignList({ page = 1, limit = 12 } = {}) {
    const res = await apiDesign.get(`/designs?page=${page}&limit=${limit}`);
    return unwrap(res);
}

export async function searchDesigns({ q, page = 1, limit = 12 } = {}) {
    const res = await apiDesign.get(
        `/designs/search?q=${encodeURIComponent(q || "")}&page=${page}&limit=${limit}`
    );
    return unwrap(res);
}

export async function getDesignsByCategory({ kategori, page = 1, limit = 12 } = {}) {
    const res = await apiDesign.get(
        `/designs/category/${encodeURIComponent(kategori || "")}?page=${page}&limit=${limit}`
    );
    return unwrap(res);
}

/** util kecil */
export function normalizeFileUrl(url) {
    if (!url) return null;
    const s = String(url);
    if (s.startsWith("http")) return s;
    // jaga-jaga kalau backend kirim path relatif
    return `${API_ORIGIN}/${s.replace(/^\/+/, "")}`;
}

export async function getDesignCategories() {
    const res = await apiDesign.get(`/designs/meta/categories`);
    return unwrap(res); // -> ["Rumah Minimalis","Rumah Tropis"]
}

export async function createDesignDraft(payload) {
    // payload: {title, description, kategori, luas_bangunan, luas_tanah}
    const res = await apiDesign.post(`/designs/architect/my-designs`, payload, {
        headers: { "Content-Type": "application/json" },
    });
    return unwrap(res); // -> design object (punya id)
}

export async function updateDesignDraft(id, payload) {
    const res = await apiDesign.put(`/designs/architect/my-designs/${id}`, payload, {
        headers: { "Content-Type": "application/json" },
    });
    return unwrap(res);
}

export async function uploadDesignImages(id, { fotoBangunan = [], fotoDenah = [] }) {
    const fd = new FormData();
    fotoBangunan.forEach((f) => fd.append("foto_bangunan", f));
    fotoDenah.forEach((f) => fd.append("foto_denah", f));

    const res = await apiDesign.put(`/designs/architect/my-designs/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrap(res);
}
