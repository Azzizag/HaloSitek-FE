// src/lib/apiClient.js
import { getAccessToken, clearAccessToken } from "./authClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function safeReadJson(res) {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
        try {
            return await res.json();
        } catch {
            return null;
        }
    }
    // fallback text (kalau backend ngirim plain text)
    try {
        const t = await res.text();
        return t ? { message: t } : null;
    } catch {
        return null;
    }
}

export async function apiClient(path, options = {}) {
    const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
    const token = getAccessToken();

    const headers = new Headers(options.headers || {});
    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }
    if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetch(url, {
        ...options,
        headers,
    });

    const data = await safeReadJson(res);

    // unauthorized
    if (res.status === 401 || res.status === 403) {
        clearAccessToken();
        const err = new Error(data?.message || "UNAUTHORIZED");
        err.status = res.status;
        err.data = data;
        throw err;
    }

    if (!res.ok || data?.success === false) {
        const err = new Error(data?.message || `Request failed (${res.status})`);
        err.status = res.status;
        err.data = data; // ✅ penting: bawa payload backend
        throw err;
    }

    return data;
}
