"use client"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { BulkResult, CFSuccess } from "@/lib/cf-types"
import { copyText } from "@/lib/utils"

function formatDate(day: number, month: number, year: number) {
  return [
    String(day).padStart(2, "0"),
    String(month).padStart(2, "0"),
    String(year),
  ].join("/")
}

function SourceDot({ isRandom }: { isRandom: boolean }) {
  if (!isRandom) return null
  return <span title="valore casuale" className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 ml-1 align-middle" />
}

function CellValue({ value, isRandom }: { value: string; isRandom: boolean }) {
  return (
    <span className={isRandom ? "text-amber-700" : undefined}>
      {value}
      <SourceDot isRandom={isRandom} />
    </span>
  )
}

function downloadCSV(results: BulkResult[]) {
  const header = "cf,cognome,nome,sesso,data_nascita,comune,provincia,note"
  const rows = results.map((r) => {
    if (!r.result.ok) {
      return `,,,,,,,"ERRORE: ${r.result.message.replace(/"/g, "'")}`
    }
    const d = (r.result as CFSuccess).data
    const s = (r.result as CFSuccess).sources
    const randomFields = Object.entries(s)
      .filter(([, v]) => v === "random")
      .map(([k]) => k)
      .join(";")
    const note = randomFields.length > 0 ? `campi random: ${randomFields}` : "completo"
    const date = `${d.day}/${d.month}/${d.year}`
    return `"${(r.result as CFSuccess).cf}","${d.surname}","${d.name}","${d.gender}","${date}","${d.birthplace}","${d.birthplaceProvincia}","${note}"`
  })
  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `codici-fiscali-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function copyTSV(results: BulkResult[]) {
  const lines = results
    .filter((r) => r.result.ok)
    .map((r) => (r.result as CFSuccess).cf)
  copyText(lines.join("\n"))
}

export function ResultsTable({ results }: { results: BulkResult[] }) {
  const succeeded = results.filter((r) => r.result.ok).length
  const failed = results.length - succeeded

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">
            {results.length} totali —{" "}
            <span className="text-foreground font-medium">{succeeded} calcolati</span>
            {failed > 0 && (
              <span className="text-destructive">, {failed} errori</span>
            )}
          </span>
          <span className="flex items-center gap-1 text-amber-700 text-xs">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
            valore casuale
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => copyTSV(results)}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-card hover:bg-secondary transition-colors"
          >
            Copia CF
          </button>
          <button
            onClick={() => downloadCSV(results)}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
          >
            Scarica CSV
          </button>
        </div>
      </div>

      <div className="rounded-md border border-border overflow-auto max-h-[500px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8 text-center">#</TableHead>
              <TableHead>CF</TableHead>
              <TableHead>Cognome</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Sesso</TableHead>
              <TableHead>Data di nascita</TableHead>
              <TableHead>Comune</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((r) => {
              if (!r.result.ok) {
                return (
                  <TableRow key={r.index} className="bg-destructive/5">
                    <TableCell className="text-center text-muted-foreground text-xs">{r.index + 1}</TableCell>
                    <TableCell colSpan={6} className="text-destructive text-xs">
                      Errore{r.result.field ? ` (${r.result.field})` : ""}: {r.result.message}
                    </TableCell>
                  </TableRow>
                )
              }
              const { cf, data, sources } = r.result as CFSuccess
              return (
                <TableRow key={r.index}>
                  <TableCell className="text-center text-muted-foreground text-xs">{r.index + 1}</TableCell>
                  <TableCell className="font-mono font-medium tracking-wider text-sm">{cf}</TableCell>
                  <TableCell className="text-sm">
                    <CellValue value={data.surname} isRandom={sources.surname === "random"} />
                  </TableCell>
                  <TableCell className="text-sm">
                    <CellValue value={data.name} isRandom={sources.name === "random"} />
                  </TableCell>
                  <TableCell className="text-sm">
                    <CellValue value={data.gender} isRandom={sources.gender === "random"} />
                  </TableCell>
                  <TableCell className="text-sm text-nowrap">
                    <CellValue
                      value={formatDate(data.day, data.month, data.year)}
                      isRandom={sources.day === "random" || sources.month === "random" || sources.year === "random"}
                    />
                  </TableCell>
                  <TableCell className="text-sm">
                    <CellValue value={`${data.birthplace} (${data.birthplaceProvincia})`} isRandom={sources.birthplace === "random"} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
