const KEY = "design_upload_draft_v1";

export function loadDraft() {
    try {
        return JSON.parse(localStorage.getItem(KEY) || "{}");
    } catch {
        return {};
    }
}
export function saveDraft(d) {
    localStorage.setItem(KEY, JSON.stringify(d));
}
export function clearDraft() {
    localStorage.removeItem(KEY);
}
