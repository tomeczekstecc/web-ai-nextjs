# HTTP Wire Contract — File Resource

**Feature**: 019-upload-component
**Audience**: Laravel backend team (frontend-decoupled per constitution §V)
**Mock implementation**: `src/mocks/handlers/task-files.ts`

This contract is what the frontend `UploadAdapter<TMeta>` calls and what
the MSW mock implements. The real Laravel backend MUST mirror it so the
frontend can swap from mock to real with only a base-URL change.

URLs below use the demo's `tasks` resource (`/api/tasks/{taskId}/files`).
Future consumers will use parallel URLs under their own resource
(`/api/applications/{id}/files`, etc.) — the *shape* of each endpoint is
identical.

---

## Conventions

- All requests carry the standard project auth headers (the Laravel team's
  existing scheme — `Authorization: Bearer …` or session cookie; out of
  scope for this contract).
- All responses are `application/json` unless explicitly stated.
- Field names in JSON bodies use `camelCase`.
- Timestamps are ISO-8601 strings (`2026-05-22T14:30:00Z`).
- Dates inside metadata are `YYYY-MM-DD` (no time component).

---

## 1. List stored files

```
GET /api/tasks/{taskId}/files
```

**Response 200**:
```json
[
  {
    "id": "f-1",
    "name": "wniosek.pdf",
    "size": 184320,
    "uploadedAt": "2026-05-10T09:12:00Z",
    "metadata": {
      "category": "pdf",
      "description": "Wniosek inicjalny",
      "pageCount": 4,
      "validFrom": "2026-05-10",
      "isConfidential": false
    }
  }
]
```

Empty list returns `[]` (not 404).

**Response 4xx/5xx**: standard error envelope (see §6).

---

## 2. Upload a file with metadata

```
POST /api/tasks/{taskId}/files
Content-Type: multipart/form-data; boundary=…
```

Two parts:

1. **`file`** — the binary, with `Content-Disposition: form-data;
   name="file"; filename="<original>"` and the file's native Content-Type
   (e.g. `application/pdf`).
2. **`metadata`** — a JSON blob, with `Content-Disposition: form-data;
   name="metadata"` and `Content-Type: application/json`. The body is the
   merged user metadata + constant metadata (e.g.):
   ```json
   { "category": "pdf", "description": null, "pageCount": null,
     "validFrom": null, "isConfidential": false, "taskId": 42 }
   ```

**Response 201** (preferred) or **200**:
A complete `StoredFile<TMeta>` shape — same as one element of the list
response:
```json
{
  "id": "f-3",
  "name": "scan.pdf",
  "size": 256000,
  "uploadedAt": "2026-05-22T14:30:00Z",
  "metadata": { "category": "scan", "description": null,
    "pageCount": null, "validFrom": null, "isConfidential": true }
}
```

**Backend contract for cancellation (FR-009 / SC-004b)**: if the request
is aborted by the client before the server has committed the write, the
server MUST NOT persist a partial or final stored file. Implementation
note for Laravel: write to a temporary location, commit (move + DB insert)
only after the full request body has been received and validated.

---

## 3. Update metadata

```
PUT /api/tasks/{taskId}/files/{fileId}
Content-Type: application/json
```

Body: the full new metadata + constant metadata (same shape as the
`metadata` part of upload). No file part — the binary is untouched.

```json
{ "category": "scan", "description": "Aktualizacja opisu",
  "pageCount": 12, "validFrom": "2026-05-22", "isConfidential": true,
  "taskId": 42 }
```

**Response 200**: the updated `StoredFile<TMeta>`.

---

## 4. Delete

```
DELETE /api/tasks/{taskId}/files/{fileId}
```

**Response 204** (no body). The backend MUST be idempotent: a second
delete of the same id returns 204 (or 404 — the client treats both as
"already gone").

---

## 5. Download

```
GET /api/tasks/{taskId}/files/{fileId}/download
```

**Response 200**:
- Body: the file bytes.
- `Content-Type`: the file's stored content type (`application/pdf`,
  `image/jpeg`, …) — best-effort; the client uses the filename for
  download UX, not the content type.
- `Content-Disposition: attachment; filename="<original>"` — included
  for completeness but **not relied upon** by the client (per Q6 the
  client uses `<a download>` and the StoredFile.name from the cached
  list; this header is for users who hit the URL directly).

The client buffers the response into a Blob and triggers download
client-side. Streamed downloads are out of scope for v1.

---

## 6. Error envelope

All non-2xx responses use a consistent envelope:

```json
{
  "message": "Plik odrzucony",
  "errors": {
    "metadata.category": "Nieobsługiwana kategoria",
    "metadata.pageCount": "Wartość musi być dodatnia"
  }
}
```

- `message` (required): human-readable, Polish, suitable for inline
  display on the row.
- `errors` (optional): present only for 422 validation responses. Keys
  use dot notation. Keys prefixed `metadata.<field>` are routed by the
  client to the matching `MetadataField`. Other keys (e.g. `file`) stay
  in the row-level message.

**Status code conventions**:

| Code | When | Client UX |
|------|------|-----------|
| 200/201 | Success | Apply optimistic write, then reconcile |
| 204 | Successful delete | Apply optimistic delete |
| 400 | Malformed request (client bug) | `UploaderError.validation` with generic message |
| 401/403 | Auth failure | `UploaderError.server`; let app-level interceptor handle redirect |
| 404 | Resource not found (e.g. deleted concurrently) | `UploaderError.server`; invalidate list |
| 413 | Payload too large (backend max-size > client max-size) | `UploaderError.validation` with file part error |
| 422 | Validation failure | `UploaderError.validation` with optional `fieldErrors` |
| 5xx | Server error | `UploaderError.server`, retry button shown |

---

## 7. Mock implementation notes

`src/mocks/handlers/task-files.ts` implements all five endpoints against
an in-memory `Map<taskId, StoredFile<TaskFileMeta>[]>` in
`src/mocks/data/task-files.ts`. Behaviors:

- **List**: returns the array for the task; ~150 ms simulated latency.
- **Upload**: ~300 ms + 1 ms/KB latency (capped at 2 s) before responding,
  so progress bars animate visibly. Generates a UUID for `id` and stamps
  `uploadedAt` to `new Date().toISOString()`. Appends to the in-memory
  Map. Aborts return without writing.
- **Edit**: ~150 ms latency; updates the matching entry; 404 if absent.
- **Delete**: ~150 ms latency; removes from the Map; 204.
- **Download**: returns a `new Blob(['mock content for ', filename])`
  with `Content-Disposition` set; client never reads it.
- **`?fail=true` mode**: reads `window.location.search`; when active,
  every 3rd upload returns 422 with
  `{ message: 'Plik odrzucony', errors: { 'metadata.category': 'Nieobsługiwana kategoria' } }`
  to demonstrate field-level error routing.
- **Seeds**: two stored files for `taskId === 1` matching the demo
  configuration in `spec.md` → US6 → "Demo configuration":
  1. `f-1` — `wniosek.pdf`, 180 KB, pdf category, with description and
     pageCount.
  2. `f-2` — `skan-dowodu.jpg`, 600 KB, scan category, confidential.

---

## 8. Future-compatibility notes for the Laravel team

- The `metadata` JSON part is the schema's source of truth on the wire —
  the per-resource Laravel `FormRequest` should validate that JSON
  (e.g. via `json_decode($request->input('metadata'), true)` + a rules
  array) rather than treating each metadata key as a separate form field.
- `constantMetadata` (e.g. `taskId`) arrives inside the JSON body even
  though it's also encoded in the URL; the backend SHOULD validate the
  two agree and reject mismatches as 422.
- The transactional contract from §2 is the only non-obvious requirement;
  please confirm explicitly during handoff.
- Filename collisions are NOT a backend concern unless your domain
  requires uniqueness — the frontend allows duplicates silently (Q7).
