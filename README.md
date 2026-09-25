# TalentX backend

A real Node.js + Express + MongoDB (Mongoose) API for the TalentX frontend.
Signing up or logging in from the frontend calls this server, which reads
and writes actual documents in MongoDB — visible in MongoDB Compass.

## What you need on your machine

1. **Node.js** v18 or later — `node -v` to check. Get it from nodejs.org if not installed.
2. **A running MongoDB server**, either:
   - **Local**: install MongoDB Community Server (mongodb.com/try/download/community), then start it. On most systems it starts automatically as a service; otherwise run `mongod` in a terminal.
   - **Cloud (no local install)**: create a free cluster at MongoDB Atlas (mongodb.com/cloud/atlas) and copy its connection string.
3. **MongoDB Compass** connected to that same server (you said you already have this).

## Setup

```bash
cd talentx-backend
npm install
cp .env.example .env
```

Open `.env` and check:

```
MONGODB_URI=mongodb://127.0.0.1:27017/talentx
JWT_SECRET=replace-this-with-a-long-random-string
PORT=5000
ADMIN_EMAIL=admin@talentx.edu
ADMIN_DOB=1988-05-02
```

- If you're using **local MongoDB**, the default `MONGODB_URI` above is usually correct as-is.
- If you're using **Atlas**, replace it with the connection string Atlas gives you (looks like `mongodb+srv://user:password@cluster.mongodb.net/talentx`).
- Change `JWT_SECRET` to any long random string.

Start the server:

```bash
npm run dev
```

You should see:

```
MongoDB connected → database "talentx"
TalentX API listening on http://localhost:5000
```

If you instead see a connection error, MongoDB isn't reachable yet — start `mongod`, or double-check the Atlas connection string (including that your current IP is allow-listed in Atlas).

## Confirming it in MongoDB Compass

1. Open Compass, connect using the **same URI** as `MONGODB_URI`.
2. You won't see a `talentx` database yet — MongoDB only creates it once something is written.
3. Go back to the TalentX site, click **Create Account**, fill in the form, submit.
4. In Compass, refresh — a `talentx` database now exists with a `students` collection containing the document you just created (name, email, dob, a bcrypt password hash, empty skills/courses/etc.).
5. Log out and log back in with that same email + date of birth — it reads that same document back.

## Connecting the frontend

The frontend already points at `http://localhost:5000/api` and detects automatically whether this server is running:

- **Running** → Create Account / Log In write to and read from MongoDB, and the login popup shows "Connected — accounts save to MongoDB."
- **Not running** → it falls back to in-memory demo data automatically, and shows "No backend found — using local demo data."

One important caveat: if you're viewing the frontend inside Claude's in-chat preview panel, browser sandboxing may block it from reaching `http://localhost:5000` on your machine even with the server running. The reliable way to test the full flow is to run the frontend locally too, outside that preview — e.g. drop `portal.jsx` into a small Vite React app (`npm create vite@latest talentx-frontend -- --template react`, then replace `App.jsx` with `portal.jsx`'s contents and `npm install lucide-react recharts`), and open it at `http://localhost:5173` in your own browser alongside the backend at `http://localhost:5000`.

## Security notes (read before using this anywhere real)

- Using date of birth as a password is inherently weak — it's guessable from a student's own profile data. This matches the spec you asked for, but a real deployment should use a proper password or an OTP sent to the college email instead.
- The single admin account here is a hardcoded email/DOB pair in `.env` for demo purposes. A real system would have its own `User` collection with hashed passwords and proper account management.
- CORS is currently wide open (`app.use(cors())`) so the demo frontend can reach it from anywhere. Lock this down to your actual frontend's origin before deploying.
