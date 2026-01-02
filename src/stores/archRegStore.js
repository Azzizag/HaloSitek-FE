// Simple localStorage-backed store for architect registration
const KEY = "archRegData_v1";


export function getArchReg() {
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}


export function setArchReg(patch) {
    const cur = getArchReg();
    const next = { ...cur, ...patch };
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
}


export function clearArchReg() {
    localStorage.removeItem(KEY);
}