import { getAdminToken, clearAdminToken } from "./adminAuth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export async function apiAdmin(path, options = {}) {
    const token = getAdminToken();

    const headers = new Headers(options.headers || {});

    // kalau body adalah string JSON, baru set content-type
    const isFormData = options.body instanceof FormData;
    const isStringBody = typeof options.body === "string";

    if (!headers.has("Accept")) headers.set("Accept", "application/json");
    if (isStringBody && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    // ⚠️ jangan set content-type untuk FormData (biar boundary otomatis)
    if (isFormData && headers.has("Content-Type")) headers.delete("Content-Type");

    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
        credentials: "include",
    });

    if (res.status === 401) {
        clearAdminToken();
        const err = new Error("UNAUTHORIZED");
        err.status = 401;
        throw err;
    }

    // 204 no content
    if (res.status === 204) return { success: true };

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = data?.message || "Request failed";
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}
