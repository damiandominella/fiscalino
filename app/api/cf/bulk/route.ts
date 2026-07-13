import { NextRequest, NextResponse } from "next/server"
import { generateCF } from "@/lib/cf-generator"
import type { CFInput, BulkResponse } from "@/lib/cf-types"

const MAX_COUNT = 1000

function sanitizeInput(raw: Record<string, unknown>): CFInput {
  return {
    name: typeof raw.name === "string" && raw.name ? raw.name : undefined,
    surname: typeof raw.surname === "string" && raw.surname ? raw.surname : undefined,
    gender: raw.gender === "M" || raw.gender === "F" ? raw.gender : undefined,
    day: raw.day ? Number(raw.day) : undefined,
    month: raw.month ? Number(raw.month) : undefined,
    year: raw.year ? Number(raw.year) : undefined,
    birthplace: typeof raw.birthplace === "string" && raw.birthplace ? raw.birthplace : undefined,
    birthplaceProvincia: typeof raw.birthplaceProvincia === "string" && raw.birthplaceProvincia ? raw.birthplaceProvincia : undefined,
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))

  const rawCount = Number(body.count)
  if (!Number.isInteger(rawCount) || rawCount < 1) {
    return NextResponse.json({ ok: false, message: "count deve essere un intero >= 1" }, { status: 400 })
  }
  if (rawCount > MAX_COUNT) {
    return NextResponse.json({ ok: false, message: `count non può superare ${MAX_COUNT}` }, { status: 400 })
  }

  const base: CFInput = body.base ? sanitizeInput(body.base as Record<string, unknown>) : {}

  // If rows are provided, use them (merged with base), otherwise repeat base N times
  const inputs: CFInput[] = Array.isArray(body.rows) && body.rows.length > 0
    ? body.rows.slice(0, rawCount).map((row: Record<string, unknown>) => ({
        ...base,
        ...sanitizeInput(row),
      }))
    : Array.from({ length: rawCount }, () => ({ ...base }))

  const results: BulkResponse["results"] = inputs.map((input, index) => ({
    index,
    result: generateCF(input),
  }))

  const succeeded = results.filter((r) => r.result.ok).length
  const failed = results.length - succeeded

  return NextResponse.json({
    results,
    total: results.length,
    succeeded,
    failed,
  } satisfies BulkResponse)
}
