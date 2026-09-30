import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AgentRoute() {
  const { role, agent, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-950"><span className="loading loading-spinner loading-lg text-blue-500" /></div>;
  if (role !== "AGENT" || !agent) return <Navigate to="/login" replace />;
  return <Outlet />;
}
