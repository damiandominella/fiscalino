"use client"

import { DateInput, parseDateValue } from "@/components/date-input"
import { ResultsTable } from "@/components/results-table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BulkResult } from "@/lib/cf-types"
import { useState } from "react"

export function BulkTab() {
  const [count, setCount] = useState("10")
  const [baseFields, setBaseFields] = useState({
    gender: "" as "M" | "F" | "",
    birthplace: "",
    birthplaceProvincia: "",
    birthdate: "", // "YYYY-MM-DD" or ""
  })
  const [results, setResults] = useState<BulkResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const setBase = (key: keyof typeof baseFields) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setBaseFields((f) => ({ ...f, [key]: e.target.value }))

  const generate = async () => {
    const n = parseInt(count)
    if (!Number.isInteger(n) || n < 1 || n > 1000) {
      setError("Inserisci un numero tra 1 e 1000.")
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)

    const { gender, birthplace, birthplaceProvincia, birthdate } = baseFields
    const parsed = parseDateValue(birthdate)
    const base: Record<string, unknown> = {}
    if (gender) base.gender = gender
    if (birthplace) base.birthplace = birthplace
    if (birthplaceProvincia) base.birthplaceProvincia = birthplaceProvincia
    if (parsed) { base.day = parsed.day; base.month = parsed.month; base.year = parsed.year }

    const res = await fetch("/api/cf/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: n, base }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok && data.message) {
      setError(data.message)
      return
    }

    setResults(data.results)
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Genera fino a 1000 codici fiscali. Puoi fissare uno o più campi comuni (opzionali), gli altri verranno
        completati con valori casuali validi.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label htmlFor="count">Quanti codici fiscali generare</Label>
          <Input
            id="count"
            type="number"
            min={1}
            max={1000}
            value={count}
            onChange={(e) => setCount(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">Max 1000 per richiesta</p>
        </div>

        <div>
          <Label htmlFor="bulk-gender">Sesso comune (opzionale)</Label>
          <select
            id="bulk-gender"
            value={baseFields.gender}
            onChange={(e) => setBaseFields((f) => ({ ...f, gender: e.target.value as "M" | "F" | "" }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">— casuale —</option>
            <option value="M">M — Maschio</option>
            <option value="F">F — Femmina</option>
          </select>
        </div>

        <DateInput
          id="bulk-birthdate"
          label="Data di nascita comune (opzionale)"
          value={baseFields.birthdate}
          onChange={(v) => setBaseFields((f) => ({ ...f, birthdate: v }))}
        />

        <div>
          <Label htmlFor="bulk-birthplace">Comune di nascita comune (opzionale)</Label>
          <Input
            id="bulk-birthplace"
            placeholder="Es. ROMA o codice catastale"
            value={baseFields.birthplace}
            onChange={setBase("birthplace")}
          />
        </div>

        <div>
          <Label htmlFor="bulk-prov">Provincia comune (opzionale)</Label>
          <Input
            id="bulk-prov"
            placeholder="Es. RM"
            maxLength={2}
            value={baseFields.birthplaceProvincia}
            onChange={setBase("birthplaceProvincia")}
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button onClick={generate} disabled={loading} className="w-full sm:w-auto">
        {loading ? `Generazione di ${count} CF...` : `Genera ${count || "N"} CF`}
      </Button>

      {results && <ResultsTable results={results} />}
    </div>
  )
}
