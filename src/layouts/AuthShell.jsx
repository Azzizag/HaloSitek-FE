const BG_URL_1 =
    "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?q=80&w=1920&auto=format&fit=crop"; // city/building


export default function AuthShell({ bgUrl = BG_URL_1, children }) {
    return (
        <div className="min-h-svh w-full overflow-hidden bg-slate-900">
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${bgUrl})` }}
                aria-hidden
            />
            <div className="absolute inset-0 bg-slate-900/30" aria-hidden />
            <div className="absolute inset-0 backdrop-blur-[2px]" aria-hidden />


            <div className="relative mx-auto flex min-h-svh max-w-7xl items-center justify-center px-4">
                {children}
            </div>
        </div>
    );
}