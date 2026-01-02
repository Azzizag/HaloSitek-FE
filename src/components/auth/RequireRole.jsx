import { Navigate, useLocation } from "react-router-dom";
import { getAccessToken, getRoleFromToken } from "../../lib/authClient";

export default function RequireRole({ allow = [], children }) {
    const location = useLocation();
    const token = getAccessToken();

    if (!token) {
        // kalau user/arsitek login page kamu beda, silakan ganti targetnya
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    const role = getRoleFromToken(token);
    if (!allow.includes(role)) {
        // token ada tapi role tidak cocok -> lempar ke role select / login
        return <Navigate to="/" replace />;
    }

    return children;
}
