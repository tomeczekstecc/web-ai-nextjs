# Validation API Contract

## GET /api/wizard-demo/validate

**Purpose**: Returns server-side validation result for the wizard form.

**When called**: Automatically by `WizardProvider` when the user enters a page with `isSummaryPage: true`.

**Method**: GET

**Response — validation errors present (422)**:
```json
{
  "error": {
    "tytul": ["Tytuł jest wymagany i musi mieć co najmniej 3 znaki."]
  },
  "warning": {
    "opis": ["Opis jest bardzo krótki. Rozważ dodanie więcej szczegółów."]
  },
  "dicts_msg": {
    "error": {
      "formularz": ["Formularz zawiera błędy, które muszą zostać poprawione przed zapisem."]
    },
    "warning": {}
  }
}
```

**Response — no errors (200)**:
```json
{
  "error": {},
  "warning": {},
  "dicts_msg": { "error": {}, "warning": {} }
}
```

**Notes**:
- Keys in `error` and `warning` are bare field names matching `FieldMeta.name` in the mapping.
- This contract is fulfilled by `createWizardValidationHandler` in `src/mocks/handlers/wizard.ts`.
- The 422 status triggers `WizardProvider` to treat the response as a validation failure.
- A 200 response is treated as a passing validation (no errors).
