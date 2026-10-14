# TaskFlow — From Zero to Deployed

**Stack:** React (Vite) on **Vercel** · Spring Boot 3 (Java 17) on **Render** · PostgreSQL on **Render**
**Repo layout:** one GitHub repo (monorepo) with two folders: `frontend/` and `backend/`.

```
taskflow/
├── backend/    Spring Boot REST API (+ Dockerfile for Render)
├── frontend/   React + Vite app
└── DEPLOYMENT_GUIDE.md
```

---

## 0. Prerequisites

Install and check each one:

```bash
java -version      # 17 or newer
mvn -v             # Maven 3.9+
node -v            # 18 or newer
npm -v
git --version
```

Accounts needed (all have free tiers): [GitHub](https://github.com), [Render](https://render.com), [Vercel](https://vercel.com).
Tip: sign up to Render and Vercel using **"Continue with GitHub"** — it makes importing the repo one click.

---

## 1. Run it locally first

Unzip `taskflow.zip`, then open **two terminals**.

**Terminal 1 — backend** (uses an in-memory H2 database locally, no setup needed):

```bash
cd taskflow/backend
mvn spring-boot:run
```

Check it: open http://localhost:8080/api/health → `{"status":"UP"}`

**Terminal 2 — frontend:**

```bash
cd taskflow/frontend
npm install
npm run dev
```

Open http://localhost:5173 — add a task, tick it, edit it, delete it. If that works, you're ready to deploy.

---

## 2. Push the project to GitHub

### 2a. Create an empty repo on GitHub
Go to https://github.com/new → name it `taskflow` → **do not** add a README/.gitignore/license (the project already has them) → **Create repository**.

### 2b. Initialise git and push

Run from the `taskflow/` folder (the one containing `backend/` and `frontend/`):

```bash
cd taskflow
git init
git add .
git commit -m "Initial commit: TaskFlow full-stack app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
git push -u origin main
```

> Replace `YOUR_USERNAME`. When pushing over HTTPS, GitHub asks for a **Personal Access Token** instead of a password
> (GitHub → Settings → Developer settings → Personal access tokens). Or use SSH: `git@github.com:YOUR_USERNAME/taskflow.git`.

**Shortcut with GitHub CLI** (instead of 2a + `remote add`):

```bash
gh auth login
gh repo create taskflow --public --source=. --remote=origin --push
```

Refresh the GitHub page — you should see `backend/`, `frontend/` and this guide.

---

## 3. Deploy the database + backend on Render

### 3a. Create the PostgreSQL database
1. Render dashboard → **New +** → **PostgreSQL**.
2. Name: `taskflow-db` · Region: pick the one closest to you (**remember it**) · Plan: **Free**.
3. **Create Database**, wait until status is *Available*.
4. On the database page, open the **Connections** section and note: **Hostname** (use the *Internal* one), **Port** (5432), **Database**, **Username**, **Password**.

### 3b. Create the web service
1. **New +** → **Web Service** → connect your GitHub account → select the `taskflow` repo.
2. Fill in:

| Field | Value |
|---|---|
| Name | `taskflow-api` |
| Region | **Same as the database** |
| Branch | `main` |
| Root Directory | `backend` |
| Runtime / Language | **Docker** (Render detects the `Dockerfile`) |
| Instance type | Free |

3. Under **Advanced** → **Health Check Path**: `/api/health`
4. Under **Environment Variables**, add:

| Key | Value |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<internal-hostname>:5432/<database-name>` |
| `SPRING_DATASOURCE_USERNAME` | *(database username)* |
| `SPRING_DATASOURCE_PASSWORD` | *(database password)* |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` *(temporary — updated in step 5)* |

> ⚠️ The URL must start with `jdbc:postgresql://`. Do **not** paste Render's `postgres://...` connection string directly — Spring can't read that format.

5. Click **Create Web Service**. The first build takes a few minutes (Maven downloads dependencies).
6. When it says **Live**, you get a URL like `https://taskflow-api-xxxx.onrender.com`. Test it:

```
https://taskflow-api-xxxx.onrender.com/api/health     →  {"status":"UP"}
https://taskflow-api-xxxx.onrender.com/api/tasks      →  []
```

**Copy this URL — you need it for Vercel.**

---

## 4. Deploy the frontend on Vercel

1. Vercel dashboard → **Add New…** → **Project** → import the `taskflow` repo.
2. Configure:

| Field | Value |
|---|---|
| Framework Preset | **Vite** (auto-detected) |
| Root Directory | **`frontend`** (click *Edit* and select it) |
| Build Command | `npm run build` (default) |
| Output Directory | `dist` (default) |

3. Expand **Environment Variables** and add:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://taskflow-api-xxxx.onrender.com` *(your Render URL, no trailing slash)* |

4. Click **Deploy**. In about a minute you get `https://taskflow-xxxx.vercel.app`.

> `VITE_` variables are baked in **at build time**. If you change `VITE_API_URL` later, trigger a **Redeploy** in Vercel.

---

## 5. Connect them (CORS) — the step people forget

Right now the browser will block the frontend from calling the backend. Fix:

1. Render → `taskflow-api` → **Environment**.
2. Edit `CORS_ALLOWED_ORIGINS` to your Vercel URL (no trailing slash):

```
https://taskflow-xxxx.vercel.app
```

To also keep local dev working, separate with a comma:

```
https://taskflow-xxxx.vercel.app,http://localhost:5173
```

To also allow Vercel preview deployments, add a wildcard: `https://taskflow-*.vercel.app`.

3. **Save Changes** — Render redeploys automatically.

---

## 6. Verify end-to-end

1. Open your Vercel URL.
2. Add a task → refresh the page → it's still there (stored in PostgreSQL).
3. If the page shows "Could not reach the server", see Troubleshooting below.

---

## 7. Updating the app later

Both platforms **auto-deploy on every push to `main`**:

```bash
git add .
git commit -m "Describe your change"
git push
```

Work on features safely with branches:

```bash
git checkout -b feature/due-dates
# ...edit code...
git add . && git commit -m "Add due dates"
git push -u origin feature/due-dates
# open a Pull Request on GitHub; Vercel gives you a preview URL for it
```

---

## Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| First load is slow (≈30–60 s) | Render's free web services sleep after inactivity. Normal on the free plan. |
| Browser console: *blocked by CORS policy* | `CORS_ALLOWED_ORIGINS` doesn't exactly match your Vercel URL (check `https`, no trailing `/`). |
| Frontend calls `localhost:8080` in production | `VITE_API_URL` not set in Vercel, or you didn't redeploy after adding it. |
| Render logs: *Driver claims to not accept jdbcUrl* | `SPRING_DATASOURCE_URL` doesn't start with `jdbc:postgresql://`. |
| Render logs: *Connection refused / UnknownHost* | Use the database's **Internal** hostname, and make sure the DB and web service are in the **same region**. |
| Render logs: *password authentication failed* | Re-copy username/password from the database's Connections section. |
| Vercel build fails: *No package.json* | Root Directory isn't set to `frontend`. |
| Render build fails: *Dockerfile not found* | Root Directory isn't set to `backend`. |

## Free-tier notes

- Render **free PostgreSQL databases expire 30 days after creation** (per [Render's changelog](https://render.com/changelog/free-postgresql-instances-now-expire-after-30-days-previously-90)). Export your data or upgrade before then; check Render's [free-tier docs](https://render.com/docs/free) for current limits.
- Free web services spin down when idle (see above).

## Ideas to extend the project

- User accounts with Spring Security + JWT
- Due dates and reminders
- Pagination and search (`/api/tasks?q=...`)
- Replace `ddl-auto=update` with Flyway migrations
- Unit tests with JUnit + MockMvc, and Vitest on the frontend
