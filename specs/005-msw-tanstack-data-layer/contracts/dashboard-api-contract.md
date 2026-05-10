# API Contract: Dashboard Domain

These endpoints are intercepted by the MSW browser worker in development.
In production they will be fulfilled by the Laravel backend.

---

## GET /api/dashboard/review-items

Returns the list of document review items for the main dashboard table.

**Response shape**:

```json
{
  "items": [
    {
      "id": 1,
      "header": "string",
      "type": "string",
      "status": "string",
      "target": "string",
      "limit": "string",
      "reviewer": "string"
    }
  ]
}
```

**Notes**:
- No pagination parameters for now (loads all items)
- `status` values: `"In Process"` | `"Done"`

---

## GET /api/dashboard/chart

Returns time-series data points for the area chart.

**Response shape**:

```json
{
  "points": [
    {
      "date": "2024-04-01",
      "desktop": 222,
      "mobile": 150
    }
  ]
}
```

**Notes**:
- Dates are `YYYY-MM-DD` strings
- Values are non-negative integers

---

## GET /api/dashboard/queue

Returns the priority queue items shown in the review queue panel.

**Response shape**:

```json
{
  "items": [
    {
      "id": "string",
      "name": "string",
      "owner": "string",
      "priority": "string"
    }
  ]
}
```

**Notes**:
- `priority` uses Polish labels: `"Wysoki"`, `"Niski"`, etc.
