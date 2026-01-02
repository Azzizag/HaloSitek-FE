// src/lib/apiClient.js
import { getAccessToken, clearAccessToken } from "./authClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export async function apiClient(path, options = {}) {
    const token = getAccessToken();

    const res = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
    });

    let data = {};
    try {
        data = await res.json();
    } catch {
        // ignore
    }

    if (res.status === 401) {
        clearAccessToken();
        const err = new Error("UNAUTHORIZED");
        err.data = data;
        throw err;
    }

    if (!res.ok) {
        const err = new Error(data?.message || "Request gagal");
        err.data = data;
        throw err;
    }

    return data;
}
