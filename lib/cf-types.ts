export type Gender = "M" | "F"

export interface CFInput {
  name?: string
  surname?: string
  gender?: Gender
  day?: number
  month?: number
  year?: number
  birthplace?: string
  birthplaceProvincia?: string
}

export type FieldSource = "user" | "random"

export interface CFFieldSources {
  name: FieldSource
  surname: FieldSource
  gender: FieldSource
  day: FieldSource
  month: FieldSource
  year: FieldSource
  birthplace: FieldSource
  birthplaceProvincia: FieldSource
}

export interface CFData {
  name: string
  surname: string
  gender: Gender
  day: number
  month: number
  year: number
  birthplace: string
  birthplaceProvincia: string
}

export interface CFSuccess {
  ok: true
  cf: string
  data: CFData
  sources: CFFieldSources
}

export interface CFFailure {
  ok: false
  field?: string
  message: string
}

export type CFResult = CFSuccess | CFFailure

export interface BulkRequest {
  count: number
  base?: CFInput
  rows?: CFInput[]
}

export interface BulkResult {
  index: number
  result: CFResult
}

export interface BulkResponse {
  results: BulkResult[]
  total: number
  succeeded: number
  failed: number
}
