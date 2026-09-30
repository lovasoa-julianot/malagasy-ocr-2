
from dataclasses import dataclass


@dataclass(frozen=True)
class DistrictData:
    code: int
    province: str
    region: str
    district: str


PROVINCES = (
    "ANTANANARIVO",
    "ANTSIRANANA",
    "TOAMASINA",
    "MAHAJANGA",
    "FIANARANTSOA",
    "TOLIARA",
)


DISTRICTS: tuple[DistrictData, ...] = (
    # ============================================================
    # ANTANANARIVO
    # ============================================================

    DistrictData(1, "ANTANANARIVO", "ANALAMANGA", "AMBOHIDRATRIMO"),
    DistrictData(2, "ANTANANARIVO", "ANALAMANGA", "ANDRAMASINA"),
    DistrictData(3, "ANTANANARIVO", "ANALAMANGA", "ANJOZOROBE"),
    DistrictData(4, "ANTANANARIVO", "ANALAMANGA", "ANKAZOBE"),
    DistrictData(
        5,
        "ANTANANARIVO",
        "ANALAMANGA",
        "ANTANANARIVO ATSIMONDRANO",
    ),
    DistrictData(
        6,
        "ANTANANARIVO",
        "ANALAMANGA",
        "ANTANANARIVO AVARADRANO",
    ),
    DistrictData(
        7,
        "ANTANANARIVO",
        "ANALAMANGA",
        "ANTANANARIVO RENIVOHITRA",
    ),
    DistrictData(13, "ANTANANARIVO", "ANALAMANGA", "MANJAKANDRIANA"),

    DistrictData(14, "ANTANANARIVO", "BONGOLAVA", "FENOARIVOBE"),
    DistrictData(15, "ANTANANARIVO", "BONGOLAVA", "TSIROANOMANDIDY"),

    DistrictData(16, "ANTANANARIVO", "ITASY", "ARIVONIMAMO"),
    DistrictData(17, "ANTANANARIVO", "ITASY", "MIARINARIVO"),
    DistrictData(18, "ANTANANARIVO", "ITASY", "SOAVINANDRIANA"),

    DistrictData(19, "ANTANANARIVO", "VAKINANKARATRA", "AMBATOLAMPY"),
    DistrictData(20, "ANTANANARIVO", "VAKINANKARATRA", "ANTANIFOTSY"),
    DistrictData(21, "ANTANANARIVO", "VAKINANKARATRA", "ANTSIRABE I"),
    DistrictData(22, "ANTANANARIVO", "VAKINANKARATRA", "ANTSIRABE II"),
    DistrictData(23, "ANTANANARIVO", "VAKINANKARATRA", "BETAFO"),
    DistrictData(24, "ANTANANARIVO", "VAKINANKARATRA", "FARATSIHO"),
    DistrictData(25, "ANTANANARIVO", "VAKINANKARATRA", "MANDOTO"),

    # ============================================================
    # ANTSIRANANA
    # ============================================================

    DistrictData(26, "ANTSIRANANA", "DIANA", "AMBANJA"),
    DistrictData(27, "ANTSIRANANA", "DIANA", "AMBILOBE"),
    DistrictData(28, "ANTSIRANANA", "DIANA", "ANTSIRANANA I"),
    DistrictData(29, "ANTSIRANANA", "DIANA", "ANTSIRANANA II"),
    DistrictData(30, "ANTSIRANANA", "DIANA", "NOSY-BE"),

    DistrictData(31, "ANTSIRANANA", "SAVA", "ANDAPA"),
    DistrictData(32, "ANTSIRANANA", "SAVA", "ANTALAHA"),
    DistrictData(33, "ANTSIRANANA", "SAVA", "SAMBAVA"),
    DistrictData(34, "ANTSIRANANA", "SAVA", "VOHEMAR"),

    # ============================================================
    # FIANARANTSOA
    # ============================================================

    DistrictData(
        35,
        "FIANARANTSOA",
        "AMORON'I MANIA",
        "AMBATOFINANDRAHANA",
    ),
    DistrictData(36, "FIANARANTSOA", "AMORON'I MANIA", "AMBOSITRA"),
    DistrictData(37, "FIANARANTSOA", "AMORON'I MANIA", "FANDRIANA"),
    DistrictData(38, "FIANARANTSOA", "AMORON'I MANIA", "MANANDRIANA"),

    DistrictData(
        39,
        "FIANARANTSOA",
        "ATSIMO-ATSINANANA",
        "BEFOTAKA ATSIMO",
    ),
    DistrictData(
        40,
        "FIANARANTSOA",
        "ATSIMO-ATSINANANA",
        "FARAFANGANA",
    ),
    DistrictData(
        41,
        "FIANARANTSOA",
        "ATSIMO-ATSINANANA",
        "MIDONGY SUD",
    ),
    DistrictData(
        42,
        "FIANARANTSOA",
        "ATSIMO-ATSINANANA",
        "VANGAINDRANO",
    ),
    DistrictData(
        43,
        "FIANARANTSOA",
        "ATSIMO-ATSINANANA",
        "VONDROZO",
    ),

    DistrictData(
        44,
        "FIANARANTSOA",
        "HAUTE MATSIATRA",
        "AMBALAVAO",
    ),
    DistrictData(
        45,
        "FIANARANTSOA",
        "HAUTE MATSIATRA",
        "AMBOHIMAHASOA",
    ),
    DistrictData(
        46,
        "FIANARANTSOA",
        "HAUTE MATSIATRA",
        "FIANARANTSOA",
    ),
    DistrictData(47, "FIANARANTSOA", "HAUTE MATSIATRA", "ISANDRA"),
    DistrictData(
        48,
        "FIANARANTSOA",
        "HAUTE MATSIATRA",
        "IKALAMAVONY",
    ),
    DistrictData(
        49,
        "FIANARANTSOA",
        "HAUTE MATSIATRA",
        "VOHIBATO",
    ),
    DistrictData(
        50,
        "FIANARANTSOA",
        "HAUTE MATSIATRA",
        "LALANGINA",
    ),

    DistrictData(51, "FIANARANTSOA", "IHOROMBE", "IAKORA"),
    DistrictData(52, "FIANARANTSOA", "IHOROMBE", "IHOSY"),
    DistrictData(53, "FIANARANTSOA", "IHOROMBE", "IVOHIBE"),

    DistrictData(54, "FIANARANTSOA", "VATOVAVY", "IFANADIANA"),
    DistrictData(55, "FIANARANTSOA", "FITOVINANY", "IKONGO"),
    DistrictData(56, "FIANARANTSOA", "FITOVINANY", "MANAKARA"),
    DistrictData(57, "FIANARANTSOA", "VATOVAVY", "MANANJARY"),
    DistrictData(58, "FIANARANTSOA", "VATOVAVY", "NOSY VARIKA"),
    DistrictData(59, "FIANARANTSOA", "FITOVINANY", "VOHIPENO"),

    # ============================================================
    # MAHAJANGA
    # ============================================================

    DistrictData(60, "MAHAJANGA", "BETSIBOKA", "KANDREHO"),
    DistrictData(61, "MAHAJANGA", "BETSIBOKA", "MAEVATANANA"),
    DistrictData(62, "MAHAJANGA", "BETSIBOKA", "TSARATANANA"),

    DistrictData(63, "MAHAJANGA", "BOENY", "AMBATO BOENI"),
    DistrictData(64, "MAHAJANGA", "BOENY", "MAHAJANGA I"),
    DistrictData(65, "MAHAJANGA", "BOENY", "MAHAJANGA II"),
    DistrictData(66, "MAHAJANGA", "BOENY", "MAROVOAY"),
    DistrictData(67, "MAHAJANGA", "BOENY", "MITSINJO"),
    DistrictData(68, "MAHAJANGA", "BOENY", "SOALALA"),

    DistrictData(69, "MAHAJANGA", "MELAKY", "AMBATOMAINTY"),
    DistrictData(70, "MAHAJANGA", "MELAKY", "ANTSALOVA"),
    DistrictData(71, "MAHAJANGA", "MELAKY", "BESALAMPY"),
    DistrictData(72, "MAHAJANGA", "MELAKY", "MAINTIRANO"),
    DistrictData(73, "MAHAJANGA", "MELAKY", "MORAFENOBE"),

    DistrictData(74, "MAHAJANGA", "SOFIA", "ANALALAVA"),
    DistrictData(75, "MAHAJANGA", "SOFIA", "ANTSOHIHY"),
    DistrictData(76, "MAHAJANGA", "SOFIA", "BEALANANA"),
    DistrictData(77, "MAHAJANGA", "SOFIA", "BEFANDRIANA NORD"),
    DistrictData(78, "MAHAJANGA", "SOFIA", "MAMPIKONY"),
    DistrictData(79, "MAHAJANGA", "SOFIA", "MANDRITSARA"),
    DistrictData(80, "MAHAJANGA", "SOFIA", "PORT-BERGE"),

    # ============================================================
    # TOAMASINA
    # ============================================================

    DistrictData(81, "TOAMASINA", "ALAOTRA-MANGORO", "AMBATONDRAZAKA"),
    DistrictData(82, "TOAMASINA", "ALAOTRA-MANGORO", "AMPARAFARAVOLA"),
    DistrictData(83, "TOAMASINA", "ALAOTRA-MANGORO", "ANDILAMENA"),
    DistrictData(84, "TOAMASINA", "ALAOTRA-MANGORO", "ANOSIBE AN'ALA"),
    DistrictData(85, "TOAMASINA", "ALAOTRA-MANGORO", "MORAMANGA"),

    DistrictData(86, "TOAMASINA", "ANALANJIROFO", "FENERIVE EST"),
    DistrictData(87, "TOAMASINA", "ANALANJIROFO", "MANANARA-NORD"),
    DistrictData(88, "TOAMASINA", "ANALANJIROFO", "MAROANTSETRA"),
    DistrictData(89, "TOAMASINA", "ANALANJIROFO", "SAINTE MARIE"),
    DistrictData(
        90,
        "TOAMASINA",
        "ANALANJIROFO",
        "SOANIERANA IVONGO",
    ),
    DistrictData(91, "TOAMASINA", "ANALANJIROFO", "VAVATENINA"),

    DistrictData(
        92,
        "TOAMASINA",
        "ATSINANANA",
        "ANTANAMBAO MANAMPONTSY",
    ),
    DistrictData(93, "TOAMASINA", "ATSINANANA", "BRICKAVILLE"),
    DistrictData(94, "TOAMASINA", "ATSINANANA", "MAHANORO"),
    DistrictData(95, "TOAMASINA", "ATSINANANA", "MAROLAMBO"),
    DistrictData(96, "TOAMASINA", "ATSINANANA", "TOAMASINA I"),
    DistrictData(97, "TOAMASINA", "ATSINANANA", "TOAMASINA II"),
    DistrictData(98, "TOAMASINA", "ATSINANANA", "VATOMANDRY"),

    # ============================================================
    # TOLIARA
    # ============================================================

    DistrictData(99, "TOLIARA", "ANDROY", "AMBOVOMBE ANDROY"),
    DistrictData(100, "TOLIARA", "ANDROY", "BEKILY"),
    DistrictData(101, "TOLIARA", "ANDROY", "BELOHA ANDROY"),
    DistrictData(102, "TOLIARA", "ANDROY", "TSIHOMBE"),

    DistrictData(103, "TOLIARA", "ANOSY", "AMBOASARY SUD"),
    DistrictData(104, "TOLIARA", "ANOSY", "BETROKA"),
    DistrictData(105, "TOLIARA", "ANOSY", "TAOLANARO"),

    DistrictData(
        106,
        "TOLIARA",
        "ATSIMO-ANDREFANA",
        "AMPANIHY OUEST",
    ),
    DistrictData(
        107,
        "TOLIARA",
        "ATSIMO-ANDREFANA",
        "ANKAZOABO SUD",
    ),
    DistrictData(108, "TOLIARA", "ATSIMO-ANDREFANA", "BENENITRA"),
    DistrictData(109, "TOLIARA", "ATSIMO-ANDREFANA", "BEROROHA"),
    DistrictData(110, "TOLIARA", "ATSIMO-ANDREFANA", "BETIOKY SUD"),
    DistrictData(111, "TOLIARA", "ATSIMO-ANDREFANA", "MOROMBE"),
    DistrictData(112, "TOLIARA", "ATSIMO-ANDREFANA", "SAKARAHA"),
    DistrictData(113, "TOLIARA", "ATSIMO-ANDREFANA", "TOLIARA I"),
    DistrictData(114, "TOLIARA", "ATSIMO-ANDREFANA", "TOLIARA II"),

    DistrictData(115, "TOLIARA", "MENABE", "BELO SUR TSIRIBIHINA"),
    DistrictData(116, "TOLIARA", "MENABE", "MAHABO"),
    DistrictData(117, "TOLIARA", "MENABE", "MANJA"),
    DistrictData(118, "TOLIARA", "MENABE", "MIANDRIVAZO"),
    DistrictData(119, "TOLIARA", "MENABE", "MORONDAVA"),
)


def normalize_text(value: str) -> str:
    return value.strip().upper()


def get_district_by_code(code: int) -> DistrictData | None:
    return next(
        (item for item in DISTRICTS if item.code == code),
        None,
    )


def validate_district(
    province: str,
    region: str,
    district: str,
    code_district: int,
) -> bool:
    province_normalized = normalize_text(province)
    region_normalized = normalize_text(region)
    district_normalized = normalize_text(district)

    item = get_district_by_code(code_district)

    if item is None:
        return False

    return (
        item.province == province_normalized
        and item.region == region_normalized
        and item.district == district_normalized
    )

