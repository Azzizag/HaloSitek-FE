// src/hooks/useAuthSession.js
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { getAccessToken, getRoleFromToken } from "../lib/authClient";

/**
 * Custom event name untuk update auth state di tab yang sama.
 * Kita trigger event ini saat setAccessToken/clearAccessToken dipanggil.
 */
const AUTH_CHANGED_EVENT = "auth:changed";

function mapJwtRole(jwtRole) {
    const r = String(jwtRole || "").toUpperCase();
    if (r === "ADMIN") return "admin";
    if (r === "ARCHITECT") return "arsitek";
    return "user";
}

export function emitAuthChanged() {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

/**
 * useAuthSession()
 * - return role: "user" | "arsitek" | "admin"
 * - isAuthed: boolean
 * - token: string | null
 *
 * Navbar/route guard/page mana pun bisa pakai hook ini.
 */
export default function useAuthSession() {
    const location = useLocation();
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const onStorage = (e) => {
            // storage event hanya untuk perubahan dari tab lain
            if (!e || e.key === "access_token") setTick((v) => v + 1);
        };

        const onAuthChanged = () => setTick((v) => v + 1);

        window.addEventListener("storage", onStorage);
        window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);

        return () => {
            window.removeEventListener("storage", onStorage);
            window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
        };
    }, []);

    // Recompute saat ada tick (token berubah), atau route berubah (setelah login biasanya redirect)
    const session = useMemo(() => {
        const token = getAccessToken();
        const jwtRole = getRoleFromToken(token);
        const role = mapJwtRole(jwtRole);

        return {
            token: token || null,
            role,
            isAuthed: Boolean(token),
        };
    }, [tick, location.key]);

    return session;
}
