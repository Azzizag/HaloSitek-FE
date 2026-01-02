// src/lib/apiArchitect.js
import { getAccessToken, clearAccessToken } from "./authClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export async function apiArchitect(path, options = {}) {
    const token = getAccessToken();

    const headers = new Headers(options.headers || {});
    if (
        !headers.has("Content-Type") &&
        options.method &&
        options.method !== "GET" &&
        !(options.body instanceof FormData)
    ) {
        headers.set("Content-Type", "application/json");
    }

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
        credentials: "include",
    });

    let data = {};
    try {
        data = await res.json();
    } catch {
        // ignore
    }

    if (res.status === 401 || res.status === 403) {
        clearAccessToken(); // 🔥 token tunggal untuk seluruh app
        const err = new Error("ARCH_UNAUTHORIZED");
        err.status = res.status;
        err.data = data;
        throw err;
    }

    if (!res.ok) {
        const err = new Error(data?.message || "Request gagal");
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

export async function uploadCertificationPublic(file) {
    const fd = new FormData();
    fd.append("berkas", file);

    // endpoint backend: /api/certifications/public/upload
    const json = await apiArchitect("/api/certifications/public/upload", {
        method: "POST",
        body: fd,
    });

    // backend kamu biasanya return { data: { berkasUrl } }
    const berkasUrl = json?.data?.berkasUrl;
    if (!berkasUrl) {
        const err = new Error("Upload berhasil tapi berkasUrl tidak ditemukan di response.");
        err.data = json;
        throw err;
    }

    return berkasUrl;
}

// bikin URL absolut kalau backend menyimpan path relatif (mis. "uploads/xxx.pdf")
export function toAbsoluteUrl(u) {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    if (!u) return null;
    if (/^https?:\/\//i.test(u)) return u;
    const cleaned = u.startsWith("/") ? u : `/${u}`;
    return `${API_BASE_URL}${cleaned}`;
}
