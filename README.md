# Fiscalino

Italian Codice Fiscale generator with a web UI and a JSON API. Built with Next.js.

## Getting started

```bash
pnpm install
pnpm dev        # https://fiscalino.vercel.app
```

## API

All endpoints accept `POST` with a JSON body and return JSON.

### `POST /api/cf/single`

Generate a single codice fiscale. Every field is optional — omitted fields are filled with random values.

#### Request body

| Field                | Type     | Description                                                                 |
| -------------------- | -------- | --------------------------------------------------------------------------- |
| `name`               | `string` | First name                                                                  |
| `surname`            | `string` | Last name                                                                   |
| `gender`             | `string` | `"M"` or `"F"`                                                              |
| `day`                | `number` | Day of birth (1–31)                                                         |
| `month`              | `number` | Month of birth (1–12)                                                       |
| `year`               | `number` | Year of birth                                                               |
| `birthplace`         | `string` | Comune name (`"Roma"`), codice catastale (`"H501"`), or province code (`"RM"`) |
| `birthplaceProvincia`| `string` | 2-letter province code for disambiguation (e.g. `"RM"`)                     |

**`birthplace` accepts three formats:**

- **Comune name** — `"Roma"`, `"Rimini"`, `"Reggio Emilia"`
- **Codice catastale** — 4-character code like `"H501"` (Roma) or `"H294"` (Rimini)
- **Province code** — 2-letter sigla like `"RM"`, `"RN"`, `"MI"` — automatically resolved to the province capital (capoluogo)

#### Success response (200)

```json
{
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
}
```

Each key in `sources` is either `"user"` (you provided it) or `"random"` (auto-generated).

#### Error response (422)

```json
{
  "ok": false,
  "field": "birthplace",
  "message": "Comune non trovato: \"XYZ\""
}
```

#### Examples

Generate a fully random codice fiscale:

```bash
curl -X POST https://fiscalino.vercel.app/api/cf/single
```

Provide all fields:

```bash
curl -X POST https://fiscalino.vercel.app/api/cf/single \
  -H 'Content-Type: application/json' \
  -d '{"name":"Mario","surname":"Rossi","gender":"M","day":1,"month":8,"year":1985,"birthplace":"Roma"}'
```

Using a province code as birthplace:

```bash
curl -X POST https://fiscalino.vercel.app/api/cf/single \
  -H 'Content-Type: application/json' \
  -d '{"name":"Mario","surname":"Rossi","gender":"M","day":1,"month":8,"year":1985,"birthplace":"RM"}'
```

---

### `POST /api/cf/bulk`

Generate multiple codici fiscali in one request (max 1000).

#### Request body

| Field   | Type       | Description                                                              |
| ------- | ---------- | ------------------------------------------------------------------------ |
| `count` | `number`   | **Required.** Number of codes to generate (1–1000).                       |
| `base`  | `CFInput`  | Optional defaults applied to every row.                                   |
| `rows`  | `CFInput[]`| Optional per-row overrides (merged on top of `base`). At most `count` rows are used. |

If `rows` is omitted, the endpoint generates `count` codes using `base` (with random fill for missing fields).

#### Response (200)

```json
{
  "total": 3,
  "succeeded": 3,
  "failed": 0,
  "results": [
    {
      "index": 0,
      "result": { "ok": true, "cf": "...", "data": { ... }, "sources": { ... } }
    },
    {
      "index": 1,
      "result": { "ok": true, "cf": "...", "data": { ... }, "sources": { ... } }
    },
    {
      "index": 2,
      "result": { "ok": false, "field": "birthplace", "message": "Comune non trovato: \"XYZ\"" }
    }
  ]
}
```

Individual rows that fail don't block the rest — check each `result.ok`.

#### Examples

Generate 5 fully random codes:

```bash
curl -X POST https://fiscalino.vercel.app/api/cf/bulk \
  -H 'Content-Type: application/json' \
  -d '{"count":5}'
```

Generate 3 codes for people born in Rimini, with individual names:

```bash
curl -X POST https://fiscalino.vercel.app/api/cf/bulk \
  -H 'Content-Type: application/json' \
  -d '{
    "count": 3,
    "base": { "birthplace": "RN", "year": 1990 },
    "rows": [
      { "name": "Mario", "surname": "Rossi", "gender": "M" },
      { "name": "Giulia", "surname": "Bianchi", "gender": "F" },
      { "name": "Luca", "surname": "Verdi", "gender": "M" }
    ]
  }'
```

## CSV import

The web UI includes a CSV import tab. Column headers are auto-mapped using common aliases:

| CSV column(s)                                        | Maps to               |
| ---------------------------------------------------- | --------------------- |
| `nome`, `name`, `first_name`                         | name                  |
| `cognome`, `surname`, `last_name`                    | surname               |
| `sesso`, `gender`, `sex`                             | gender                |
| `giorno`, `day`                                      | day                   |
| `mese`, `month`                                      | month                 |
| `anno`, `year`                                       | year                  |
| `data_nascita`, `data`, `date`, `dob`                | date (auto-parsed)    |
| `comune`, `birthplace`, `luogo_nascita`, `citta`     | birthplace            |
| `provincia`, `province`, `prov`                      | birthplaceProvincia   |
| `codice_fiscale`, `cf`                               | existing CF (re-check)|

The `comune` column accepts the same three formats as the API: full name, codice catastale, or province code.
