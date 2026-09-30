import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { Agent } from "../types/agent";
import type { AdminUser, ChefFokontanyUser } from "../types/auth";

import {
  adminLoginRequest,
  agentLoginRequest,
  chefFokontanyLoginRequest,
  getCurrentAdmin,
  getCurrentAgent,
  getCurrentChefFokontany,
  logoutRequest,
} from "../services/authService";

interface AuthContextType {
  admin: AdminUser | null;
  agent: Agent | null;
  chef: ChefFokontanyUser | null;

  role: "ADMIN" | "AGENT" | "CHEF_FOKONTANY" | null;

  isAuthenticated: boolean;
  loading: boolean;

  adminLogin: (email: string, password: string) => Promise<void>;
  agentLogin: (fokontanyId: string, matricule: string) => Promise<void>;
  chefLogin: (identifier: string, password: string) => Promise<void>;

  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [chef, setChef] = useState<ChefFokontanyUser | null>(null);

  const [role, setRole] = useState<"ADMIN" | "AGENT" | "CHEF_FOKONTANY" | null>(null);

  const [loading, setLoading] = useState(true);

  async function restoreSession() {
    setLoading(true);

    try {
      // 1. Session ADMIN
      try {
        const currentAdmin = await getCurrentAdmin();
        setAdmin(currentAdmin);
        setAgent(null);
        setChef(null);
        setRole("ADMIN");
        return;
      } catch {
        // Pas de session admin
      }

      // 2. Session CHEF FOKONTANY
      try {
        const currentChef = await getCurrentChefFokontany();
        setChef(currentChef);
        setAdmin(null);
        setAgent(null);
        setRole("CHEF_FOKONTANY");
        return;
      } catch {
        // Pas de session chef
      }

      // 3. Session AGENT
      try {
        const currentAgent = await getCurrentAgent();
        setAgent(currentAgent);
        setAdmin(null);
        setChef(null);
        setRole("AGENT");
        return;
      } catch {
        // Aucune session valide
        setAdmin(null);
        setAgent(null);
        setChef(null);
        setRole(null);
      }
    } catch (error) {
      console.error("Impossible de restaurer la session:", error);
      setAdmin(null);
      setAgent(null);
      setChef(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    restoreSession();
  }, []);

  async function adminLogin(email: string, password: string) {
    const result = await adminLoginRequest(email, password);
    setAdmin(result.user);
    setAgent(null);
    setChef(null);
    setRole("ADMIN");
  }

  async function agentLogin(fokontanyId: string, matricule: string) {
    const result = await agentLoginRequest(fokontanyId, matricule);
    setAgent(result.agent);
    setAdmin(null);
    setChef(null);
    setRole("AGENT");
  }

  async function chefLogin(identifier: string, password: string) {
    const result = await chefFokontanyLoginRequest(identifier, password);
    setChef(result.user);
    setAdmin(null);
    setAgent(null);
    setRole("CHEF_FOKONTANY");
  }

  async function logout() {
    try {
      await logoutRequest();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    } finally {
      setAdmin(null);
      setAgent(null);
      setChef(null);
      setRole(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        admin,
        agent,
        chef,
        role,
        isAuthenticated: role !== null,
        loading,
        adminLogin,
        agentLogin,
        chefLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur de AuthProvider");
  }

  return context;
}
