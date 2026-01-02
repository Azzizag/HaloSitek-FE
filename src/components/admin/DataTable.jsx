export default function DataTable({ title, columns, rows, renderActions }) {
    return (
        <div className="rounded-2xl border bg-white">
            {title && <div className="border-b p-4 font-bold">{title}</div>}
            <table className="w-full text-sm">
                <thead className="bg-slate-50">
                    <tr>
                        {columns.map((c) => (
                            <th key={c.key} className="px-4 py-3 text-left">
                                {c.label}
                            </th>
                        ))}
                        {renderActions && <th className="px-4 py-3">Aksi</th>}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r) => (
                        <tr key={r.id} className="border-t">
                            {columns.map((c) => (
                                <td key={c.key} className="px-4 py-3">
                                    {r[c.key]}
                                </td>
                            ))}
                            {renderActions && (
                                <td className="px-4 py-3">{renderActions(r)}</td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
