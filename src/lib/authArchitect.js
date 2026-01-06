// src/lib/apiArchitect.js
import { getAccessToken, clearAccessToken } from "./authClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function apiArchitect(path, options = {}) {
    const token = getAccessToken();

    // pakai Headers biar merge aman dan tidak ketiban
    const headers = new Headers(options.headers || {});
    // jangan paksa Content-Type untuk GET (aman untuk POST JSON tetap)
    if (!headers.has("Content-Type") && options.method && options.method !== "GET" && !(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }
    if (token) headers.set("Authorization", `Bearer ${token}`);

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
        // konsisten: kalau unauthorized, hapus access_token yang dipakai seluruh app
        clearAccessToken();
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
