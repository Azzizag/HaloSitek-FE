export default function StatCard({ title, value, subtitle, Icon }) {
    return (
        <div className="rounded-2xl border bg-white p-6">
            <div className="flex justify-between">
                <div>
                    <p className="text-sm text-slate-500">{title}</p>
                    <p className="text-3xl font-bold">{value}</p>
                    {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
                </div>
                {Icon && <Icon className="text-xl text-slate-600" />}
            </div>
        </div>
    );
}
