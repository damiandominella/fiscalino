"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { BulkResult, CFInput, CFSuccess } from "@/lib/cf-types"
import Papa from "papaparse"
import { useRef, useState } from "react"

// Auto-detect common column names → our field names
// "_date" means the column holds a full date string we'll parse ourselves
const FIELD_ALIASES: Record<string, keyof CFInput | "_cf" | "_date"> = {
  nome: "name",
  name: "name",
  first_name: "name",
  firstname: "name",
  cognome: "surname",
  surname: "surname",
  last_name: "surname",
  lastname: "surname",
  sesso: "gender",
  gender: "gender",
  sex: "gender",
  giorno: "day",
  day: "day",
  gg: "day",
  mese: "month",
  month: "month",
  mm: "month",
  anno: "year",
  year: "year",
  aaaa: "year",
  yyyy: "year",
  data_nascita: "_date",
  data: "_date",
  date: "_date",
  birth_date: "_date",
  birthdate: "_date",
  date_of_birth: "_date",
  dob: "_date",
  data_di_nascita: "_date",
  comune: "birthplace",
  birthplace: "birthplace",
  luogo_nascita: "birthplace",
  luogo: "birthplace",
  citta: "birthplace",
  city: "birthplace",
  provincia: "birthplaceProvincia",
  province: "birthplaceProvincia",
  prov: "birthplaceProvincia",
  codice_fiscale: "_cf",
  cf: "_cf",
  fiscal_code: "_cf",
  codicefiscale: "_cf",
}

type MappingTarget = keyof CFInput | "_cf" | "_date" | ""
type Mapping = Record<string, MappingTarget>

interface ProcessedRow {
  original: Record<string, string>
  cf: string
  status: "calcolato" | "presente" | "random" | "errore"
  note: string
}

/**
 * Parse a date string in common formats to {day, month, year}.
 * Supported: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, MM/DD/YYYY (US),
 * DD.MM.YYYY, YYYYMMDD, "15 gen 2000", "15 gennaio 2000"
 */
function parseDateString(raw: string): { day: number; month: number; year: number } | null {
  const s = raw.trim()
  if (!s) return null

  const IT_MONTHS: Record<string, number> = {
    gen: 1, gennaio: 1, feb: 2, febbraio: 2, mar: 3, marzo: 3,
    apr: 4, aprile: 4, mag: 5, maggio: 5, giu: 6, giugno: 6,
    lug: 7, luglio: 7, ago: 8, agosto: 8, set: 9, settembre: 9,
    ott: 10, ottobre: 10, nov: 11, novembre: 11, dic: 12, dicembre: 12,
    jan: 1, january: 1, feb2: 2, february: 2, mar2: 3, march: 3,
    apr2: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
    aug: 8, august: 8, sep: 9, september: 9, oct: 10, october: 10,
    nov2: 11, november: 11, dec: 12, december: 12,
  }

  // YYYYMMDD
  if (/^\d{8}$/.test(s)) {
    const y = +s.slice(0, 4), m = +s.slice(4, 6), d = +s.slice(6, 8)
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return { year: y, month: m, day: d }
  }

  // YYYY-MM-DD or YYYY/MM/DD
  const iso = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
  if (iso) return { year: +iso[1], month: +iso[2], day: +iso[3] }

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/)
  if (dmy) return { day: +dmy[1], month: +dmy[2], year: +dmy[3] }

  // "15 gen 2000" or "15 gennaio 2000"
  const wordy = s.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/)
  if (wordy) {
    const mKey = wordy[2].toLowerCase()
    const m = IT_MONTHS[mKey]
    if (m) return { day: +wordy[1], month: m, year: +wordy[3] }
  }

  return null
}

function autoDetectMapping(headers: string[]): Mapping {
  return Object.fromEntries(
    headers.map((h) => {
      const key = h.toLowerCase().replace(/[\s-]+/g, "_")
      const mapped: MappingTarget = FIELD_ALIASES[key] ?? ""
      return [h, mapped]
    })
  )
}

function isValidCF(cf: string) {
  return /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/i.test(cf)
}

function isOmocodia(cf: string) {
  const OMOCODIA_CHARS = "LMNPQRSTUV"
  const omoPositions = [6, 7, 9, 10, 12, 13, 14]
  return omoPositions.some((i) => cf[i] && OMOCODIA_CHARS.includes(cf[i].toUpperCase()))
}

export function CSVTab() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<Mapping>({})
  const [results, setResults] = useState<ProcessedRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fillRandom, setFillRandom] = useState<Set<number>>(new Set())

  const handleFile = (file: File) => {
    setError(null)
    setResults(null)
    setFillRandom(new Set())
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (r) => {
        if (!r.data.length) { setError("Il CSV non contiene righe."); return }
        const hdrs = r.meta.fields ?? []
        setHeaders(hdrs)
        setRows(r.data)
        setMapping(autoDetectMapping(hdrs))
      },
      error: () => setError("Impossibile leggere il file CSV."),
    })
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const process = async () => {
    setLoading(true)
    setError(null)
    setResults(null)

    const cfColumn = Object.entries(mapping).find(([, v]) => v === "_cf")?.[0]

    const toCompute: { rowIndex: number; input: CFInput }[] = []
    const preClassified: ProcessedRow[] = rows.map((row, i) => {
      const existingCF = cfColumn ? row[cfColumn]?.trim().toUpperCase() : ""
      if (existingCF && isValidCF(existingCF)) {
        const note = isOmocodia(existingCF) ? "CF presente (possibile omocodia)" : "CF presente"
        return { original: row, cf: existingCF, status: "presente" as const, note }
      }

      const input: CFInput = {}
      for (const [col, field] of Object.entries(mapping)) {
        if (!field || field === "_cf") continue
        const val = row[col]?.trim()
        if (!val) continue

        if (field === "_date") {
          const parsed = parseDateString(val)
          if (parsed) { input.day = parsed.day; input.month = parsed.month; input.year = parsed.year }
          continue
        }

        if (field === "day" || field === "month" || field === "year") {
          const n = Number(val)
          if (!isNaN(n)) (input as Record<string, unknown>)[field] = n
        } else if (field === "gender") {
          const g = val.toUpperCase()
          if (g === "M" || g === "F") input.gender = g
        } else {
          (input as Record<string, unknown>)[field] = val
        }
      }

      if (fillRandom.has(i)) {
        toCompute.push({ rowIndex: i, input: {} })
        return { original: row, cf: "", status: "random" as const, note: "in calcolo..." }
      }

      toCompute.push({ rowIndex: i, input })
      return { original: row, cf: "", status: "calcolato" as const, note: "in calcolo..." }
    })

    const CHUNK = 500
    const bulkInputs = toCompute.map((t) => t.input)
    const allResults: BulkResult[] = []

    for (let i = 0; i < bulkInputs.length; i += CHUNK) {
      const chunk = bulkInputs.slice(i, i + CHUNK)
      const res = await fetch("/api/cf/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: chunk.length, rows: chunk }),
      })
      const data = await res.json()
      allResults.push(...(data.results as BulkResult[]))
    }

    let apiIdx = 0
    const finalRows: ProcessedRow[] = preClassified.map((pr, rowIdx) => {
      if (pr.status === "presente") return pr

      const apiResult = allResults[apiIdx++]
      if (!apiResult) return { ...pr, status: "errore" as const, note: "Nessun risultato API" }

      if (!apiResult.result.ok) {
        return {
          ...pr,
          status: "errore" as const,
          note: `${apiResult.result.field ? `Campo: ${apiResult.result.field} — ` : ""}${apiResult.result.message}`,
        }
      }

      const success = apiResult.result as CFSuccess
      const hasRandom = Object.values(success.sources).some((s) => s === "random")
      const status = fillRandom.has(rowIdx) || hasRandom ? "random" : "calcolato"
      const randomFields = Object.entries(success.sources)
        .filter(([, s]) => s === "random")
        .map(([k]) => k)
      const note = hasRandom ? `Campi generati: ${randomFields.join(", ")}` : "Tutti i campi forniti"

      return { ...pr, cf: success.cf, status, note }
    })

    setResults(finalRows)
    setLoading(false)
  }

  const toggleFillRandom = (i: number) => {
    setFillRandom((prev) => {
      const next = new Set(prev)
      if (next.has(i)) { next.delete(i) } else { next.add(i) }
      return next
    })
  }

  const fillAllErrors = () => {
    if (!results) return
    const errorIndices = results.map((r, i) => (r.status === "errore" ? i : -1)).filter((i) => i >= 0)
    setFillRandom((prev) => {
      const next = new Set(prev)
      errorIndices.forEach((i) => next.add(i))
      return next
    })
  }

  const downloadResult = () => {
    if (!results) return
    // Original columns first, then CF, then Stato and Note at the end
    const allCols = [...headers, "codice_fiscale", "stato", "note"]
    const csvRows = results.map((r) => {
      const base = headers.map((h) => `"${(r.original[h] ?? "").replace(/"/g, "'")}"`)
      return [...base, `"${r.cf}"`, `"${r.status}"`, `"${r.note.replace(/"/g, "'")}"`].join(",")
    })
    const blob = new Blob([[allCols.join(","), ...csvRows].join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cf-risultati-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const statusColor: Record<string, string> = {
    calcolato: "bg-green-100 text-green-800",
    presente: "bg-blue-100 text-blue-800",
    random: "bg-amber-100 text-amber-800",
    errore: "bg-red-100 text-red-800",
  }

  const hasErrors = results?.some((r) => r.status === "errore")
  const errorCount = results ? results.filter((r) => r.status === "errore").length : 0
  const unfilledErrors = results
    ? results.filter((r, i) => r.status === "errore" && !fillRandom.has(i)).length
    : 0

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Carica un CSV con dati anagrafici. Il tool rileva automaticamente le colonne e calcola i codici fiscali
        mancanti. Puoi correggere il mapping delle colonne prima di procedere.
      </p>

      {!rows.length && (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <p className="text-sm font-medium text-foreground">Trascina un file CSV qui</p>
          <p className="text-xs text-muted-foreground mt-1">oppure clicca per selezionare</p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {rows.length > 0 && !results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{rows.length} righe caricate — mappa le colonne</p>
            <button
              onClick={() => { setRows([]); setHeaders([]); setMapping({}) }}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Ricarica file
            </button>
          </div>

          <div className="rounded-md border border-border p-4 space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Mapping colonne CSV → campo</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {headers.map((h) => (
                <div key={h} className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded border border-border truncate max-w-[120px]" title={h}>
                    {h}
                  </span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <select
                    value={mapping[h] ?? ""}
                    onChange={(e) => setMapping((m) => ({ ...m, [h]: e.target.value as MappingTarget }))}
                    className="flex h-8 flex-1 rounded-md border border-input bg-transparent px-2 py-0 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">— ignora —</option>
                    <option value="surname">Cognome</option>
                    <option value="name">Nome</option>
                    <option value="gender">Sesso (M/F)</option>
                    <option value="_date">Data di nascita (qualsiasi formato)</option>
                    <option value="day">Giorno</option>
                    <option value="month">Mese</option>
                    <option value="year">Anno</option>
                    <option value="birthplace">Comune di nascita</option>
                    <option value="birthplaceProvincia">Provincia</option>
                    <option value="_cf">Codice fiscale (già presente)</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={process} disabled={loading}>
            {loading ? "Calcolo in corso..." : `Elabora ${rows.length} righe`}
          </Button>
        </div>
      )}

      {results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap text-sm">
              {(["calcolato", "presente", "random", "errore"] as const).map((s) => {
                const n = results.filter((r) => r.status === s).length
                if (!n) return null
                return (
                  <span key={s} className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor[s]}`}>
                    {n} {s}
                  </span>
                )
              })}
            </div>
            <div className="flex gap-2">
              {hasErrors && unfilledErrors > 0 && (
                <Button variant="outline" size="sm" onClick={fillAllErrors}>
                  Riempi {errorCount} errori con dati random
                </Button>
              )}
              {hasErrors && fillRandom.size > 0 && (
                <Button size="sm" onClick={process} disabled={loading}>
                  {loading ? "Ricalcolo..." : "Ricalcola"}
                </Button>
              )}
              <Button size="sm" onClick={downloadResult}>
                Scarica CSV
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-border overflow-auto max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8 text-center">#</TableHead>
                  <TableHead>CF</TableHead>
                 
                  {headers.slice(0, 4).map((h) => (
                    <TableHead key={h} className="max-w-[120px]">{h}</TableHead>
                  ))}
                   <TableHead>Stato</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r, i) => (
                  <TableRow key={i} className={r.status === "errore" ? "bg-destructive/5" : undefined}>
                    <TableCell className="text-center text-muted-foreground text-xs">{i + 1}</TableCell>
                    <TableCell className="font-mono font-medium tracking-wider text-sm">{r.cf || "—"}</TableCell>
            
                    {headers.slice(0, 4).map((h) => (
                      <TableCell key={h} className="text-xs max-w-[120px] truncate">{r.original[h] ?? ""}</TableCell>
                    ))}
                    <TableCell className="text-center">
                       <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor[r.status]}`}>
                        {r.status}
                      </span>
                      {r.status === "errore" && (
                        <input
                          type="checkbox"
                          checked={fillRandom.has(i)}
                          onChange={() => toggleFillRandom(i)}
                          className="cursor-pointer"
                          title="Riempi questa riga con un CF random valido"
                        />
                      )}
                     
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{r.note}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
