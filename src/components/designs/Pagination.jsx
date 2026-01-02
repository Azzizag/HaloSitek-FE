export default function Pagination({ page, setPage, hasNext }) {
    return (
        <div className="flex items-center justify-center gap-3 pt-6">
            <button
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                type="button"
            >
                Prev
            </button>
            <div className="text-sm text-slate-600">Page {page}</div>
            <button
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-50"
                disabled={!hasNext}
                onClick={() => setPage((p) => p + 1)}
                type="button"
            >
                Next
            </button>
        </div>
    );
}
