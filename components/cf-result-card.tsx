"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import type { CFSuccess, FieldSource } from "@/lib/cf-types"
import { copyText } from "@/lib/utils"

const MONTHS = [
  "", "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
]

function SourceBadge({ source }: { source: FieldSource }) {
  if (source === "user") return null
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
      random
    </span>
  )
}

function DataRow({ label, value, source }: { label: string; value: string; source: FieldSource }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-2">
        <SourceBadge source={source} />
        <span className="text-sm font-medium font-mono">{value}</span>
      </div>
    </div>
  )
}

export function CFResultCard({ result }: { result: CFSuccess }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    copyText(result.cf)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const { data, sources } = result
  const hasRandom = Object.values(sources).some((s) => s === "random")

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* CF code hero */}
      <div className="bg-primary px-6 py-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-primary-foreground/60 uppercase tracking-widest mb-1">Codice Fiscale</p>
          <p className="text-2xl font-mono font-semibold tracking-widest text-primary-foreground">{result.cf}</p>
        </div>
        <button
          onClick={copy}
          className="shrink-0 px-4 py-2 rounded-md bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground text-sm font-medium transition-colors"
        >
          {copied ? "Copiato" : "Copia"}
        </button>
      </div>

      {/* Anagrafica */}
      <div className="px-6 py-4">
        {hasRandom && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            <span className="font-medium">Campi generati automaticamente</span>
            <span>— i valori con badge amber sono stati completati con dati casuali validi.</span>
          </div>
        )}
        <DataRow label="Nome" value={data.name} source={sources.name} />
        <DataRow label="Cognome" value={data.surname} source={sources.surname} />
        <DataRow label="Sesso" value={data.gender === "M" ? "Maschio" : "Femmina"} source={sources.gender} />
        <DataRow
          label="Data di nascita"
          value={`${data.day} ${MONTHS[data.month]} ${data.year}`}
          source={sources.day === "random" || sources.month === "random" || sources.year === "random" ? "random" : "user"}
        />
        <DataRow label="Comune di nascita" value={`${data.birthplace} (${data.birthplaceProvincia})`} source={sources.birthplace} />
      </div>
    </div>
  )
}
