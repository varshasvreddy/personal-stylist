# Atelier Me

A personal stylist. Create an account, add the clothes you own, say where you are going, and get outfits made only
from your own closet, with a hair idea for each. Rate looks, pick one to wear, then post a photo and get a review.

- **Backend:** Django 6 + Django REST Framework, token login, SQLite, Pillow for photos, Claude through the `anthropic` SDK
- **Frontend:** React 18 + Vite + React Router

```
atelier-fullstack/
  backend/
    manage.py  requirements.txt  .env.example
    atelier/                 settings, urls
    stylist/
      models.py              Profile, Garment, Look, LookItem
      catalog.py             shelves, colours, occasions, hair ideas (also served at /api/meta/)
      engine.py              built-in styling rules: colour, dress code, weather, saree, quick mix
      ai.py                  Claude: looks, photo review, photo reading, closet gaps
      images.py              upload checks, rotation fix, resizing
      serializers.py  views.py  urls.py  admin.py  tests.py
  frontend/
    package.json  vite.config.js  index.html  public/_redirects
    src/
      api.js                 fetch wrapper with the login token
      AppContext.jsx         signed-in user, closet, options from the server
      pages/                 Auth, Closet, Style, Lookbook, Profile
      components/            Layout, Band, Tile, GarmentIcon, LookCard, Stars, AddPiece
      styles.css
```

## Run it locally

You need Python 3.11+ and Node 20+. Use two terminals.

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser      # optional, for /admin/
python manage.py runserver            # http://127.0.0.1:8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev                           # http://localhost:5173
```

Open http://localhost:5173. Vite forwards `/api` and `/media` to Django, so the browser sees one site.

### Turn on Claude
```bash
export ANTHROPIC_API_KEY=sk-ant-...      # PowerShell: $env:ANTHROPIC_API_KEY="sk-ant-..."
python manage.py runserver
```
With a key: Style me and Adjust use Claude, "Fill in from photo" reads a clothing photo, and photo reviews work.
Without a key the app runs on the built-in rules and hides the Claude-only buttons. If Claude errors, Style me
falls back to the rules and says so. Calls are rate limited per user (`THROTTLE_AI`, default 30/min).

## Tests
```bash
cd backend && python manage.py test        # 19 tests
cd frontend && npm run build
```
The Claude tests use a stand-in client. The code that calls the real API has not been run against it, so try one
Style me, one photo reading and one review with your key before relying on it.

## API (all under `/api/`, token in `Authorization: Token <key>`)

| Method | Path | What it does |
|---|---|---|
| GET | `meta/` | Shelves, colours, occasions and choices; `ai_available` (public) |
| POST | `auth/register/` | `{name, email, password}` returns `{token, user}` |
| POST | `auth/login/` | `{email, password}` returns `{token, user}` |
| POST | `auth/logout/` | Deletes the token |
| GET, PATCH | `auth/me/` | Profile: name, styles, fit, hair, colours loved and avoided, undertone, notes |
| GET, POST | `garments/` | Your closet. POST is multipart with an optional `photo` |
| PATCH, DELETE | `garments/{id}/` | Edit or remove a piece |
| POST | `garments/analyze/` | Photo in, suggested name, shelf, colour and dress code out (needs Claude) |
| POST | `styling/suggest/` | `{occasion, details, temperature, rain, mode: auto or rules, adjust?, previous?}` creates looks |
| GET | `styling/gaps/` | What the closet is missing |
| GET | `looks/?chosen=1` | Your lookbook |
| PATCH | `looks/{id}/` | `{rating: 0-5}` or `{chosen: true}` |
| POST | `looks/{id}/photo/` | Upload how you wore it |
| POST | `looks/{id}/review/` | Claude reviews the photo (needs Claude) |

Every list and object is limited to the signed-in user; another user's id returns 404.

## Deploy

**Frontend (Netlify or similar).** `cd frontend && VITE_API_BASE=https://your-api.example npm run build`, then publish
`frontend/dist`. `public/_redirects` makes page refreshes work.

**Backend (Render, Railway, Fly, a VPS...).**
```bash
pip install -r requirements.txt
python manage.py migrate && python manage.py collectstatic --noinput
gunicorn atelier.wsgi
```
Set `DJANGO_DEBUG=0`, a real `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS` (your API host),
`CORS_ALLOWED_ORIGINS` (your frontend URL) and `ANTHROPIC_API_KEY`.

Things to handle before real users:
- **Photos.** `urls.py` serves `/media/` only when `DJANGO_DEBUG=1`. In production point `DJANGO_MEDIA_ROOT` at a
  persistent disk served by your web server, or switch to object storage (django-storages).
- **Database.** SQLite is fine for one server with a persistent disk. For several servers use Postgres.
- **Tokens.** Login tokens do not expire until logout. Add expiry or JWT if you need it.
- **Email.** There is no password reset or email check yet.
