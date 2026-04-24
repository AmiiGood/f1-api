export type RivalrySeed = {
    id: string;
    driverA: string;
    driverB: string;
    startYear: number;
    endYear: number | null;
    era: string;
    intensity: "legendary" | "intense" | "notable";
    keyRaces: { raceId: string; significance: { en: string; es: string } }[];
    description: { en: string; es: string };
};

export const RIVALRIES: RivalrySeed[] = [
    {
        id: "senna-vs-prost",
        driverA: "ayrton-senna",
        driverB: "alain-prost",
        startYear: 1988,
        endYear: 1993,
        era: "turbo-to-v10",
        intensity: "legendary",
        description: {
            en: "The defining rivalry of late 1980s and early 1990s F1. Teammates at McLaren in 1988-1989, their relationship collapsed into one of the sport's bitterest feuds, culminating in two championship-deciding collisions at Suzuka.",
            es: "La rivalidad que definió el final de los 80 y principio de los 90 en la F1. Compañeros en McLaren del 88 al 89, su relación se degradó en una de las enemistades más amargas del deporte, culminando en dos choques decisivos de campeonato en Suzuka.",
        },
        keyRaces: [
            {
                raceId: "1989-japanese-gp",
                significance: {
                    en: "Prost blocks Senna at the chicane; Senna wins on track but is disqualified, handing the title to Prost.",
                    es: "Prost bloquea a Senna en la chicane; Senna gana en pista pero es descalificado, entregándole el título a Prost.",
                },
            },
            {
                raceId: "1990-japanese-gp",
                significance: {
                    en: "Senna takes out Prost at turn one from the start, clinching the championship amid huge controversy.",
                    es: "Senna saca a Prost en la curva uno desde la salida, llevándose el campeonato en medio de una gran controversia.",
                },
            },
        ],
    },
    {
        id: "mansell-vs-piquet",
        driverA: "nigel-mansell",
        driverB: "nelson-piquet",
        startYear: 1986,
        endYear: 1987,
        era: "turbo",
        intensity: "intense",
        description: {
            en: "Teammates at Williams-Honda in one of the most toxic intra-team rivalries in F1. Despite the team's dominance, the two drivers' open hostility helped cost Williams both titles in 1986.",
            es: "Compañeros en Williams-Honda en una de las rivalidades internas más tóxicas de la F1. Pese al dominio del equipo, la hostilidad abierta entre ambos contribuyó a que Williams perdiera los dos títulos en 1986.",
        },
        keyRaces: [
            {
                raceId: "1986-australian-gp",
                significance: {
                    en: "Mansell's famous tyre blowout on the Adelaide straight hands the title to Prost in a three-way finale.",
                    es: "El famoso reventón de Mansell en la recta de Adelaida entrega el título a Prost en una final a tres.",
                },
            },
            {
                raceId: "1987-british-gp",
                significance: {
                    en: "Mansell's iconic overtake on teammate Piquet at Silverstone, with home crowd euphoria to match.",
                    es: "La icónica rebasada de Mansell sobre su compañero Piquet en Silverstone, con la euforia del público local.",
                },
            },
        ],
    },
    {
        id: "schumacher-vs-hakkinen",
        driverA: "michael-schumacher",
        driverB: "mika-hakkinen",
        startYear: 1998,
        endYear: 2000,
        era: "v10",
        intensity: "intense",
        description: {
            en: "A respectful but fierce fight between Ferrari and McLaren for championship dominance at the turn of the century. Hakkinen won back-to-back titles in 1998-1999 before Schumacher's Ferrari era truly began in 2000.",
            es: "Una batalla respetuosa pero feroz entre Ferrari y McLaren por el dominio del campeonato en el cambio de siglo. Häkkinen ganó dos títulos consecutivos en 1998-1999 antes de que empezara de verdad la era Schumacher-Ferrari en 2000.",
        },
        keyRaces: [
            {
                raceId: "2000-belgian-gp",
                significance: {
                    en: "Hakkinen's legendary three-car overtake at Les Combes, slicing past Schumacher and a backmarker in one move.",
                    es: "La legendaria rebasada a tres coches de Häkkinen en Les Combes, pasando a Schumacher y a un rezagado de un golpe.",
                },
            },
        ],
    },
    {
        id: "alonso-vs-hamilton",
        driverA: "fernando-alonso",
        driverB: "lewis-hamilton",
        startYear: 2007,
        endYear: 2007,
        era: "v8",
        intensity: "intense",
        description: {
            en: "Teammates at McLaren for a single explosive season. Alonso, double world champion, expected number one status; rookie Hamilton matched him wheel-to-wheel, and the team fractured. Both lost the title to Kimi Raikkonen by one point.",
            es: "Compañeros en McLaren durante una única temporada explosiva. Alonso, bicampeón, esperaba estatus de número uno; el rookie Hamilton le igualó rueda a rueda y el equipo se fracturó. Ambos perdieron el título ante Kimi Räikkönen por un punto.",
        },
        keyRaces: [
            {
                raceId: "2007-hungarian-gp",
                significance: {
                    en: "The pit lane incident where Alonso blocked Hamilton, triggering penalties and open warfare inside McLaren.",
                    es: "El incidente del pit lane donde Alonso bloqueó a Hamilton, desatando sanciones y guerra abierta dentro de McLaren.",
                },
            },
        ],
    },
    {
        id: "hamilton-vs-rosberg",
        driverA: "lewis-hamilton",
        driverB: "nico-rosberg",
        startYear: 2014,
        endYear: 2016,
        era: "hybrid",
        intensity: "intense",
        description: {
            en: "Childhood karting friends turned Mercedes teammates during the team's era of total dominance. Three consecutive title fights ended with Hamilton winning in 2014 and 2015, and Rosberg taking the 2016 crown before immediately retiring.",
            es: "Amigos de infancia del karting convertidos en compañeros de Mercedes durante la era de dominio total del equipo. Tres peleas consecutivas por el título acabaron con Hamilton ganando en 2014 y 2015, y Rosberg llevándose la corona de 2016 antes de retirarse de inmediato.",
        },
        keyRaces: [
            {
                raceId: "2016-spanish-gp",
                significance: {
                    en: "Both Mercedes drivers collide on lap one, taking each other out and handing Max Verstappen his debut win for Red Bull.",
                    es: "Los dos Mercedes chocan en la primera vuelta, eliminándose entre ellos y regalándole a Max Verstappen su primera victoria con Red Bull.",
                },
            },
            {
                raceId: "2016-abu-dhabi-gp",
                significance: {
                    en: "Rosberg finishes second to clinch the title; Hamilton controversially backs up the pack trying to hand the crown to rivals.",
                    es: "Rosberg acaba segundo y se lleva el título; Hamilton, polémicamente, ralentiza al pelotón intentando entregar la corona a los rivales.",
                },
            },
        ],
    },
    {
        id: "hamilton-vs-verstappen",
        driverA: "lewis-hamilton",
        driverB: "max-verstappen",
        startYear: 2021,
        endYear: 2021,
        era: "hybrid",
        intensity: "legendary",
        description: {
            en: "A generational clash between the seven-time champion and the young rising force, settled in the most controversial season finale in F1 history. Multiple collisions, heated radio messages, and a late safety car decision at Abu Dhabi defined the year.",
            es: "Choque generacional entre el heptacampeón y la joven fuerza emergente, resuelto en el final de temporada más polémico de la historia de la F1. Múltiples choques, mensajes acalorados por radio y una decisión tardía del safety car en Abu Dabi definieron el año.",
        },
        keyRaces: [
            {
                raceId: "2021-british-gp",
                significance: {
                    en: "Copse crash: Hamilton clips Verstappen at 180 mph, sending Max into the barriers; Hamilton wins after a penalty.",
                    es: "Choque en Copse: Hamilton toca a Verstappen a 290 km/h, mandando a Max contra las barreras; Hamilton gana tras una sanción.",
                },
            },
            {
                raceId: "2021-italian-gp",
                significance: {
                    en: "Both collide at Monza's first chicane, with Verstappen's car landing on top of Hamilton's halo.",
                    es: "Ambos chocan en la primera chicane de Monza, con el coche de Verstappen aterrizando sobre el halo de Hamilton.",
                },
            },
            {
                raceId: "2021-abu-dhabi-gp",
                significance: {
                    en: "The race director's controversial safety car restart decision hands Verstappen a last-lap overtake and his first world title.",
                    es: "La polémica decisión del director de carrera sobre el reinicio tras el safety car le da a Verstappen una rebasada en la última vuelta y su primer título mundial.",
                },
            },
        ],
    },
    {
        id: "lauda-vs-hunt",
        driverA: "niki-lauda",
        driverB: "james-hunt",
        startYear: 1976,
        endYear: 1976,
        era: "3L",
        intensity: "legendary",
        description: {
            en: "One of the most storied rivalries in F1, contested between the disciplined Austrian and the flamboyant Englishman. Lauda's near-fatal Nürburgring crash and miraculous six-week return defined the season, which Hunt won by a single point in a rain-soaked Japanese finale.",
            es: "Una de las rivalidades más legendarias de la F1, entre el disciplinado austriaco y el extravagante inglés. El accidente casi mortal de Lauda en Nürburgring y su milagroso regreso en seis semanas definieron la temporada, que Hunt ganó por un punto en una final japonesa empapada de lluvia.",
        },
        keyRaces: [
            {
                raceId: "1976-german-gp",
                significance: {
                    en: "Lauda's horrific crash at Bergwerk leaves him with severe burns and near death; he would return just six weeks later.",
                    es: "El terrible accidente de Lauda en Bergwerk le deja con quemaduras graves y al borde de la muerte; regresaría solo seis semanas después.",
                },
            },
            {
                raceId: "1976-japanese-gp",
                significance: {
                    en: "Lauda withdraws in torrential rain on safety grounds; Hunt finishes third to take the title by a single point.",
                    es: "Lauda se retira por seguridad bajo lluvia torrencial; Hunt termina tercero y se lleva el título por un solo punto.",
                },
            },
        ],
    },
];