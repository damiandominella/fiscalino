"use client"

import { CFResultCard } from "@/components/cf-result-card"
import { DateInput, parseDateValue } from "@/components/date-input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CFFailure, CFSuccess } from "@/lib/cf-types"
import { useState } from "react"

interface FieldError {
  field?: string
  message: string
}

const NAMES_M = ["Marco", "Luca", "Andrea", "Giuseppe", "Francesco", "Matteo", "Giovanni", "Roberto", "Davide", "Daniele"]
const NAMES_F = ["Maria", "Anna", "Laura", "Sara", "Giulia", "Valentina", "Chiara", "Francesca", "Alessia", "Elena"]
const SURNAMES = ["Rossi", "Russo", "Ferrari", "Esposito", "Bianchi", "Romano", "Colombo", "Ricci", "Marino", "Bruno"]
const COMUNI = [
  { nome: "ROMA", prov: "RM" }, { nome: "MILANO", prov: "MI" }, { nome: "NAPOLI", prov: "NA" },
  { nome: "TORINO", prov: "TO" }, { nome: "FIRENZE", prov: "FI" }, { nome: "BOLOGNA", prov: "BO" },
  { nome: "VENEZIA", prov: "VE" }, { nome: "BARI", prov: "BA" }, { nome: "PALERMO", prov: "PA" },
  { nome: "GENOVA", prov: "GE" },
]

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

function padDate(n: number, len: number) { return String(n).padStart(len, "0") }

function isFormValid(dateValue: string): boolean {
  // Empty date is fine (will be randomised server-side)
  if (!dateValue) return true
  return parseDateValue(dateValue) !== null
}

export function SingleTab() {
  const [fields, setFields] = useState({
    name: "",
    surname: "",
    gender: "" as "M" | "F" | "",
    birthdate: "", // "YYYY-MM-DD" or ""
    birthplace: "",
    birthplaceProvincia: "",
  })

  const [result, setResult] = useState<CFSuccess | null>(null)
  const [error, setError] = useState<FieldError | null>(null)
  const [loading, setLoading] = useState(false)

  const set = (key: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((f) => ({ ...f, [key]: e.target.value }))

  const fillRandom = () => {
    const gender = Math.random() < 0.5 ? "M" : "F"
    const comune = pick(COMUNI)
    const year = 1950 + Math.floor(Math.random() * 60)
    const month = 1 + Math.floor(Math.random() * 12)
    const day = 1 + Math.floor(Math.random() * 28)
    setFields({
      name: pick(gender === "M" ? NAMES_M : NAMES_F),
      surname: pick(SURNAMES),
      gender,
      birthdate: `${year}-${padDate(month, 2)}-${padDate(day, 2)}`,
      birthplace: comune.nome,
      birthplaceProvincia: comune.prov,
    })
    setResult(null)
    setError(null)
  }

  const generate = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    const { name, surname, gender, birthdate, birthplace, birthplaceProvincia } = fields
    const parsed = parseDateValue(birthdate)

    const body: Record<string, unknown> = {}
    if (name) body.name = name
    if (surname) body.surname = surname
    if (gender) body.gender = gender
    if (parsed) { body.day = parsed.day; body.month = parsed.month; body.year = parsed.year }
    if (birthplace) body.birthplace = birthplace
    if (birthplaceProvincia) body.birthplaceProvincia = birthplaceProvincia

    const res = await fetch("/api/cf/single", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const data: CFSuccess | CFFailure = await res.json()
    setLoading(false)

    if (!data.ok) {
      setError({ field: (data as CFFailure).field, message: (data as CFFailure).message })
    } else {
      setResult(data as CFSuccess)
    }
  }

  const fieldError = (name: string) =>
    error?.field === name ? (
      <p className="text-xs text-destructive mt-1">{error.message}</p>
    ) : null

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Tutti i campi sono facoltativi. Quelli lasciati vuoti verranno completati con valori casuali validi.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Nome</Label>
          <Input id="name" placeholder="Es. Marco" value={fields.name} onChange={set("name")} />
          {fieldError("name")}
        </div>
        <div>
          <Label htmlFor="surname">Cognome</Label>
          <Input id="surname" placeholder="Es. Rossi" value={fields.surname} onChange={set("surname")} />
          {fieldError("surname")}
        </div>

        <div>
          <Label htmlFor="gender">Sesso</Label>
          <select
            id="gender"
            value={fields.gender}
            onChange={(e) => setFields((f) => ({ ...f, gender: e.target.value as "M" | "F" | "" }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">— casuale —</option>
            <option value="M">M — Maschio</option>
            <option value="F">F — Femmina</option>
          </select>
          {fieldError("gender")}
        </div>

        <DateInput
          id="birthdate"
          label="Data di nascita"
          value={fields.birthdate}
          onChange={(v) => setFields((f) => ({ ...f, birthdate: v }))}
        />
        {fieldError("date")}

        <div>
          <Label htmlFor="birthplace">Comune di nascita  <span className="text-xs text-muted-foreground">(o paese nel caso di persona straniera)</span></Label>
          <Input
            id="birthplace"
            placeholder="Es. ROMA o codice catastale H501"
            value={fields.birthplace}
            onChange={set("birthplace")}
          />
         
          {fieldError("birthplace")}
        </div>
        <div>
          <Label htmlFor="birthplaceProvincia">Provincia <span className="text-xs text-muted-foreground">(opzionale, disambigua)</span></Label>
          <Input
            id="birthplaceProvincia"
            placeholder="Es. RM"
            maxLength={2}
            value={fields.birthplaceProvincia}
            onChange={set("birthplaceProvincia")}
          />
        </div>
      </div>

      {error && !error.field && (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={fillRandom} disabled={loading}>
          Compila casuale
        </Button>
        <Button onClick={generate} disabled={loading || !isFormValid(fields.birthdate)}>
          {loading ? "Calcolo in corso..." : "Genera Codice Fiscale"}
        </Button>
      </div>

      {result && <CFResultCard result={result} />}
    </div>
  )
}
