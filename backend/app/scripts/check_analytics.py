"""
Vérification des nouveaux services de statistiques et d'audit.

Le script s'exécute contre la base de développement et valide
que les indicateurs retournés correspondent bien aux données
réellement présentes.
"""

import json
import sys

from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.audit_log import AuditLog
from app.models.recensement import Recensement
from app.services.analytics_service import AnalyticsService


def main() -> int:
    engine = create_engine(settings.DATABASE_URL)
    Session = sessionmaker(bind=engine)

    db = Session()

    total_fiches = db.scalar(select(func.count(Recensement.id)))
    total_audit = db.scalar(select(func.count(AuditLog.id)))

    print("=" * 70)
    print(f"Fiches en base : {total_fiches}")
    print(f"Entrées d'audit en base : {total_audit}")
    print("=" * 70)

    for periode in ("WEEK", "MONTH", "GLOBAL"):
        stats = AnalyticsService.statistiques(db, periode=periode)

        print(f"\n--- Période {periode} "
              f"({stats.date_debut} -> {stats.date_fin}) ---")
        print("libellé :", stats.periode_libelle)

        for cle, kpi in stats.kpis.items():
            print(
                f"  {cle:<28} {kpi.valeur:>10} {kpi.unite or '':<12}"
                f" variation={kpi.variation}"
                f" ({kpi.comparaison or '-'})"
            )

        print(f"  séries quotidiennes   : {len(stats.activite_quotidienne)}")
        print(f"  régions couvertes    : {len(stats.couverture_regions)}")
        print(f"  statuts              : {len(stats.repartition_statuts)}")
        print(f"  tranches d'âge       : {len(stats.demographie.tranches_age)}")
        print(f"  top agents           : {len(stats.top_agents)}")
        print(f"  fokontany            : {len(stats.fokontany)}")

        if stats.activite_quotidienne:
            dernier = stats.activite_quotidienne[-1]
            print(f"  dernier jour         : {dernier.libelle} = {dernier.total}")

    print("\n--- Cohérence avec la base ---")

    stats_global = AnalyticsService.statistiques(db, "GLOBAL")

    kpi_fiches = stats_global.kpis["fiches_enregistrees"].valeur

    print(
        "  KPI fiches global =",
        kpi_fiches,
        "| base =",
        total_fiches,
        "->",
        "OK" if int(kpi_fiches) == total_fiches else "ECART",
    )

    somme_statuts = sum(
        item.effectif for item in stats_global.repartition_statuts
    )

    print(
        "  somme des statuts =",
        somme_statuts,
        "->",
        "OK" if somme_statuts == total_fiches else "ECART",
    )

    somme_demographie = (
        stats_global.demographie.hommes
        + stats_global.demographie.femmes
        + stats_global.demographie.autres
    )

    print(
        "  somme démographie =",
        somme_demographie,
        "/ total =",
        stats_global.demographie.total,
        "->",
        "OK"
        if somme_demographie == stats_global.demographie.total
        else "ECART",
    )

    print("\n--- Agrégats journal d'audit ---")

    for periode in ("WEEK", "MONTH", "GLOBAL"):
        audit = AnalyticsService.audit_stats(db, periode)

        print(
            f"  {periode:<7} total={audit.total_evenements:<5}"
            f" succes={audit.succes:<5} echecs={audit.echecs:<4}"
            f" taux_echec={audit.taux_echec}%"
            f" serie={len(audit.activite_journaliere)}"
        )

        for role in audit.par_role:
            print(
                f"           rôle {role.cle:<16}"
                f" {role.effectif:<5} ({role.pourcentage}%)"
            )

        if audit.top_acteurs:
            print("           acteurs les plus actifs :")
            for acteur in audit.top_acteurs[:5]:
                print(
                    f"             {acteur.libelle} "
                    f"[{acteur.role}] = {acteur.evenements}"
                )

    print("\n" + "=" * 70)
    print("OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())