import { getAdminToken, clearAdminToken } from "./adminAuth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export async function adminFetch(path, options = {}) {
    const token = getAdminToken();

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };

    // ✅ kirim Bearer token jika ada
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
        credentials: "include",
    });

    // kalau 401, berarti token invalid/expired → logout
    if (res.status === 401) {
        clearAdminToken();
    }

    return res;
}
