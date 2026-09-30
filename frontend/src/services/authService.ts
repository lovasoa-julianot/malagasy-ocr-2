import type { Agent } from "../types/agent";
import type { AdminUser } from "../types/auth";

const API_URL = import.meta.env.VITE_API_URL || "";

/* =========================================================
   ADMIN LOGIN
   POST /api/auth/login

   Le backend place le JWT dans un cookie HttpOnly.
   Le frontend ne stocke donc pas access_token.
========================================================= */

export interface AdminLoginResponse {
  access_token: string;
  token_type: string;
  user: AdminUser;
}

export async function adminLoginRequest(
  email: string,
  password: string,
): Promise<AdminLoginResponse> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Identifiants administrateur incorrects");
  }

  return data;
}

/* =========================================================
   AGENT ACCESS
   POST /api/agent/access

   Aucun cookie d'authentification n'est nécessaire ici.
========================================================= */

export interface AgentAccessResponse {
  access_granted: boolean;
  registration_allowed: boolean;
  fokontany_id: string;
  fokontany_nom: string;
  registration_token?: string;
  message: string;
}

export async function agentAccessRequest(
  code: string,
  code_acces: string,
): Promise<AgentAccessResponse> {
  const response = await fetch(`${API_URL}/api/agent/access`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      code,
      code_acces,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Impossible de valider l'accès au Fokontany",
    );
  }

  return data;
}

/* =========================================================
   AGENT REGISTRATION
   POST /api/agent/register

   Le registration_token reste uniquement en mémoire
   dans le composant React.
========================================================= */

export interface AgentRegistrationData {
  nom: string;
  prenoms: string;
  telephone: string;
  email: string;
  adresse: string;
}

export async function registerAgentRequest(
  registrationToken: string,
  data: AgentRegistrationData,
): Promise<Agent> {
  const response = await fetch(`${API_URL}/api/agent/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${registrationToken}`,
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.detail || "Impossible d'enregistrer l'agent");
  }

  return result;
}

/* =========================================================
   AGENT LOGIN
   POST /api/agent/login

   Le backend place le JWT dans le cookie HttpOnly.
========================================================= */

export interface AgentLoginResponse {
  access_token: string;
  token_type: string;
  agent: Agent;
  message: string;
}

export async function agentLoginRequest(
  fokontany_id: string,
  matricule: string,
): Promise<AgentLoginResponse> {
  const response = await fetch(`${API_URL}/api/agent/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      fokontany_id,
      matricule,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Matricule incorrect");
  }

  return data;
}

/* =========================================================
   CURRENT ADMIN
   GET /api/auth/me
========================================================= */

export async function getCurrentAdmin(): Promise<AdminUser> {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    method: "GET",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Session administrateur invalide");
  }

  return data;
}

/* =========================================================
   CURRENT AGENT
   GET /api/agent/me
========================================================= */

export async function getCurrentAgent(): Promise<Agent> {
  const response = await fetch(`${API_URL}/api/agent/me`, {
    method: "GET",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Session agent invalide");
  }

  return data;
}

/* =========================================================
   CHEF FOKONTANY LOGIN
   POST /api/chef-fokontany/login
========================================================= */

export interface ChefFokontanyLoginResponse {
  access_token: string;
  token_type: string;
  user: import("../types/auth").ChefFokontanyUser;
}

export async function chefFokontanyLoginRequest(
  identifier: string,
  password: string,
): Promise<ChefFokontanyLoginResponse> {
  const response = await fetch(`${API_URL}/api/chef-fokontany/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      identifier,
      password,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.detail || "Identifiant ou mot de passe incorrect",
    );
  }

  return data;
}

/* =========================================================
   CURRENT CHEF FOKONTANY
   GET /api/chef-fokontany/me
========================================================= */

export async function getCurrentChefFokontany(): Promise<
  import("../types/auth").ChefFokontanyUser
> {
  const response = await fetch(`${API_URL}/api/chef-fokontany/me`, {
    method: "GET",
    credentials: "include",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.detail || "Session Chef Fokontany invalide",
    );
  }

  return data;
}

/* =========================================================
   LOGOUT
   POST /api/auth/logout

   Le cookie de session est commun aux trois rôles
   (admin, agent, chef fokontany).
========================================================= */

export async function logoutRequest(): Promise<void> {
  await fetch(`${API_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}
