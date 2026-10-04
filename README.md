# CareerFlow by Adhu Purze

Student placement CRM based on the supplied CareerFlow screenshots. Each student portal is backed by a dedicated MongoDB database. The connected database retains a student registry; individual profile, application, and CRM records live in the student's database. The web app and Express API are separate workspaces.

## Run locally

1. Install Node.js 20+ and MongoDB Atlas or a local MongoDB instance.
2. Copy `apps/api/.env.example` to `apps/api/.env` and set `MONGODB_URI` (the supplied local Atlas credential file is already configured in `apps/api/.env` in this workspace).
3. Run `pnpm install`, then `pnpm dev`.
4. Open `http://localhost:3000`.

The frontend uses `NEXT_PUBLIC_API_URL` (default `http://localhost:4000/api`). The API refuses writes when MongoDB is not connected and reports a useful service-unavailable response. A student portal is created when the student submits their name on the welcome screen; the API provisions a database named `careerflow_<student-name>_<id-suffix>`. The active profile selection is remembered in the browser so different students can switch portals on that browser.

## Structure

* `apps/web` — Next.js 15, React 19, TypeScript dashboard and feature modules.
* `apps/api` — Express, TypeScript, Mongoose, validation, pagination, REST resources, and per-student GridFS file storage.
* `apps/api/src/modules` — collection schemas and resource metadata for the student CRM.

## API

Every resource is stored in the selected student's database and linked by `studentId`: `/api/students/:studentId/{education,skills,projects,experience,internships,certificates,achievements,applications,resumes,github,roadmaps,interviews,learning,calendar,settings}`. Each supports paginated GET, POST, GET by id, PUT, and DELETE. `GET /api/students/:id` returns the student; `PUT` updates the profile; `GET /api/dashboard/:studentId` returns live counts and profile-derived readiness. `GET /api/events` streams create/update/delete notifications as Server-Sent Events; open pages refresh their live data when records change. `GET /api/health` reports database connectivity.

Student photos and application proofs are uploaded in 512 KB chunks, assembled into GridFS in that student's own MongoDB database, and listed/downloaded through the student-scoped `/api/students/:studentId/files` routes. Photos allow JPG, PNG, or WebP up to 6 MB; proofs allow PDF, JPG, PNG, or WebP up to 20 MB each. A student must provide a profile photo, 10th grade marksheet, 12th grade or diploma marksheet, semester marksheet, college ID, and resume to submit the application for review.

Create the initial student through **Student Profile → Create profile**. The interface presents onboarding guidance when no profile exists.

## Production notes

## Deploy both apps to Vercel

The web app and Express API are two Vercel projects in this pnpm monorepo:

1. Import this repository into Vercel and create a **web** project with Root Directory `apps/web` and the Next.js framework preset.
2. Create a second **API** project from the same repository with Root Directory `apps/api`. Keep the Express framework detection and the default output settings; the API exports its Express app for Vercel Functions and starts a local listener only outside Vercel.
3. Set `NEXT_PUBLIC_API_URL` in the web project's Production, Preview, and Development environments to the API project's HTTPS URL ending in `/api`, for example `https://your-api.vercel.app/api`.
4. Set `MONGODB_URI` in the API project's environments to the Atlas connection string, and set `CORS_ORIGIN` to the exact web project's HTTPS origin (no path). Keep database credentials out of Git.
5. Deploy the API first, set its URL in the web project, and redeploy the web project. Verify `https://your-api.vercel.app/api/health` reports a connected database.

Uploads use small separate requests because Vercel Functions limit request and response payloads; the app sends 512 KB chunks instead of putting a whole proof in one request. Vercel documents a 4.5 MB Function payload ceiling and recommends splitting larger uploads into multiple requests. [Express on Vercel](https://vercel.com/docs/frameworks/backend/express) · [Vercel Function payload limits](https://vercel.com/docs/errors/FUNCTION_PAYLOAD_TOO_LARGE) · [Vercel monorepos](https://vercel.com/docs/monorepos)

Before public use, add authenticated student sign-in and API authorization; the current browser profile selector and student IDs are not a security boundary. Also configure HTTPS, restrictive `CORS_ORIGIN`, MongoDB permissions and network/IP access, backups, secret rotation, and structured logging.
