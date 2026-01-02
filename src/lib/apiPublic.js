// src/lib/apiPublic.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// Ambil token mana pun yang tersedia (user/architect/admin)
function getAnyAccessToken() {
    const user = localStorage.getItem("access_token") || "";
    const arch = localStorage.getItem("architect_access_token") || "";
    const admin = localStorage.getItem("admin_token") || "";
    return arch || user || admin || "";
}

/**
 * apiPublic: default tidak mengirim Authorization.
 * Jika endpoint butuh auth (opsional), set third param { auth: true }.
 */
export async function apiPublic(path, options = {}, config = { auth: false }) {
    const token = config?.auth ? getAnyAccessToken() : "";

    const headers = {
        ...(options.headers || {}),
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

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

    if (!res.ok) {
        const err = new Error(data?.message || "Request gagal");
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}
