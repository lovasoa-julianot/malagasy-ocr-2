import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Verification from "./pages/Verification";

import Dashboard from "./pages/Dashboard";
import NouveauRecensement from "./pages/NouveauRecensement";
import Historique from "./pages/Historique";

import AdminDashboard from "./pages/admin/AdminDashboard";
import TerritoryManagement from "./pages/admin/TerritoryManagement";
import AgentsManagement from "./pages/admin/AgentsManagement";
import AdminRecensements from "./pages/admin/AdminRecensements";
import AdminChefRequests from "./pages/admin/AdminChefRequests";
import AdminStatistiques from "./pages/admin/AdminStatistiques";
import AdminQualityControl from "./pages/admin/AdminQualityControl";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminSettings from "./pages/admin/AdminSettings";

import AgentLayout from "./components/AgentLayout/AgentLayout";
import AdminLayout from "./components/AdminLayout/AdminLayout";
import ChefLayout from "./components/ChefLayout/ChefLayout";

import ChefFokontanyDashboard from "./pages/chef/ChefFokontanyDashboard";
import ChefCitizensRegistry from "./pages/chef/ChefCitizensRegistry";
import ChefRecensements from "./pages/chef/ChefRecensements";
import ChefAgents from "./pages/chef/ChefAgents";
import ChefAccessCode from "./pages/chef/ChefAccessCode";
import ChefProfile from "./pages/chef/ChefProfile";

import ProtectedRoute from "./routes/ProtectedRoutes";
import AgentRoute from "./routes/AgentRoute";
import AdminRoute from "./routes/AdminRoute";
import ChefRoute from "./routes/ChefRoute";
import PublicRoute from "./routes/PublicRoutes";

import ChefFokontanyRegister from "./pages/public/ChefFokontanyRegister";
import ChefFokontanyLogin from "./pages/public/ChefFokontanyLogin";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes publiques */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/leader/subscription" element={<ChefFokontanyRegister />} />
          <Route path="/leader/login" element={<ChefFokontanyLogin />} />
        </Route>

        <Route path="/verification/:token" element={<Verification />} />

        {/* Routes protégées */}
        <Route element={<ProtectedRoute />}>
          {/* 1. ESPACE AGENT (Inchangé) */}
          <Route element={<AgentRoute />}>
            <Route path="/agent" element={<AgentLayout />}>
              <Route index element={<Navigate to="/agent/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="nouveau" element={<NouveauRecensement />} />
              <Route path="historique" element={<Historique />} />
            </Route>
          </Route>

          {/* 2. ESPACE ADMIN (Complet) */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="territoires" element={<TerritoryManagement />} />
              <Route path="demandes-chef" element={<AdminChefRequests />} />
              <Route path="agents" element={<AgentsManagement />} />
              <Route path="recensements" element={<AdminRecensements />} />
              <Route path="statistiques" element={<AdminStatistiques />} />
              <Route path="controle" element={<AdminQualityControl />} />
              <Route path="audit" element={<AdminAuditLogs />} />
              <Route path="profil" element={<AdminProfile />} />
              <Route path="parametres" element={<AdminSettings />} />
            </Route>
          </Route>

          {/* 3. ESPACE CHEF FOKONTANY (Complet) */}
          <Route element={<ChefRoute />}>
            <Route path="/chef-fokontany" element={<ChefLayout />}>
              <Route index element={<Navigate to="/chef-fokontany/dashboard" replace />} />
              <Route path="dashboard" element={<ChefFokontanyDashboard />} />
              <Route path="citoyens" element={<ChefCitizensRegistry />} />
              <Route path="recensements" element={<ChefRecensements />} />
              <Route path="agents" element={<ChefAgents />} />
              <Route path="code-acces" element={<ChefAccessCode />} />
              <Route path="profil" element={<ChefProfile />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
