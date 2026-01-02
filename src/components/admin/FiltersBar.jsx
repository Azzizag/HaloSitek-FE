export default function FiltersBar({ left, right }) {
    return (
        <div className="flex items-center justify-between rounded-2xl border bg-white p-4">
            <div className="flex gap-2">{left}</div>
            <div>{right}</div>
        </div>
    );
}
