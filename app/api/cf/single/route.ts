import { NextRequest, NextResponse } from "next/server"
import { generateCF } from "@/lib/cf-generator"
import type { CFInput } from "@/lib/cf-types"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))

  const input: CFInput = {
    name: body.name || undefined,
    surname: body.surname || undefined,
    gender: body.gender === "M" || body.gender === "F" ? body.gender : undefined,
    day: body.day ? Number(body.day) : undefined,
    month: body.month ? Number(body.month) : undefined,
    year: body.year ? Number(body.year) : undefined,
    birthplace: body.birthplace || undefined,
    birthplaceProvincia: body.birthplaceProvincia || undefined,
  }

  const result = generateCF(input)

  if (!result.ok) {
    return NextResponse.json(result, { status: 422 })
  }

  return NextResponse.json(result)
}
