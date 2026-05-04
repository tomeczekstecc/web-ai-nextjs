# Landing Page Content API

## Konfiguracja
- Zmienna srodowiskowa backendu: `API_URL`
- Przyklad lokalny: `API_URL=http://127.0.0.1:8000`
- Frontend korzysta z tej konfiguracji wylacznie po stronie serwera

## Endpoint
- Metoda: `GET`
- Sciezka: `/api/public/landing-page`
- Cel: pobranie tresci strony startowej oraz podstawowych statystyk

## Odpowiedz 200
```json
{
  "hero": {
    "eyebrow": "Integracja gotowa na Laravel",
    "title": "Buduj nowoczesny frontend",
    "highlight": "szybciej i pewniej.",
    "description": "Minimalny, elegancki punkt startowy dla produktu w Next.js.",
    "primary_cta_label": "Zacznij juz teraz",
    "primary_cta_href": "#benefits",
    "secondary_note": "Warstwa UI korzysta z server-first API helperow."
  },
  "features": [
    {
      "id": "process",
      "title": "Prosty proces",
      "body": "Jasny formularz i przejrzysta sciezka przejscia od informacji do dzialania."
    }
  ],
  "benefits": [
    "Dofinansowanie realizacji celow edukacyjnych i rozwoju osobistego"
  ],
  "stats": [
    {
      "id": "support-level",
      "value": "7000 zl",
      "label": "Poziom wsparcia"
    }
  ]
}
```

## Odpowiedz bledu
```json
{
  "message": "Opis bledu"
}
```

Frontend normalizuje bledy do postaci:
```ts
type ApiError = {
  code: "API_URL_MISSING" | "NETWORK_ERROR" | "INVALID_JSON" | "INVALID_RESPONSE" | "HTTP_ERROR";
  message: string;
  status: number | null;
  details?: unknown;
};
```
