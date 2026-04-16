## MongoDB Backend Setup

1. Copy `.env.example` to `.env`.
2. Update `MONGODB_URI` if your MongoDB is remote or uses auth.

If you don't already have MongoDB running locally, start it with Docker:

```bash
cd backend
docker compose up -d
```

3. Install dependencies:

```bash
cd backend
npm install
```

4. Start API server:

```bash
npm start
```

Quick full run order:

1. `docker compose up -d` (MongoDB)
2. `npm install` (first time only)
3. `npm start` (backend + static site)
4. Open `http://localhost:4000/Sponsee/Log%20in/sponsee_signup.html`

The server runs on `http://localhost:4000` and provides both:

- Static website hosting from the project root
- MongoDB API endpoints

Open pages through the backend (not file://), for example:

- `http://localhost:4000/Sponsee/Log%20in/sponsee_signup.html`
- `http://localhost:4000/Sponsee/Log%20in/sponsee_payment_verification.html`

API endpoints:

- `GET /api/health`
- `GET /api/payment-verification/:id`
- `PUT /api/payment-verification/:id`
- `POST /api/sponsee/signup`
- `GET /api/sponsee/signup/:phone`

The Sponsee signup and payment verification pages are wired to this API.
