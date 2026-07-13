import CodiceFiscale from "codice-fiscale-js"
import type { CFInput, CFResult, CFData, CFFieldSources, Gender } from "./cf-types"

// Province code → capoluogo comune name.
// Most province names already match the capoluogo; overrides handle compound names.
const PROVINCE_CAPOLUOGO: Record<string, string> = {
  AG: "AGRIGENTO", AL: "ALESSANDRIA", AN: "ANCONA", AO: "AOSTA",
  AP: "ASCOLI PICENO", AQ: "L'AQUILA", AR: "AREZZO", AT: "ASTI",
  AV: "AVELLINO", BA: "BARI", BG: "BERGAMO", BI: "BIELLA",
  BL: "BELLUNO", BN: "BENEVENTO", BO: "BOLOGNA", BR: "BRINDISI",
  BS: "BRESCIA", BT: "BARLETTA", BZ: "BOLZANO", CA: "CAGLIARI",
  CB: "CAMPOBASSO", CE: "CASERTA", CH: "CHIETI", CL: "CALTANISSETTA",
  CN: "CUNEO", CO: "COMO", CR: "CREMONA", CS: "COSENZA",
  CT: "CATANIA", CZ: "CATANZARO", EN: "ENNA", FC: "FORLI'",
  FE: "FERRARA", FG: "FOGGIA", FI: "FIRENZE", FM: "FERMO",
  FR: "FROSINONE", GE: "GENOVA", GO: "GORIZIA", GR: "GROSSETO",
  IM: "IMPERIA", IS: "ISERNIA", KR: "CROTONE", LC: "LECCO",
  LE: "LECCE", LI: "LIVORNO", LO: "LODI", LT: "LATINA",
  LU: "LUCCA", MB: "MONZA", MC: "MACERATA", ME: "MESSINA",
  MI: "MILANO", MN: "MANTOVA", MO: "MODENA", MS: "MASSA",
  MT: "MATERA", NA: "NAPOLI", NO: "NOVARA", NU: "NUORO",
  OR: "ORISTANO", PA: "PALERMO", PC: "PIACENZA", PD: "PADOVA",
  PE: "PESCARA", PG: "PERUGIA", PI: "PISA", PN: "PORDENONE",
  PO: "PRATO", PR: "PARMA", PT: "PISTOIA", PU: "PESARO",
  PV: "PAVIA", PZ: "POTENZA", RA: "RAVENNA", RC: "REGGIO CALABRIA",
  RE: "REGGIO EMILIA", RG: "RAGUSA", RI: "RIETI", RM: "ROMA",
  RN: "RIMINI", RO: "ROVIGO", SA: "SALERNO", SI: "SIENA",
  SO: "SONDRIO", SP: "LA SPEZIA", SR: "SIRACUSA", SS: "SASSARI",
  SU: "CARBONIA", SV: "SAVONA", TA: "TARANTO", TE: "TERAMO",
  TN: "TRENTO", TO: "TORINO", TP: "TRAPANI", TR: "TERNI",
  TS: "TRIESTE", TV: "TREVISO", UD: "UDINE", VA: "VARESE",
  VB: "VERBANIA", VC: "VERCELLI", VE: "VENEZIA", VI: "VICENZA",
  VR: "VERONA", VT: "VITERBO", VV: "VIBO VALENTIA",
}

// Curated list of valid Italian comuni for random generation
const COMUNI_SAMPLE = [
  { nome: "ROMA", prov: "RM" },
  { nome: "MILANO", prov: "MI" },
  { nome: "NAPOLI", prov: "NA" },
  { nome: "TORINO", prov: "TO" },
  { nome: "PALERMO", prov: "PA" },
  { nome: "GENOVA", prov: "GE" },
  { nome: "BOLOGNA", prov: "BO" },
  { nome: "FIRENZE", prov: "FI" },
  { nome: "BARI", prov: "BA" },
  { nome: "CATANIA", prov: "CT" },
  { nome: "VENEZIA", prov: "VE" },
  { nome: "VERONA", prov: "VR" },
  { nome: "MESSINA", prov: "ME" },
  { nome: "PADOVA", prov: "PD" },
  { nome: "TRIESTE", prov: "TS" },
  { nome: "TARANTO", prov: "TA" },
  { nome: "BRESCIA", prov: "BS" },
  { nome: "PRATO", prov: "PO" },
  { nome: "MODENA", prov: "MO" },
  { nome: "REGGIO CALABRIA", prov: "RC" },
  { nome: "REGGIO EMILIA", prov: "RE" },
  { nome: "PERUGIA", prov: "PG" },
  { nome: "LIVORNO", prov: "LI" },
  { nome: "RAVENNA", prov: "RA" },
  { nome: "CAGLIARI", prov: "CA" },
  { nome: "FOGGIA", prov: "FG" },
  { nome: "RIMINI", prov: "RN" },
  { nome: "SALERNO", prov: "SA" },
  { nome: "FERRARA", prov: "FE" },
  { nome: "SASSARI", prov: "SS" },
] as const

const NAMES_M = [
  "Marco", "Luca", "Andrea", "Giuseppe", "Antonio", "Francesco", "Matteo",
  "Giovanni", "Roberto", "Stefano", "Angelo", "Davide", "Simone", "Pietro",
  "Emanuele", "Giorgio", "Maurizio", "Fabio", "Daniele", "Claudio",
]

const NAMES_F = [
  "Maria", "Anna", "Laura", "Sara", "Giulia", "Valentina", "Chiara",
  "Francesca", "Alessia", "Roberta", "Silvia", "Paola", "Elena", "Monica",
  "Lucia", "Cristina", "Federica", "Elisa", "Martina", "Giovanna",
]

const SURNAMES = [
  "Rossi", "Russo", "Ferrari", "Esposito", "Bianchi", "Romano", "Colombo",
  "Ricci", "Marino", "Greco", "Bruno", "Gallo", "Conti", "De Luca", "Mancini",
  "Costa", "Giordano", "Rizzo", "Lombardi", "Moreno", "Barbieri", "Fontana",
  "Santoro", "Marini", "Rinaldi", "Caruso", "Ferrara", "Gatti", "Ruggiero",
]

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomDate() {
  const year = 1945 + Math.floor(Math.random() * 65)
  const month = 1 + Math.floor(Math.random() * 12)
  // Use day 1-28 to be safe for all months
  const day = 1 + Math.floor(Math.random() * 28)
  return { year, month, day }
}

function resolveGender(g?: string): Gender {
  if (g === "M" || g === "F") return g
  return Math.random() < 0.5 ? "M" : "F"
}

export function generateCF(input: CFInput): CFResult {
  const sources: CFFieldSources = {
    name: input.name ? "user" : "random",
    surname: input.surname ? "user" : "random",
    gender: input.gender ? "user" : "random",
    day: input.day !== undefined ? "user" : "random",
    month: input.month !== undefined ? "user" : "random",
    year: input.year !== undefined ? "user" : "random",
    birthplace: input.birthplace ? "user" : "random",
    birthplaceProvincia: input.birthplaceProvincia ? "user" : "random",
  }

  const gender = resolveGender(input.gender)
  const randomD = randomDate()
  const day = input.day ?? randomD.day
  const month = input.month ?? randomD.month
  const year = input.year ?? randomD.year

  let birthplace: string
  let birthplaceProvincia: string

  if (input.birthplace) {
    birthplace = input.birthplace.toUpperCase()
    birthplaceProvincia = input.birthplaceProvincia?.toUpperCase() ?? ""

    // Resolve 2-letter province codes (e.g. "RN" → "RIMINI") to capoluogo
    if (birthplace.length === 2 && /^[A-Z]{2}$/.test(birthplace) && PROVINCE_CAPOLUOGO[birthplace]) {
      birthplaceProvincia = birthplace
      birthplace = PROVINCE_CAPOLUOGO[birthplace]
    }

    sources.birthplaceProvincia = input.birthplaceProvincia ? "user" : "random"
  } else {
    const comuneRandom = randomFrom(COMUNI_SAMPLE)
    birthplace = comuneRandom.nome
    birthplaceProvincia = comuneRandom.prov
    sources.birthplaceProvincia = "random"
  }

  const name = input.name ?? randomFrom(gender === "M" ? NAMES_M : NAMES_F)
  const surname = input.surname ?? randomFrom(SURNAMES)

  const cfObj = {
    name,
    surname,
    gender,
    day,
    month,
    year,
    birthplace,
    birthplaceProvincia,
  }

  try {
    const cf = new CodiceFiscale(cfObj)
    if (!cf.isValid()) {
      return { ok: false, message: "Codice fiscale calcolato non valido" }
    }

    const data: CFData = {
      name,
      surname,
      gender,
      day,
      month,
      year,
      birthplace,
      birthplaceProvincia,
    }

    return { ok: true, cf: cf.toString(), data, sources }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)

    // Try to identify which field caused the error
    if (msg.toLowerCase().includes("comune") || msg.toLowerCase().includes("birthplace") || msg.toLowerCase().includes("location")) {
      return { ok: false, field: "birthplace", message: `Comune non trovato: "${birthplace}"` }
    }
    if (msg.toLowerCase().includes("date") || msg.toLowerCase().includes("day") || msg.toLowerCase().includes("month") || msg.toLowerCase().includes("year")) {
      return { ok: false, field: "date", message: `Data non valida: ${day}/${month}/${year}` }
    }
    if (msg.toLowerCase().includes("name")) {
      return { ok: false, field: "name", message: `Nome non valido: "${name}"` }
    }
    if (msg.toLowerCase().includes("surname")) {
      return { ok: false, field: "surname", message: `Cognome non valido: "${surname}"` }
    }
    if (msg.toLowerCase().includes("gender")) {
      return { ok: false, field: "gender", message: `Sesso non valido: "${gender}"` }
    }

    return { ok: false, message: msg }
  }
}
