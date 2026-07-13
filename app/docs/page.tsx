"use client"

import { Badge } from "@/components/ui/badge"
import { Check, Copy } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const BASE = "https://fiscalino.vercel.app"

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Copy"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  )
}

function CodeBlock({ children, lang = "bash" }: { children: string; lang?: string }) {
  return (
    <div className="relative group">
      <pre className="bg-muted/60 border border-border rounded-lg p-4 overflow-x-auto text-[13px] leading-relaxed font-mono">
        <code>{children}</code>
      </pre>
      <CopyButton text={children} />
    </div>
  )
}

function JsonBlock({ children }: { children: string }) {
  return <CodeBlock lang="json">{children}</CodeBlock>
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-lg font-semibold mt-12 mb-4 scroll-mt-8 flex items-center gap-2">
      <a href={`#${id}`} className="text-muted-foreground hover:text-foreground transition-colors">#</a>
      {children}
    </h2>
  )
}

function ParamRow({ name, type, required, children }: { name: string; type: string; required?: boolean; children: React.ReactNode }) {
  return (
    <tr className="border-b border-border">
      <td className="py-2.5 pr-3 align-top">
        <code className="text-[13px] font-mono font-medium">{name}</code>
      </td>
      <td className="py-2.5 pr-3 align-top">
        <code className="text-[13px] font-mono text-muted-foreground">{type}</code>
      </td>
      <td className="py-2.5 pr-3 align-top">
        {required && <Badge variant="outline" className="text-[10px]">required</Badge>}
      </td>
      <td className="py-2.5 text-sm text-muted-foreground">{children}</td>
    </tr>
  )
}

export default function DocsPage() {
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
            <Link href="/docs" className="text-foreground">api</Link>
            {/* <Link href="/agents" className="text-muted-foreground hover:text-foreground transition-colors">agents</Link> */}
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight mb-2">API Documentation</h1>
          <p className="text-muted-foreground">
            JSON API for generating Italian codici fiscali. All endpoints accept <code className="text-[13px] font-mono bg-muted px-1.5 py-0.5 rounded">POST</code> with
            a JSON body. No authentication required.
          </p>
        </div>

        <nav className="border border-border rounded-lg p-4 mb-10 bg-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">On this page</p>
          <ul className="space-y-1 text-sm">
            <li><a href="#single" className="text-primary hover:underline">POST /api/cf/single</a></li>
            <li><a href="#bulk" className="text-primary hover:underline">POST /api/cf/bulk</a></li>
            <li><a href="#birthplace" className="text-primary hover:underline">Birthplace formats</a></li>
            <li><a href="#errors" className="text-primary hover:underline">Error handling</a></li>
          </ul>
        </nav>

        {/* ── POST /api/cf/single ────────────────────────── */}
        <SectionHeading id="single">
          <Badge variant="default" className="text-[11px] font-semibold mr-1">POST</Badge>
          <code className="text-base font-mono">/api/cf/single</code>
        </SectionHeading>

        <p className="text-sm text-muted-foreground mb-4">
          Generate a single codice fiscale. Every field is optional — omitted fields are filled with valid random values.
        </p>

        <h3 className="text-sm font-semibold mb-2">Request body</h3>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="py-2 pr-3">Field</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3"></th>
                <th className="py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              <ParamRow name="name" type="string">First name</ParamRow>
              <ParamRow name="surname" type="string">Last name</ParamRow>
              <ParamRow name="gender" type="string"><code className="font-mono text-xs">&quot;M&quot;</code> or <code className="font-mono text-xs">&quot;F&quot;</code></ParamRow>
              <ParamRow name="day" type="number">Day of birth (1–31)</ParamRow>
              <ParamRow name="month" type="number">Month of birth (1–12)</ParamRow>
              <ParamRow name="year" type="number">Year of birth</ParamRow>
              <ParamRow name="birthplace" type="string">Comune name, codice catastale, or province code. <a href="#birthplace" className="text-primary hover:underline">See formats</a></ParamRow>
              <ParamRow name="birthplaceProvincia" type="string">2-letter province code for disambiguation</ParamRow>
            </tbody>
          </table>
        </div>

        <h3 className="text-sm font-semibold mb-2">Example request</h3>
        <CodeBlock>{`curl -X POST ${BASE}/api/cf/single \\
  -H 'Content-Type: application/json' \\
  -d '{"name":"Mario","surname":"Rossi","gender":"M","day":1,"month":8,"year":1985,"birthplace":"Roma"}'`}</CodeBlock>

        <h3 className="text-sm font-semibold mt-6 mb-2">Success response <Badge variant="outline" className="text-[10px] ml-1">200</Badge></h3>
        <JsonBlock>{`{
  "ok": true,
  "cf": "RSSMRA85M01H501J",
  "data": {
    "name": "Mario",
    "surname": "Rossi",
    "gender": "M",
    "day": 1,
    "month": 8,
    "year": 1985,
    "birthplace": "ROMA",
    "birthplaceProvincia": "RM"
  },
  "sources": {
    "name": "user",
    "surname": "user",
    "gender": "user",
    "day": "user",
    "month": "user",
    "year": "user",
    "birthplace": "user",
    "birthplaceProvincia": "user"
  }
}`}</JsonBlock>
        <p className="text-xs text-muted-foreground mt-2 mb-6">
          Each key in <code className="font-mono">sources</code> is <code className="font-mono">&quot;user&quot;</code> (you provided it) or <code className="font-mono">&quot;random&quot;</code> (auto-generated).
        </p>

        <h3 className="text-sm font-semibold mb-2">Fully random</h3>
        <CodeBlock>{`curl -X POST ${BASE}/api/cf/single`}</CodeBlock>
        <p className="text-xs text-muted-foreground mt-2">Returns a valid codice fiscale with all fields randomly generated.</p>

        {/* ── POST /api/cf/bulk ──────────────────────────── */}
        <SectionHeading id="bulk">
          <Badge variant="default" className="text-[11px] font-semibold mr-1">POST</Badge>
          <code className="text-base font-mono">/api/cf/bulk</code>
        </SectionHeading>

        <p className="text-sm text-muted-foreground mb-4">
          Generate up to 1,000 codici fiscali in a single request.
        </p>

        <h3 className="text-sm font-semibold mb-2">Request body</h3>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="py-2 pr-3">Field</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3"></th>
                <th className="py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              <ParamRow name="count" type="number" required>Number of codes to generate (1–1000)</ParamRow>
              <ParamRow name="base" type="CFInput">Default fields applied to every row</ParamRow>
              <ParamRow name="rows" type="CFInput[]">Per-row overrides, merged on top of <code className="font-mono text-xs">base</code></ParamRow>
            </tbody>
          </table>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          If <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">rows</code> is omitted, the endpoint generates <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">count</code> codes
          using <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">base</code> as a template (missing fields filled randomly).
        </p>

        <h3 className="text-sm font-semibold mb-2">Example — random codes</h3>
        <CodeBlock>{`curl -X POST ${BASE}/api/cf/bulk \\
  -H 'Content-Type: application/json' \\
  -d '{"count":5}'`}</CodeBlock>

        <h3 className="text-sm font-semibold mt-6 mb-2">Example — with per-row data</h3>
        <CodeBlock>{`curl -X POST ${BASE}/api/cf/bulk \\
  -H 'Content-Type: application/json' \\
  -d '{
    "count": 3,
    "base": { "birthplace": "RN", "year": 1990 },
    "rows": [
      { "name": "Mario", "surname": "Rossi", "gender": "M" },
      { "name": "Giulia", "surname": "Bianchi", "gender": "F" },
      { "name": "Luca", "surname": "Verdi", "gender": "M" }
    ]
  }'`}</CodeBlock>

        <h3 className="text-sm font-semibold mt-6 mb-2">Response <Badge variant="outline" className="text-[10px] ml-1">200</Badge></h3>
        <JsonBlock>{`{
  "total": 3,
  "succeeded": 3,
  "failed": 0,
  "results": [
    { "index": 0, "result": { "ok": true, "cf": "...", "data": {...}, "sources": {...} } },
    { "index": 1, "result": { "ok": true, "cf": "...", "data": {...}, "sources": {...} } },
    { "index": 2, "result": { "ok": true, "cf": "...", "data": {...}, "sources": {...} } }
  ]
}`}</JsonBlock>
        <p className="text-xs text-muted-foreground mt-2">
          Individual rows that fail don&apos;t block the rest — check each <code className="font-mono">result.ok</code>.
        </p>

        {/* ── Birthplace formats ─────────────────────────── */}
        <SectionHeading id="birthplace">Birthplace formats</SectionHeading>

        <p className="text-sm text-muted-foreground mb-4">
          The <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">birthplace</code> field accepts three formats, automatically detected:
        </p>

        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="py-2 pr-3">Format</th>
                <th className="py-2 pr-3">Example</th>
                <th className="py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-2.5 pr-3 font-medium text-sm">Comune name</td>
                <td className="py-2.5 pr-3"><code className="font-mono text-xs">&quot;Roma&quot;</code>, <code className="font-mono text-xs">&quot;Reggio Emilia&quot;</code></td>
                <td className="py-2.5 text-muted-foreground">Case-insensitive. Use <code className="font-mono text-xs">birthplaceProvincia</code> to disambiguate comuni with the same name.</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2.5 pr-3 font-medium text-sm">Codice catastale</td>
                <td className="py-2.5 pr-3"><code className="font-mono text-xs">&quot;H501&quot;</code>, <code className="font-mono text-xs">&quot;H294&quot;</code></td>
                <td className="py-2.5 text-muted-foreground">4-character code (letter + 3 digits). Always unique.</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2.5 pr-3 font-medium text-sm">Province code</td>
                <td className="py-2.5 pr-3"><code className="font-mono text-xs">&quot;RM&quot;</code>, <code className="font-mono text-xs">&quot;MI&quot;</code>, <code className="font-mono text-xs">&quot;RN&quot;</code></td>
                <td className="py-2.5 text-muted-foreground">2-letter sigla. Resolves to the province capital (capoluogo).</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Errors ─────────────────────────────────────── */}
        <SectionHeading id="errors">Error handling</SectionHeading>

        <p className="text-sm text-muted-foreground mb-4">
          Validation errors return HTTP <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">422</code> with a JSON body:
        </p>

        <JsonBlock>{`{
  "ok": false,
  "field": "birthplace",
  "message": "Comune non trovato: \\"XYZ\\""
}`}</JsonBlock>

        <p className="text-sm text-muted-foreground mt-3 mb-2">Possible <code className="font-mono text-xs">field</code> values:</p>
        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-0.5 mb-4">
          <li><code className="font-mono text-xs">birthplace</code> — comune not found</li>
          <li><code className="font-mono text-xs">date</code> — invalid date combination</li>
          <li><code className="font-mono text-xs">name</code> / <code className="font-mono text-xs">surname</code> — invalid characters</li>
          <li><code className="font-mono text-xs">gender</code> — value other than M/F</li>
        </ul>

        <p className="text-sm text-muted-foreground mb-4">
          For the bulk endpoint, the request itself returns <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">400</code> if <code className="font-mono text-xs">count</code> is
          missing or exceeds 1000. Individual row errors are embedded in the response array (HTTP 200).
        </p>

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
