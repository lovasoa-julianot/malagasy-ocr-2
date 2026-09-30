import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ChefRoute() {
  const { role, chef, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <span className="loading loading-spinner loading-lg text-emerald-500" />
      </div>
    );
  }

  if (role !== "CHEF_FOKONTANY" || !chef) {
    return <Navigate to="/leader/login" replace />;
  }

  return <Outlet />;
}
