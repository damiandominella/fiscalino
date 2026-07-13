"use client"

import { Badge } from "@/components/ui/badge"
import { Check, Copy } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const BASE = "https://fiscalino.vercel.app"

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
      aria-label={label}
    >
      {copied ? <><Check className="size-3.5" /> Copied</> : <><Copy className="size-3.5" /> {label}</>}
    </button>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <div className="relative group">
      <pre className="bg-muted/60 border border-border rounded-lg p-4 overflow-x-auto text-[13px] leading-relaxed font-mono">
        <code>{children}</code>
      </pre>
      <div className="absolute top-2.5 right-2.5">
        <CopyButton text={children} />
      </div>
    </div>
  )
}

const SYSTEM_PROMPT = `You have access to the Fiscalino API for generating Italian codici fiscali (tax codes).

Base URL: ${BASE}

## Endpoints

### POST /api/cf/single
Generate a single codice fiscale. Send a JSON body with any of these optional fields:
- name (string): first name
- surname (string): last name
- gender (string): "M" or "F"
- day (number): day of birth, 1–31
- month (number): month of birth, 1–12
- year (number): year of birth
- birthplace (string): Italian comune name (e.g. "Roma"), codice catastale (e.g. "H501"), or 2-letter province code (e.g. "RM")
- birthplaceProvincia (string): 2-letter province code for disambiguation

Omitted fields are filled with valid random values. The response has { ok: true, cf: "...", data: {...}, sources: {...} } on success, or { ok: false, message: "..." } on failure (HTTP 422).

### POST /api/cf/bulk
Generate up to 1000 codici fiscali. JSON body:
- count (number, required): how many codes to generate, 1–1000
- base (object, optional): default CFInput fields applied to every row
- rows (array of objects, optional): per-row overrides merged on top of base

Response: { total, succeeded, failed, results: [{ index, result }] }. Individual rows can fail independently.

## Usage rules
- Always set Content-Type: application/json
- The birthplace field accepts comune names, 4-char codici catastali, or 2-letter province codes
- Province codes (e.g. "MI") resolve to the province capital (e.g. "MILANO")
- For bulk generation, chunk into requests of ≤1000 rows
- Check result.ok on each item — partial failures are possible`

const EXAMPLE_SINGLE = `const res = await fetch("${BASE}/api/cf/single", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Mario",
    surname: "Rossi",
    gender: "M",
    day: 1,
    month: 8,
    year: 1985,
    birthplace: "Roma",
  }),
});
const { ok, cf, data } = await res.json();`

const EXAMPLE_BULK = `const res = await fetch("${BASE}/api/cf/bulk", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    count: 3,
    base: { birthplace: "MI", year: 1990 },
    rows: [
      { name: "Mario", surname: "Rossi", gender: "M" },
      { name: "Giulia", surname: "Bianchi", gender: "F" },
      { name: "Luca", surname: "Verdi", gender: "M" },
    ],
  }),
});
const { results, succeeded, failed } = await res.json();`

const EXAMPLE_PYTHON = `import requests

resp = requests.post(
    "${BASE}/api/cf/single",
    json={
        "name": "Mario",
        "surname": "Rossi",
        "gender": "M",
        "day": 1,
        "month": 8,
        "year": 1985,
        "birthplace": "RM",
    },
)
data = resp.json()
print(data["cf"])  # RSSMRA85M01H501J`

export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-end gap-3">
          <div>
            <Link href="/" className="group">
              <h1 className="text-xl font-semibold tracking-tight group-hover:text-primary transition-colors">fiscalino</h1>
            </Link>
          </div>
          <nav className="ml-auto flex gap-4 text-sm font-medium mb-0.5">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">generator</Link>
            <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">api</Link>
            <Link href="/agents" className="text-foreground">agents</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-semibold tracking-tight">AI Agents</h1>
          </div>
          <p className="text-muted-foreground">
            Let your AI agent generate Italian codici fiscali via the Fiscalino API.
            No API key needed — just paste the system prompt below into your agent&apos;s instructions.
          </p>
        </div>

        {/* ── How it works ───────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-3 mb-12">
          <div className="border border-border rounded-lg p-4 bg-card">
            <h3 className="text-sm font-semibold mb-1">1. Paste the prompt</h3>
            <p className="text-xs text-muted-foreground">Copy the system prompt into your agent&apos;s instructions or tool definitions.</p>
          </div>
          <div className="border border-border rounded-lg p-4 bg-card">
            <h3 className="text-sm font-semibold mb-1">2. Agent calls the API</h3>
            <p className="text-xs text-muted-foreground">Your agent sends POST requests to generate single or bulk codici fiscali.</p>
          </div>
          <div className="border border-border rounded-lg p-4 bg-card">
            <h3 className="text-sm font-semibold mb-1">3. Get structured JSON</h3>
            <p className="text-xs text-muted-foreground">Responses include the codice fiscale, resolved data, and which fields were randomized.</p>
          </div>
        </div>

        {/* ── System prompt ──────────────────────────────── */}
        <h2 className="text-lg font-semibold mb-1">System prompt</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Copy this prompt into your AI agent&apos;s system instructions. It teaches the agent both endpoints, all accepted field formats, and error handling.
        </p>

        <div className="mb-10">
          <div className="flex items-center justify-between border border-border rounded-t-lg bg-card px-4 py-2.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prompt: paste into your agent</span>
            <CopyButton text={SYSTEM_PROMPT} label="Copy prompt" />
          </div>
          <pre className="bg-muted/60 border border-t-0 border-border rounded-b-lg p-4 overflow-x-auto text-[13px] leading-relaxed font-mono whitespace-pre-wrap max-h-100 overflow-y-auto">
            {SYSTEM_PROMPT}
          </pre>
        </div>

        {/* ── Code examples ──────────────────────────────── */}
        <h2 className="text-lg font-semibold mt-12 mb-1">Code examples</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Drop these snippets into your agent&apos;s tool implementation, or use them as reference for how the API works.
        </p>

        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          Single generation
          <Badge variant="secondary" className="text-[10px]">JavaScript</Badge>
        </h3>
        <CodeBlock>{EXAMPLE_SINGLE}</CodeBlock>

        <h3 className="text-sm font-semibold mt-8 mb-2 flex items-center gap-2">
          Bulk generation
          <Badge variant="secondary" className="text-[10px]">JavaScript</Badge>
        </h3>
        <CodeBlock>{EXAMPLE_BULK}</CodeBlock>

        <h3 className="text-sm font-semibold mt-8 mb-2 flex items-center gap-2">
          Python
          <Badge variant="secondary" className="text-[10px]">Python</Badge>
        </h3>
        <CodeBlock>{EXAMPLE_PYTHON}</CodeBlock>

        {/* ── Tips ────────────────────────────────────────── */}
        <h2 className="text-lg font-semibold mt-12 mb-4">Tips for agent builders</h2>

        <div className="space-y-3 mb-12">
          <div className="border border-border rounded-lg p-4 bg-card">
            <h3 className="text-sm font-semibold mb-1">Use province codes for simplicity</h3>
            <p className="text-xs text-muted-foreground">
              Instead of full comune names, pass 2-letter province codes like <code className="font-mono bg-muted px-1 py-0.5 rounded">&quot;MI&quot;</code> or <code className="font-mono bg-muted px-1 py-0.5 rounded">&quot;RM&quot;</code>. They&apos;re automatically resolved to the province capital.
            </p>
          </div>
          <div className="border border-border rounded-lg p-4 bg-card">
            <h3 className="text-sm font-semibold mb-1">Omit fields for randomization</h3>
            <p className="text-xs text-muted-foreground">
              Any field left out is filled with a valid random value. The <code className="font-mono bg-muted px-1 py-0.5 rounded">sources</code> object in the response tells you which fields were randomized.
            </p>
          </div>
          <div className="border border-border rounded-lg p-4 bg-card">
            <h3 className="text-sm font-semibold mb-1">Handle partial failures in bulk</h3>
            <p className="text-xs text-muted-foreground">
              The bulk endpoint always returns HTTP 200. Individual rows can fail — always check <code className="font-mono bg-muted px-1 py-0.5 rounded">result.ok</code> on each item in the <code className="font-mono bg-muted px-1 py-0.5 rounded">results</code> array.
            </p>
          </div>
          <div className="border border-border rounded-lg p-4 bg-card">
            <h3 className="text-sm font-semibold mb-1">No auth, no rate limits</h3>
            <p className="text-xs text-muted-foreground">
              The API is open and doesn&apos;t require API keys. Bulk requests are capped at 1,000 rows per call — chunk larger batches on the client side.
            </p>
          </div>
        </div>

        <div className="mt-16" />
      </main>

      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 text-xs text-muted-foreground">
          Motore di calcolo:{" "}
          <a
            href="https://www.npmjs.com/package/codice-fiscale-js"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            codice-fiscale-js
          </a>
          .
        </div>
      </footer>
    </div>
  )
}
