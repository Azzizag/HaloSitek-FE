// src/lib/apiDesigns.js
import axios from "axios";
import { getAccessToken } from "./authClient";

const API_ORIGIN = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL = `${API_ORIGIN}`;

export const apiDesign = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

function extractApiErrorMessage(err) {
    const status = err?.response?.status;
    const data = err?.response?.data;

    // 1) backend kirim string langsung
    if (typeof data === "string" && data.trim()) return data;

    // 2) backend kirim object { message, errors, ... }
    const msg =
        data?.message ||
        data?.error ||
        data?.msg ||
        null;

    // 2a) kalau ada errors array → gabungkan
    if (Array.isArray(data?.errors) && data.errors.length) {
        const details = data.errors
            .map((x) => x?.message || x?.msg || x?.error || String(x))
            .filter(Boolean)
            .join("\n");

        // kalau msg generik seperti "Validation failed", tampilkan detail saja
        if (msg && /validation failed/i.test(msg) && details) return details;

        if (details) return msg ? `${msg}\n${details}` : details;
    }

    // 3) kalau ada message dari backend
    if (msg) return msg;

    // 4) fallback manusiawi (jangan axios default)
    if (status === 413) return "Ukuran upload terlalu besar. Kurangi jumlah/ukuran gambar.";
    if (status === 415) return "Format file tidak didukung. Pastikan upload file gambar.";
    if (status === 500) return "Server sedang bermasalah (500). Coba lagi beberapa saat.";
    if (status) return `Gagal memproses request (HTTP ${status}).`;

    // 5) fallback terakhir
    return "Gagal upload gambar.";
}

function throwNormalizedApiError(err) {
    const e = new Error(extractApiErrorMessage(err));
    e.status = err?.response?.status;
    e.data = err?.response?.data;
    throw e;
}


// ✅ inject Bearer token
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

/**
 * ✅ Helper: paksa foto_bangunan/foto_denah jadi ARRAY string.
 * - support array asli
 * - support string JSON '["a","b"]'
 * - support string tunggal 'uploads\\.png'
 */
export function toStringArray(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean).map(String);

    if (typeof val === "string") {
        const s = val.trim();
        if (!s) return [];

        if (s.startsWith("[") && s.endsWith("]")) {
            try {
                const parsed = JSON.parse(s);
                if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
            } catch {
                // ignore
            }
        }
        return [s];
    }

    return [];
}

export function normalizeFileUrl(input) {
    if (!input) return null;
    let s = String(input).trim();

    // backslash -> slash
    s = s.replace(/\\/g, "/");

    const idxHttps = s.indexOf("/https://");
    if (idxHttps !== -1) s = s.slice(idxHttps + 1);

    const idxHttp = s.indexOf("/http://");
    if (idxHttp !== -1) s = s.slice(idxHttp + 1);

    // absolute already
    if (/^https?:\/\//i.test(s)) return s;

    // relative path -> join origin
    if (!s.startsWith("/")) s = `/${s}`;
    return `${API_ORIGIN}${s}`;
}

// ✅ alias biar konsisten dengan page yang import normalizeUrl
export const normalizeUrl = normalizeFileUrl;

// ===================== PUBLIC DESIGNS =====================
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

export async function getDesignCategories() {
    const DEFAULT_CATEGORIES = [
        "Rumah Minimalis",
        "Rumah Modern",
        "Rumah Tropis",
        "Rumah Klasik",
        "Rumah Industrial",
        "Rumah Scandinavian",
        "Rumah Mediterania",
        "Ruko",
        "Kost",
        "Villa",
        "Interior",
        "Renovasi",
    ];

    // ambil dari backend (distinct kategori yang sudah dipakai)
    let fromApi = [];
    try {
        const res = await api.get("/designs/meta/categories");
        const raw = res?.data?.data ?? res?.data ?? [];
        fromApi = Array.isArray(raw) ? raw : [];
    } catch {
        fromApi = [];
    }

    // merge + unique + sort
    const merged = [...DEFAULT_CATEGORIES, ...fromApi]
        .map((x) => String(x || "").trim())
        .filter(Boolean);

    return Array.from(new Set(merged)).sort((a, b) => a.localeCompare(b, "id-ID"));
}


// ===================== ARCHITECT (MY DESIGNS) =====================

// ✅ create design (draft) - JSON
export async function createDesignDraft(payload) {
    const res = await apiDesign.post(`/designs/architect/my-designs`, payload, {
        headers: { "Content-Type": "application/json" },
    });
    return unwrap(res);
}

// ✅ update design (JSON) - text-only
export async function updateDesignDraft(id, payload) {
    const res = await apiDesign.put(`/designs/architect/my-designs/${id}`, payload, {
        headers: { "Content-Type": "application/json" },
    });
    return unwrap(res);
}

// ✅ list desain milik arsitek yang login
export async function getMyDesigns({ page = 1, limit = 12 } = {}) {
    const res = await apiDesign.get(
        `/designs/architect/my-designs?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`
    );
    return unwrap(res);
}

/**
 * ✅ update desain (FormData / JSON)
 * IMPORTANT:
 * - Kalau FormData: JANGAN set Content-Type manual (biar boundary otomatis)
 */
export async function updateMyDesign(designId, body) {
    const isForm = body instanceof FormData;

    const res = await apiDesign.put(`/designs/architect/my-designs/${designId}`, body, {
        headers: isForm ? undefined : { "Content-Type": "application/json" },
    });

    return unwrap(res);
}


// ✅ hapus desain
export async function deleteMyDesign(designId) {
    const res = await apiDesign.delete(`/designs/architect/my-designs/${designId}`);
    return unwrap(res);
}

// (opsional) upload images terpisah
export async function uploadDesignImages(id, { fotoBangunan = [], fotoDenah = [] }) {
    try {
        const fd = new FormData();
        fotoBangunan.forEach((f) => fd.append("foto_bangunan", f));
        fotoDenah.forEach((f) => fd.append("foto_denah", f));

        const res = await apiDesign.put(`/designs/architect/my-designs/${id}`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return unwrap(res);
    } catch (err) {
        throwNormalizedApiError(err); // ✅ lempar message backend
    }
}

