import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { isAuthenticated, loading, role } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-950"><span className="loading loading-spinner loading-lg text-emerald-500" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!role) return <Navigate to="/login" replace />;
  return <Outlet />;
}
