import type { ReactNode } from "react";
import { useState } from "react";
import { ArrowRight, Building2, Check, ChevronRight, FileCheck2, FileSpreadsheet, Layers, LockKeyhole, MapPinned, ScanLine, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import AdminLogin from "./AdminLogin";
import AgentAccess from "./AgentAccess";
import ChefFokontanyLogin from "../pages/public/ChefFokontanyLogin";
import { MadagascarEmblem } from "./public/MadagascarEmblem";

type LoginMode = "choice" | "admin" | "agent" | "chef-fokontany";
type PortalAccent = "green" | "blue" | "slate";

export default function Login() {
  const [mode, setMode] = useState<LoginMode>("choice");
  if (mode === "admin") return <AdminLogin onBack={() => setMode("choice")} />;
  if (mode === "agent") return <AgentAccess onBack={() => setMode("choice")} />;
  if (mode === "chef-fokontany") return <ChefFokontanyLogin onBack={() => setMode("choice")} />;

  return (
    <div className="min-h-screen bg-[#f3f6f3] text-[#1e2a23]">
      <header className="border-b border-[#e2e9e3] bg-white/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2457c5] text-white"><ScanLine size={20}/></span>
            <div><p className="text-sm font-bold tracking-wide">RECENSEMENT NATIONAL</p><p className="text-[11px] text-[#66736a]">Plateforme administrative • Madagascar</p></div>
          </div>
          <div className="hidden sm:block"><MadagascarEmblem compact/></div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:px-10 lg:py-20">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d7e7da] bg-white px-3.5 py-2 text-xs font-semibold text-[#2457c5]"><MapPinned size={15}/> Service de recensement et de vérification CIN</div>
            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.12] tracking-tight sm:text-5xl lg:text-[3.55rem]">Un registre plus clair, <span className="text-[#2457c5]">des démarches mieux suivies.</span></h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#5f6d64]">Une plateforme commune pour les agents de terrain, les Chefs Fokontany et l’administration centrale. Les demandes et les recensements suivent un parcours lisible, de l’inscription à la vérification.</p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Feature icon={<FileCheck2 size={15}/>} label="Suivi des dossiers"/>
              <Feature icon={<ScanLine size={15}/>} label="Lecture OCR de CIN"/>
              <Feature icon={<ShieldCheck size={15}/>} label="Accès par rôle"/>
            </div>
          </div>

          <div className="rounded-3xl border border-[#e1e8e2] bg-white p-6 shadow-[0_24px_70px_-46px_rgba(26,62,40,.3)] sm:p-8">
            <div className="flex items-start justify-between gap-4 border-b border-[#edf1ed] pb-5">
              <div><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#2457c5]">Parcours coordonné</p><h2 className="mt-1 text-xl font-semibold">Du rattachement au recensement</h2></div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eff4ff] text-[#2457c5]"><Layers size={19}/></span>
            </div>
            <div className="mt-5 space-y-3">
              <ProcessRow number="01" title="Demande Chef Fokontany" detail="Le dossier est soumis pour examen."/>
              <ProcessRow number="02" title="Validation administrative" detail="Le compte Chef est activé et le territoire rattaché."/>
              <ProcessRow number="03" title="Inscription de l’Agent" detail="Chaque agent crée son compte lors de sa première utilisation."/>
              <ProcessRow number="04" title="Collecte et vérification" detail="Les fiches sont enregistrées puis suivies dans le registre." last/>
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#f5f8f5] p-3.5"><FileSpreadsheet size={18} className="shrink-0 text-[#2457c5]"/><p className="text-xs leading-5 text-[#5f6d64]">Un espace adapté à chaque rôle, avec des accès et des responsabilités distincts.</p></div>
          </div>
        </section>

        <section id="espaces" className="border-y border-[#e2e9e3] bg-white py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mb-9 max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[.15em] text-[#2457c5]">Portails dédiés</p><h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Choisissez votre espace</h2><p className="mt-2 text-sm leading-6 text-[#66736a]">Connectez-vous selon votre fonction au sein du dispositif de recensement.</p></div>
            <div className="grid gap-4 md:grid-cols-3">
              <AccessCard icon={<UserRound size={21}/>} title="Agent recenseur" label="Collecte terrain" description="Inscription initiale, saisie des fiches CIN et suivi de votre activité." detail="Code Fokontany et matricule" accent="blue" onClick={()=>setMode("agent")}/>
              <AccessCard icon={<Building2 size={21}/>} title="Chef Fokontany" label="Autorité locale" description="Suivi du registre, gestion des accès Agents et validation des dossiers." detail="Courriel ou code Fokontany" accent="green" onClick={()=>setMode("chef-fokontany")}><Link to="/leader/subscription" className="text-sm font-semibold text-[#2457c5] hover:underline">Déposer une demande Chef <ArrowRight size={14} className="inline"/></Link></AccessCard>
              <AccessCard icon={<ShieldCheck size={21}/>} title="Administration" label="Pilotage central" description="Examen des demandes, supervision des territoires et contrôle qualité." detail="Compte administrateur" accent="slate" onClick={()=>setMode("admin")}/>
            </div>
          </div>
        </section>

        <section className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-9 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf0ff] text-[#2457c5]"><LockKeyhole size={18}/></span><div><h3 className="text-sm font-semibold">Accès sécurisé par fonction</h3><p className="mt-1 max-w-xl text-xs leading-5 text-[#66736a]">Les comptes et les actions sont rattachés au rôle de chaque utilisateur et à son territoire.</p></div></div>
          <a href="#espaces" className="inline-flex items-center gap-2 text-sm font-semibold text-[#2457c5] hover:underline">Voir les espaces <ChevronRight size={16}/></a>
        </section>
      </main>
      <footer className="border-t border-[#e2e9e3] bg-white px-5 py-6 text-xs text-[#66736a] sm:px-8 lg:px-10"><div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><span>Repoblikan’i Madagasikara • Ministère de l’Intérieur</span><span>Fitiavana — Tanindrazana — Fandrosoana</span></div></footer>
    </div>
  );
}

function Feature({ icon, label }: { icon: ReactNode; label: string }) { return <span className="inline-flex items-center gap-2 rounded-lg border border-[#e1e8e2] bg-white px-3 py-2 text-xs font-medium text-[#58665d]">{<span className="text-[#2457c5]">{icon}</span>}{label}</span>; }
function ProcessRow({ number, title, detail, last=false }: { number: string; title: string; detail: string; last?: boolean }) { return <div className="flex gap-3"><div className="flex flex-col items-center"><span className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${last?"bg-[#2457c5] text-white":"bg-[#edf3ee] text-[#2457c5]"}`}>{last?<Check size={14}/>:number}</span>{!last&&<span className="mt-1 h-5 w-px bg-[#dfe7e1]"/>}</div><div className="pb-1"><p className="text-sm font-semibold">{title}</p><p className="mt-0.5 text-xs leading-5 text-[#66736a]">{detail}</p></div></div>; }
function AccessCard({ icon, title, label, description, detail, accent, onClick, children }: { icon: ReactNode; title: string; label: string; description: string; detail: string; accent: PortalAccent; onClick: () => void; children?: ReactNode }) {
 const iconClass = accent === "blue" ? "bg-[#edf3f7] text-[#416278]" : accent === "green" ? "bg-[#eff4ff] text-[#2457c5]" : "bg-[#eef0f2] text-[#46515b]";
 return <article className="flex flex-col rounded-2xl border border-[#e1e8e2] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#c8d7fa] hover:shadow-lg hover:shadow-[#233d2c]/5"><div className="flex items-start justify-between"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}>{icon}</span><span className="rounded-full bg-[#f3f6f3] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#68766d]">{label}</span></div><h3 className="mt-5 text-lg font-semibold">{title}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-[#66736a]">{description}</p><p className="mt-4 border-t border-[#edf1ed] pt-3 text-xs text-[#66736a]">{detail}</p><button type="button" onClick={onClick} className="mt-4 flex w-full items-center justify-between rounded-xl bg-[#2457c5] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d46a2]">Ouvrir l’espace <ArrowRight size={16}/></button>{children&&<div className="mt-3 border-t border-[#edf1ed] pt-3">{children}</div>}</article>;
}
