# Key API endpoints you will likely use:

- `GET /v3/companies` — list your companies

- `GET /v3/content` — list products (the hotel's content library)

- `POST /v3/content` — create a new product in the content library

- `PUT /v3/content` — update an existing product (title, description, images)

- `POST /v3/proposals` — create a proposal

- `GET /v3/proposals/{uuid}` — fetch a proposal

- `GET /v3/proposal-search` — search proposals

All requests use `Authorization: Bearer <YOUR_API_KEY>` and `Content-Type: application/json` against `https://api.proposales.com`