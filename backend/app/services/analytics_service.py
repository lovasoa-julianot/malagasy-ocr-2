from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import Float, case, cast, func
from sqlalchemy.orm import Session

from app.models.agent import Agent
from app.models.audit_log import AuditLog
from app.models.fokontany import Fokontany
from app.models.personne import Personne
from app.models.recensement import Recensement, RecensementStatus
from app.models.utilisateur import Utilisateur
from app.schemas.admin import (
    AdminActiviteJour,
    AdminAuditActif,
    AdminAuditJour,
    AdminAuditRepartition,
    AdminAuditStatsResponse,
    AdminCouvertureRegion,
    AdminDemographie,
    AdminFokontanyCouverture,
    AdminKpi,
    AdminRepartitionStatut,
    AdminStatistiquesResponse,
    AdminTopAgent,
    AdminTrancheAge,
)
from app.services.admin_service import (
    ACTION_LABELS,
    RESOURCE_LABELS,
)


# ============================================================
# PÉRIODES D'ANALYSE
# ============================================================

PERIODE_WEEK = "WEEK"
PERIODE_MONTH = "MONTH"
PERIODE_GLOBAL = "GLOBAL"

PERIODES = (PERIODE_WEEK, PERIODE_MONTH, PERIODE_GLOBAL)

PERIODE_LIBELLES = {
    PERIODE_WEEK: "7 derniers jours",
    PERIODE_MONTH: "30 derniers jours",
    PERIODE_GLOBAL: "Depuis le début de la campagne",
}

PERIODE_COMPARAISONS = {
    PERIODE_WEEK: "vs 7 jours précédents",
    PERIODE_MONTH: "vs 30 jours précédents",
    PERIODE_GLOBAL: None,
}

PERIODE_JOURS = {
    PERIODE_WEEK: 7,
    PERIODE_MONTH: 30,
}

# Longueur de la série quotidienne lorsque l'analyse porte
# sur l'ensemble de la campagne : les 30 derniers jours.
PERIODE_GLOBAL_SERIE_JOURS = 30

STATUT_LIBELLES = {
    RecensementStatus.SCANNE.value: "Scanné",
    RecensementStatus.OCR_EN_COURS.value: "OCR en cours",
    RecensementStatus.A_VERIFIER.value: "En attente de vérification",
    RecensementStatus.MODIFIE.value: "Corrigé manuellement",
    RecensementStatus.VALIDE.value: "Validé",
    RecensementStatus.REJETE.value: "Rejeté",
}

ROLE_LIBELLES = {
    "ADMIN": "Administrateurs",
    "CHEF_FOKONTANY": "Chefs Fokontany",
    "AGENT": "Agents recenseurs",
    "SYSTEM": "Système",
}

ROLE_ACTIF_LIBELLES = {
    "ADMIN": "Administrateur",
    "CHEF_FOKONTANY": "Chef Fokontany",
    "AGENT": "Agent recenseur",
    "SYSTEM": "Système",
}

JOURS_COURTS = {
    0: "Lun",
    1: "Mar",
    2: "Mer",
    3: "Jeu",
    4: "Ven",
    5: "Sam",
    6: "Dim",
}

# Tranches d'âge retenues pour l'analyse démographique.
TRANCHES_AGE = (
    ("Moins de 18 ans", 0, 17),
    ("18 - 25 ans", 18, 25),
    ("26 - 40 ans", 26, 40),
    ("41 - 60 ans", 41, 60),
    ("Plus de 60 ans", 61, None),
)


def _day_bounds(reference: date, days: int) -> tuple[datetime, datetime]:
    """
    Bornes UTC d'une fenêtre de `days` jours consécutifs
    se terminant le jour de référence.
    """

    end = datetime.combine(
        reference + timedelta(days=1),
        time.min,
        tzinfo=timezone.utc,
    )

    return end - timedelta(days=days), end


def _previous_window(
    reference: date,
    days: int | None,
) -> tuple[datetime | None, datetime | None]:
    if days is None:
        return None, None

    end = datetime.combine(
        reference,
        time.min,
        tzinfo=timezone.utc,
    ) - timedelta(days=days)

    return end - timedelta(days=days), end


def _percentage(part: float, total: float) -> float:
    if not total:
        return 0.0

    return round((part / total) * 100, 1)


def _variation(current: float, previous: float | None) -> float | None:
    """
    Écart en pourcentage entre deux périodes.

    Renvoie None lorsque la période de référence est vide :
    une variation y serait trompeur.
    """

    if not previous:
        return None

    return round(((current - previous) / previous) * 100, 1)


def _libelle_jour(current: date) -> str:
    return (
        f"{JOURS_COURTS[current.weekday()]} "
        f"{current.strftime('%d/%m')}"
    )


def _daterange_reference(
    reference: date,
    jours: int,
) -> list[date]:
    return [
        reference - timedelta(days=offset)
        for offset in range(jours - 1, -1, -1)
    ]


def _date_moins_ans(reference: date, annees: int) -> date:
    """
    Date correspondant à `reference` diminuée de `annees`
    années, avec repli au 28 février pour les années bissextiles.
    """

    try:
        return reference.replace(
            year=reference.year - annees
        )
    except ValueError:
        return reference.replace(
            year=reference.year - annees,
            day=28,
        )


class AnalyticsService:
    """
    Agrégations réelles servies à la page « Statistiques & KPIs ».

    Toutes les valeurs proviennent de la base : aucune donnée
    n'est simulée. Les séries temporelles sont complétées par
    des zéros sur les jours sans activité afin que les
    graphiques restent alignés sur l'axe temporel.
    """

    # --------------------------------------------------------
    # Résolution de la fenêtre d'analyse
    # --------------------------------------------------------

    @staticmethod
    def resoudre_periode(
        periode: str | None,
    ) -> tuple[str, datetime | None, datetime | None, int | None]:
        if periode not in PERIODES:
            periode = PERIODE_MONTH

        jours = PERIODE_JOURS.get(periode)

        if jours is None:
            return periode, None, None, None

        start, end = _day_bounds(
            datetime.now(timezone.utc).date(),
            jours,
        )

        return periode, start, end, jours

    @staticmethod
    def _borne(
        column,
        start: datetime | None,
        end: datetime | None,
    ):
        if start is not None and end is not None:
            return column >= start, column < end

        if start is not None:
            return column >= start

        if end is not None:
            return column < end

        return None

    @staticmethod
    def _appliquer_fenetre(
        query,
        column,
        start: datetime | None,
        end: datetime | None,
    ):
        conditions = AnalyticsService._borne(column, start, end)

        if conditions is None:
            return query

        for condition in conditions:
            query = query.filter(condition)

        return query

    # --------------------------------------------------------
    # Compteurs de base
    # --------------------------------------------------------

    @staticmethod
    def compter_recensements(
        db: Session,
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> int:
        query = AnalyticsService._appliquer_fenetre(
            db.query(func.count(Recensement.id)),
            Recensement.created_at,
            start,
            end,
        )

        return query.scalar() or 0

    @staticmethod
    def compteurs_statuts(
        db: Session,
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> dict[str, int]:
        query = AnalyticsService._appliquer_fenetre(
            db.query(
                Recensement.statut,
                func.count(Recensement.id),
            ),
            Recensement.created_at,
            start,
            end,
        )

        return {
            statut.value: total
            for statut, total in query.group_by(
                Recensement.statut
            ).all()
        }

    @staticmethod
    def precision_ocr(
        db: Session,
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> tuple[float | None, int]:
        """
        Précision OCR moyenne (%) et nombre de fiches
        disposant d'une mesure.

        La valeur est nulle quand aucune fiche n'a encore été
        soumise avec une mesure : le KPI est alors affiché
        comme indisponible plutôt que comme 0 %.
        """

        query = AnalyticsService._appliquer_fenetre(
            db.query(
                func.avg(
                    cast(Recensement.ocr_confidence, Float)
                ),
                func.count(Recensement.id),
            ).filter(Recensement.ocr_confidence.is_not(None)),
            Recensement.created_at,
            start,
            end,
        )

        moyenne, effectif = query.one()

        return (
            round(moyenne, 1) if moyenne is not None else None,
            effectif or 0,
        )

    # --------------------------------------------------------
    # Séries temporelles
    # --------------------------------------------------------

    @staticmethod
    def serie_quotidienne(
        db: Session,
        reference: date,
        jours: int,
    ) -> list[AdminActiviteJour]:
        start, end = _day_bounds(reference, jours)

        jour = func.date(Recensement.created_at).label("jour")

        rows = (
            db.query(
                jour,
                func.count(Recensement.id),
                func.count(
                    case(
                        (
                            Recensement.statut
                            == RecensementStatus.VALIDE,
                            1,
                        )
                    )
                ),
                func.count(
                    case(
                        (
                            Recensement.statut
                            == RecensementStatus.REJETE,
                            1,
                        )
                    )
                ),
            )
            .filter(Recensement.created_at >= start)
            .filter(Recensement.created_at < end)
            .group_by(jour)
            .all()
        )

        par_jour = {
            str(value): (total or 0, valides or 0, rejets or 0)
            for value, total, valides, rejets in rows
        }

        serie = []

        for current in _daterange_reference(reference, jours):
            total, valides, rejets = par_jour.get(
                current.isoformat(),
                (0, 0, 0),
            )

            serie.append(
                AdminActiviteJour(
                    date=current.isoformat(),
                    libelle=_libelle_jour(current),
                    total=total,
                    valides=valides,
                    rejets=rejets,
                )
            )

        return serie

    @staticmethod
    def serie_journaliere_audit(
        db: Session,
        reference: date,
        jours: int,
    ) -> list[AdminAuditJour]:
        start, end = _day_bounds(reference, jours)

        jour = func.date(AuditLog.created_at).label("jour")

        rows = (
            db.query(
                jour,
                func.count(AuditLog.id),
                func.count(
                    case((AuditLog.outcome == "SUCCESS", 1))
                ),
                func.count(
                    case((AuditLog.outcome == "FAILURE", 1))
                ),
            )
            .filter(AuditLog.created_at >= start)
            .filter(AuditLog.created_at < end)
            .group_by(jour)
            .all()
        )

        par_jour = {
            str(value): (total or 0, succes or 0, echecs or 0)
            for value, total, succes, echecs in rows
        }

        serie = []

        for current in _daterange_reference(reference, jours):
            total, succes, echecs = par_jour.get(
                current.isoformat(),
                (0, 0, 0),
            )

            serie.append(
                AdminAuditJour(
                    date=current.isoformat(),
                    libelle=_libelle_jour(current),
                    total=total,
                    succes=succes,
                    echecs=echecs,
                )
            )

        return serie

    # --------------------------------------------------------
    # KPIs
    # --------------------------------------------------------

    @staticmethod
    def kpis(
        db: Session,
        periode: str,
        start: datetime | None,
        end: datetime | None,
        jours: int | None,
    ) -> dict[str, AdminKpi]:

        reference = (
            end.date() - timedelta(days=1)
            if end is not None
            else datetime.now(timezone.utc).date()
        )

        previous_start, previous_end = _previous_window(
            reference,
            jours,
        )

        comparaison = PERIODE_COMPARAISONS.get(periode)

        total = AnalyticsService.compter_recensements(db, start, end)

        total_precedent = (
            AnalyticsService.compter_recensements(
                db,
                previous_start,
                previous_end,
            )
            if previous_start is not None
            else None
        )

        compteurs = AnalyticsService.compteurs_statuts(db, start, end)

        compteurs_precedents = (
            AnalyticsService.compteurs_statuts(
                db,
                previous_start,
                previous_end,
            )
            if previous_start is not None
            else {}
        )

        valides = compteurs.get(RecensementStatus.VALIDE.value, 0)
        rejets = compteurs.get(RecensementStatus.REJETE.value, 0)

        valides_precedents = compteurs_precedents.get(
            RecensementStatus.VALIDE.value,
            0,
        )
        rejets_precedents = compteurs_precedents.get(
            RecensementStatus.REJETE.value,
            0,
        )

        taux_validation = _percentage(valides, total)
        taux_rejet = _percentage(rejets, total)

        taux_validation_precedent = _percentage(
            valides_precedents,
            total_precedent or 0,
        )
        taux_rejet_precedent = _percentage(
            rejets_precedents,
            total_precedent or 0,
        )

        precision, releves = AnalyticsService.precision_ocr(
            db,
            start,
            end,
        )

        precision_precedente = None

        if previous_start is not None:
            precision_precedente, _ = AnalyticsService.precision_ocr(
                db,
                previous_start,
                previous_end,
            )

        longueur_serie = jours or PERIODE_GLOBAL_SERIE_JOURS

        rythme = round(total / longueur_serie, 1) if total else 0.0

        couverture = AnalyticsService.couverture_regions(db)

        taux_couverture = _percentage(
            sum(item.recensees for item in couverture),
            sum(item.objectif for item in couverture),
        )

        return {
            "fiches_enregistrees": AdminKpi(
                valeur=float(total),
                variation=_variation(
                    float(total),
                    total_precedent,
                ),
                unite="fiches",
                comparaison=comparaison,
                observations=total,
            ),
            "personnes_recensees": AdminKpi(
                valeur=float(
                    db.query(
                        func.count(Personne.id)
                    ).scalar()
                    or 0
                ),
                unite="personnes",
                comparaison=None,
                observations=(
                    db.query(
                        func.count(Personne.id)
                    ).scalar()
                    or 0
                ),
            ),
            "taux_validation": AdminKpi(
                valeur=taux_validation,
                variation=(
                    round(
                        taux_validation
                        - taux_validation_precedent,
                        1,
                    )
                    if total_precedent
                    else None
                ),
                unite="%",
                comparaison=comparaison,
                observations=total,
            ),
            "taux_rejet": AdminKpi(
                valeur=taux_rejet,
                variation=(
                    round(
                        taux_rejet - taux_rejet_precedent,
                        1,
                    )
                    if total_precedent
                    else None
                ),
                unite="%",
                comparaison=comparaison,
                observations=total,
            ),
            "precision_ocr": AdminKpi(
                valeur=precision if precision is not None else 0.0,
                variation=(
                    round(
                        precision - precision_precedente,
                        1,
                    )
                    if precision is not None
                    and precision_precedente is not None
                    else None
                ),
                unite="%",
                comparaison=comparaison,
                observations=releves,
            ),
            "rythme_quotidien": AdminKpi(
                valeur=rythme,
                unite="fiches/jour",
                comparaison=None,
                observations=total,
            ),
            "en_attente_verification": AdminKpi(
                valeur=float(
                    compteurs.get(
                        RecensementStatus.A_VERIFIER.value,
                        0,
                    )
                ),
                unite="fiches",
                comparaison=None,
                observations=total,
            ),
            "agents_actifs": AdminKpi(
                valeur=float(
                    db.query(func.count(Agent.id))
                    .filter(Agent.is_active.is_(True))
                    .scalar()
                    or 0
                ),
                unite="agents",
                comparaison=None,
                observations=(
                    db.query(func.count(Agent.id)).scalar() or 0
                ),
            ),
            "fokontany_actifs": AdminKpi(
                valeur=float(
                    db.query(func.count(Fokontany.id))
                    .filter(Fokontany.is_active.is_(True))
                    .scalar()
                    or 0
                ),
                unite="fokontany",
                comparaison=None,
                observations=(
                    db.query(func.count(Fokontany.id)).scalar() or 0
                ),
            ),
            "couverture_territoire": AdminKpi(
                valeur=taux_couverture,
                unite="%",
                comparaison=None,
                observations=sum(
                    item.objectif for item in couverture
                ),
            ),
        }

    # --------------------------------------------------------
    # Couverture territoriale
    # --------------------------------------------------------

    @staticmethod
    def couverture_regions(
        db: Session,
    ) -> list[AdminCouvertureRegion]:
        """
        Avancement par région : fiches enregistrées face à
        l'objectif de population cumulé des Fokontany actifs.

        La population réellement répertoriée est obtenue par
        une requête groupée unique, sans boucle par région.

        Les libellés de région ne sont pas homogènes en base
        ("Analamanga" et "ANALAMANGA" coexistent) : le
        regroupement s'effectue donc sur une clé normalisée,
        et la graphie la plus fréquente sert à l'affichage.
        """

        region_normalisee = func.upper(
            func.coalesce(Fokontany.region, "")
        )

        territoires = (
            db.query(
                region_normalisee,
                func.mode().within_group(Fokontany.region),
                func.count(func.distinct(Fokontany.id)),
                func.coalesce(
                    func.sum(Fokontany.objectif_habitants),
                    0,
                ),
                func.count(Recensement.id),
            )
            .select_from(Fokontany)
            .outerjoin(
                Recensement,
                Recensement.fokontany_id == Fokontany.id,
            )
            .where(Fokontany.is_active.is_(True))
            .group_by(region_normalisee)
            .all()
        )

        population = dict(
            db.query(
                region_normalisee,
                func.count(Personne.id),
            )
            .select_from(Personne)
            .join(
                Fokontany,
                Personne.fokontany_id == Fokontany.id,
            )
            .group_by(region_normalisee)
            .all()
        )

        items = []

        for (
            cle,
            libelle,
            fokontany_count,
            objectif,
            recensees,
        ) in territoires:
            objectif = objectif or 0
            recensees = recensees or 0

            items.append(
                AdminCouvertureRegion(
                    region=(
                        libelle
                        or cle
                        or "Non renseignée"
                    ),
                    fokontany=fokontany_count or 0,
                    recensees=recensees,
                    objectif=objectif,
                    taux=(
                        min(
                            round(
                                (recensees / objectif) * 100,
                                1,
                            ),
                            100.0,
                        )
                        if objectif
                        else 0.0
                    ),
                    population_totale=float(
                        population.get(cle, 0) or 0
                    ),
                )
            )

        items.sort(
            key=lambda item: (
                item.taux,
                item.recensees,
            ),
            reverse=True,
        )

        return items

    @staticmethod
    def fokontany_couverture(
        db: Session,
        limit: int = 12,
    ) -> list[AdminFokontanyCouverture]:
        rows = (
            db.query(
                Fokontany.id,
                Fokontany.nom,
                Fokontany.code,
                Fokontany.commune,
                Fokontany.region,
                func.coalesce(
                    Fokontany.objectif_habitants,
                    0,
                ),
                func.count(Recensement.id),
                func.count(
                    case(
                        (
                            Recensement.statut
                            == RecensementStatus.VALIDE,
                            1,
                        )
                    )
                ),
            )
            .select_from(Fokontany)
            .outerjoin(
                Recensement,
                Recensement.fokontany_id == Fokontany.id,
            )
            .where(Fokontany.is_active.is_(True))
            .group_by(Fokontany.id)
            .order_by(func.count(Recensement.id).desc())
            .limit(limit)
            .all()
        )

        items = []

        for (
            fokontany_id,
            nom,
            code,
            commune,
            region,
            objectif,
            fiches,
            valides,
        ) in rows:
            objectif = objectif or 0
            valides = valides or 0

            items.append(
                AdminFokontanyCouverture(
                    id=fokontany_id,
                    nom=nom,
                    code=code,
                    commune=commune,
                    region=region,
                    fiches=fiches or 0,
                    valides=valides,
                    objectif=objectif,
                    taux=(
                        min(
                            round(
                                (valides / objectif) * 100,
                                1,
                            ),
                            100.0,
                        )
                        if objectif
                        else 0.0
                    ),
                )
            )

        return items

    # --------------------------------------------------------
    # Démographie
    # --------------------------------------------------------

    @staticmethod
    def demographie(
        db: Session,
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> AdminDemographie:
        """
        Effectifs réels des personnes rattachées aux fiches
        de la période, ventilés par sexe et par tranche d'âge.
        """

        personne = func.count(func.distinct(Personne.id))

        def compter(*conditions) -> int:
            query = AnalyticsService._appliquer_fenetre(
                db.query(personne).join(
                    Recensement,
                    Recensement.personne_id == Personne.id,
                ),
                Recensement.created_at,
                start,
                end,
            )

            if conditions:
                query = query.filter(*conditions)

            return query.scalar() or 0

        total = AnalyticsService.demographie_total(
            db,
            start,
            end,
        )

        hommes = compter(
            func.upper(Personne.sexe).in_(["M", "H", "HOMME"])
        )
        femmes = compter(
            func.upper(Personne.sexe).in_(["F", "FEMME"])
        )

        age = Personne.date_naissance

        reference = (
            end.date() - timedelta(days=1)
            if end is not None
            else datetime.now(timezone.utc).date()
        )

        tranches = []

        for libelle, age_min, age_max in TRANCHES_AGE:
            # L'âge est déduit des dates de naissance plutôt
            # que calculé en SQL : les bornes restent exactes
            # et portables quel que soit le dialecte.
            conditions = [
                age <= _date_moins_ans(reference, age_min)
            ]

            if age_max is not None:
                conditions.append(
                    age
                    > _date_moins_ans(reference, age_max + 1)
                )

            effectif = compter(*conditions)

            tranches.append(
                AdminTrancheAge(
                    libelle=libelle,
                    age_min=age_min,
                    age_max=age_max,
                    effectif=effectif,
                    pourcentage=_percentage(effectif, total),
                )
            )

        return AdminDemographie(
            total=total,
            hommes=hommes,
            femmes=femmes,
            autres=max(total - hommes - femmes, 0),
            pourcentage_hommes=_percentage(hommes, total),
            pourcentage_femmes=_percentage(femmes, total),
            tranches_age=tranches,
        )

    @staticmethod
    def demographie_total(
        db: Session,
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> int:
        query = AnalyticsService._appliquer_fenetre(
            db.query(func.count(func.distinct(Personne.id))).join(
                Recensement,
                Recensement.personne_id == Personne.id,
            ),
            Recensement.created_at,
            start,
            end,
        )

        return query.scalar() or 0

    # --------------------------------------------------------
    # Répartition des statuts
    # --------------------------------------------------------

    @staticmethod
    def repartition_statuts(
        db: Session,
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> list[AdminRepartitionStatut]:
        compteurs = AnalyticsService.compteurs_statuts(
            db,
            start,
            end,
        )

        total = sum(compteurs.values())

        return [
            AdminRepartitionStatut(
                statut=statut,
                libelle=STATUT_LIBELLES.get(
                    statut,
                    statut.replace("_", " ").title(),
                ),
                effectif=compteurs[statut],
                pourcentage=_percentage(
                    compteurs[statut],
                    total,
                ),
            )
            for statut in sorted(
                compteurs,
                key=lambda item: compteurs[item],
                reverse=True,
            )
        ]

    # --------------------------------------------------------
    # Performance des agents
    # --------------------------------------------------------

    @staticmethod
    def top_agents(
        db: Session,
        start: datetime | None = None,
        end: datetime | None = None,
        limit: int = 10,
    ) -> list[AdminTopAgent]:
        query = (
            db.query(
                Agent.matricule,
                Agent.nom,
                Agent.prenoms,
                Fokontany.nom,
                Fokontany.region,
                func.count(Recensement.id),
                func.count(
                    case(
                        (
                            Recensement.statut
                            == RecensementStatus.VALIDE,
                            1,
                        )
                    )
                ),
            )
            .join(
                Recensement,
                Recensement.agent_id == Agent.id,
            )
            .join(
                Fokontany,
                Agent.fokontany_id == Fokontany.id,
            )
        )

        query = AnalyticsService._appliquer_fenetre(
            query,
            Recensement.created_at,
            start,
            end,
        )

        rows = (
            query.group_by(
                Agent.id,
                Fokontany.id,
            )
            .order_by(func.count(Recensement.id).desc())
            .limit(limit)
            .all()
        )

        return [
            AdminTopAgent(
                matricule=matricule,
                nom=nom,
                prenoms=prenoms,
                fokontany=fokontany_nom,
                region=region,
                fiches=fiches or 0,
                taux_validation=_percentage(
                    valides or 0,
                    fiches or 0,
                ),
            )
            for (
                matricule,
                nom,
                prenoms,
                fokontany_nom,
                region,
                fiches,
                valides,
            ) in rows
        ]

    # --------------------------------------------------------
    # Réponse complète
    # --------------------------------------------------------

    @staticmethod
    def statistiques(
        db: Session,
        periode: str | None = None,
    ) -> AdminStatistiquesResponse:
        periode, start, end, jours = (
            AnalyticsService.resoudre_periode(periode)
        )

        reference = (
            end.date() - timedelta(days=1)
            if end is not None
            else datetime.now(timezone.utc).date()
        )

        return AdminStatistiquesResponse(
            periode=periode,
            periode_libelle=PERIODE_LIBELLES[periode],
            date_debut=(
                start.date().isoformat()
                if start is not None
                else AnalyticsService.premiere_activite(db)
            ),
            date_fin=reference.isoformat(),
            genere_le=datetime.now(timezone.utc),
            kpis=AnalyticsService.kpis(
                db,
                periode,
                start,
                end,
                jours,
            ),
            couverture_regions=(
                AnalyticsService.couverture_regions(db)
            ),
            activite_quotidienne=AnalyticsService.serie_quotidienne(
                db,
                reference,
                jours or PERIODE_GLOBAL_SERIE_JOURS,
            ),
            demographie=AnalyticsService.demographie(
                db,
                start,
                end,
            ),
            repartition_statuts=AnalyticsService.repartition_statuts(
                db,
                start,
                end,
            ),
            top_agents=AnalyticsService.top_agents(
                db,
                start,
                end,
            ),
            fokontany=AnalyticsService.fokontany_couverture(db),
        )

    @staticmethod
    def premiere_activite(db: Session) -> str:
        """
        Date de la première fiche enregistrée : sert de borne
        basse à l'analyse « depuis le début de la campagne ».
        """

        premiere = (
            db.query(func.min(Recensement.created_at)).scalar()
        )

        if premiere is None:
            return "1970-01-01"

        return premiere.date().isoformat()

    # --------------------------------------------------------
    # Agrégats du journal d'audit
    # --------------------------------------------------------

    @staticmethod
    def audit_stats(
        db: Session,
        periode: str | None = None,
    ) -> AdminAuditStatsResponse:
        periode, start, end, jours = (
            AnalyticsService.resoudre_periode(periode)
        )

        reference = (
            end.date() - timedelta(days=1)
            if end is not None
            else datetime.now(timezone.utc).date()
        )

        base = AnalyticsService._appliquer_fenetre(
            db.query(
                func.count(AuditLog.id),
                func.count(
                    case((AuditLog.outcome == "SUCCESS", 1))
                ),
                func.count(
                    case((AuditLog.outcome == "FAILURE", 1))
                ),
                func.count(
                    case((AuditLog.outcome.is_(None), 1))
                ),
                func.avg(AuditLog.duration_ms),
            ),
            AuditLog.created_at,
            start,
            end,
        )

        (
            total,
            succes,
            echecs,
            sans_resultat,
            duree_moyenne,
        ) = base.one()

        total = total or 0
        succes = succes or 0
        echecs = echecs or 0
        sans_resultat = sans_resultat or 0

        par_action = dict(
            AnalyticsService._appliquer_fenetre(
                db.query(AuditLog.action, func.count(AuditLog.id)),
                AuditLog.created_at,
                start,
                end,
            )
            .group_by(AuditLog.action)
            .all()
        )

        par_ressource = dict(
            AnalyticsService._appliquer_fenetre(
                db.query(
                    AuditLog.resource_type,
                    func.count(AuditLog.id),
                ),
                AuditLog.created_at,
                start,
                end,
            )
            .group_by(AuditLog.resource_type)
            .all()
        )

        par_role, acteurs = AnalyticsService._audit_acteurs(
            db,
            start,
            end,
        )

        return AdminAuditStatsResponse(
            periode=periode,
            periode_libelle=PERIODE_LIBELLES[periode],
            date_debut=(
                start.date().isoformat()
                if start is not None
                else AnalyticsService.premiere_trace(db)
            ),
            date_fin=reference.isoformat(),
            total_evenements=total,
            succes=succes,
            echecs=echecs,
            sans_resultat=sans_resultat,
            taux_echec=_percentage(echecs, total),
            activite_journaliere=AnalyticsService.serie_journaliere_audit(
                db,
                reference,
                jours or PERIODE_GLOBAL_SERIE_JOURS,
            ),
            par_action=[
                AdminAuditRepartition(
                    cle=cle,
                    libelle=ACTION_LABELS.get(cle, cle),
                    effectif=effectif,
                    pourcentage=_percentage(effectif, total),
                )
                for cle, effectif in sorted(
                    par_action.items(),
                    key=lambda item: item[1],
                    reverse=True,
                )
            ],
            par_resource_type=[
                AdminAuditRepartition(
                    cle=cle or "SYSTEM",
                    libelle=RESOURCE_LABELS.get(
                        cle or "SYSTEM",
                        cle or "Système",
                    ),
                    effectif=effectif,
                    pourcentage=_percentage(effectif, total),
                )
                for cle, effectif in sorted(
                    par_ressource.items(),
                    key=lambda item: item[1],
                    reverse=True,
                )
            ],
            par_role=[
                AdminAuditRepartition(
                    cle=cle,
                    libelle=ROLE_LIBELLES.get(cle, cle),
                    effectif=effectif,
                    pourcentage=_percentage(effectif, total),
                )
                for cle, effectif in sorted(
                    par_role.items(),
                    key=lambda item: item[1],
                    reverse=True,
                )
            ],
            top_acteurs=acteurs,
            duree_moyenne_ms=(
                round(duree_moyenne)
                if duree_moyenne is not None
                else None
            ),
        )

    @staticmethod
    def premiere_trace(db: Session) -> str:
        premiere = (
            db.query(func.min(AuditLog.created_at)).scalar()
        )

        if premiere is None:
            return "1970-01-01"

        return premiere.date().isoformat()

    @staticmethod
    def _audit_acteurs(
        db: Session,
        start: datetime | None,
        end: datetime | None,
    ) -> tuple[dict[str, int], list[AdminAuditActif]]:
        """
        Répartition par profil et acteurs les plus actifs.

        L'identité est résolue par deux requêtes groupées,
        jamais par une requête par ligne du journal.
        """

        fenetre = AnalyticsService._borne(
            AuditLog.created_at,
            start,
            end,
        )

        # Administrateurs et Chefs Fokontany
        if fenetre is None:
            base_admin = db.query(
                Utilisateur.role,
                func.concat(
                    Utilisateur.nom,
                    " ",
                    Utilisateur.prenoms,
                ),
                func.count(AuditLog.id),
                func.max(AuditLog.created_at),
            ).join(
                AuditLog,
                AuditLog.utilisateur_id == Utilisateur.id,
            )
        else:
            base_admin = db.query(
                Utilisateur.role,
                func.concat(
                    Utilisateur.nom,
                    " ",
                    Utilisateur.prenoms,
                ),
                func.count(AuditLog.id),
                func.max(AuditLog.created_at),
            ).join(
                AuditLog,
                AuditLog.utilisateur_id == Utilisateur.id,
            ).filter(*fenetre)

        administrateurs = base_admin.group_by(
            Utilisateur.id,
        ).all()

        # Agents de terrain
        if fenetre is None:
            base_agent = db.query(
                func.concat(Agent.nom, " ", Agent.prenoms),
                func.count(AuditLog.id),
                func.max(AuditLog.created_at),
            ).join(
                AuditLog,
                AuditLog.agent_id == Agent.id,
            )
        else:
            base_agent = db.query(
                func.concat(Agent.nom, " ", Agent.prenoms),
                func.count(AuditLog.id),
                func.max(AuditLog.created_at),
            ).join(
                AuditLog,
                AuditLog.agent_id == Agent.id,
            ).filter(*fenetre)

        agents = base_agent.group_by(Agent.id).all()

        par_role: dict[str, int] = {}
        acteurs: list[AdminAuditActif] = []

        for role, libelle, effectif, derniere in administrateurs:
            cle = role or "ADMIN"

            par_role[cle] = par_role.get(cle, 0) + (effectif or 0)

            acteurs.append(
                AdminAuditActif(
                    libelle=libelle,
                    role=cle,
                    evenements=effectif or 0,
                    derniere_activite=derniere,
                )
            )

        for libelle, effectif, derniere in agents:
            par_role["AGENT"] = par_role.get("AGENT", 0) + (
                effectif or 0
            )

            acteurs.append(
                AdminAuditActif(
                    libelle=libelle,
                    role="AGENT",
                    evenements=effectif or 0,
                    derniere_activite=derniere,
                )
            )

        # Événements sans acteur identifié
        orphelins = db.query(func.count(AuditLog.id)).filter(
            AuditLog.agent_id.is_(None),
            AuditLog.utilisateur_id.is_(None),
        )

        if fenetre is not None:
            orphelins = orphelins.filter(*fenetre)

        total_orphelins = orphelins.scalar() or 0

        if total_orphelins:
            par_role["SYSTEM"] = total_orphelins

        acteurs.sort(
            key=lambda item: item.evenements,
            reverse=True,
        )

        return par_role, acteurs[:10]