export function Label({ htmlFor, children }) {
    return (
        <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
            {children}
        </label>
    );
}


export function Input({ id, type = "text", placeholder, ...rest }) {
    return (
        <input
            id={id}
            type={type}
            placeholder={placeholder}
            className="w-full rounded-md border border-slate-300 bg-white/90 px-3 py-2 text-slate-800 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            {...rest}
        />
    );
}


export function Checkbox({ id, label, ...rest }) {
    return (
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input id={id} type="checkbox" className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" {...rest} />
            {label}
        </label>
    );
}


export function Button({ children, variant = "primary", className = "", ...rest }) {
    const styles =
        variant === "primary"
            ? "bg-indigo-600 hover:bg-indigo-700 text-white"
            : variant === "muted"
                ? "bg-slate-700/90 hover:bg-slate-800/90 text-white"
                : "bg-white/70 hover:bg-white text-slate-900";
    return (
        <button
            className={`w-full rounded-md px-4 py-2 font-semibold shadow-sm transition ${styles} ${className}`}
            {...rest}
        >
            {children}
        </button>
    );
}