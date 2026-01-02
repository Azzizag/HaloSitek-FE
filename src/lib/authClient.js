// src/lib/authClient.js
const KEY = "access_token";

function emitAuthChanged() {
    window.dispatchEvent(new Event("auth:changed"));
}

export function setAccessToken(token) {
    if (!token) return;
    localStorage.setItem(KEY, token);
    emitAuthChanged();
}

export function clearAccessToken() {
    localStorage.removeItem(KEY);
    emitAuthChanged();
}


export function getAccessToken() {
    return localStorage.getItem(KEY) || "";
}


function decodeJwtPayload(token) {
    try {
        const parts = String(token || "").split(".");
        if (parts.length < 2) return null;

        // base64url -> base64
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const json = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );

        return JSON.parse(json);
    } catch {
        return null;
    }
}

export function getRoleFromToken(tokenArg) {
    const token = tokenArg || getAccessToken();
    const payload = decodeJwtPayload(token);
    return payload?.role || ""; // "USER" | "ARCHITECT" | "ADMIN"
}

export function isTokenExpired(tokenArg) {
    const token = tokenArg || getAccessToken();
    const payload = decodeJwtPayload(token);
    if (!payload?.exp) return false; // kalau tidak ada exp, anggap tidak bisa dicek
    const nowSec = Math.floor(Date.now() / 1000);
    return payload.exp <= nowSec;
}

export function isLoggedIn() {
    const t = getAccessToken();
    if (!t) return false;
    return !isTokenExpired(t);
}
