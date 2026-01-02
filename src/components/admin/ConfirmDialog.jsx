export default function ConfirmDialog({ open, title, message, onCancel, onConfirm }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 grid place-items-center bg-black/40">
            <div className="rounded-2xl bg-white p-6">
                <h3 className="font-bold">{title}</h3>
                <p className="mt-2 text-sm">{message}</p>
                <div className="mt-4 flex justify-end gap-2">
                    <button onClick={onCancel}>Batal</button>
                    <button onClick={onConfirm} className="text-red-600">Hapus</button>
                </div>
            </div>
        </div>
    );
}
