# LifeLink — Blood Donation Management System

A modern, responsive blood-donation platform for connecting donors, patients, hospitals and blood banks. Built with React, TypeScript, Tailwind CSS and Radix UI, using a claymorphism design theme (red, white and light gray).

## Features

- **Home page** — hero, impact stats, why-donate section, how-it-works, emergency request form, testimonials
- **Donor registration** — form with validation, eligibility confirmation, availability toggle
- **Find blood** — search by blood group, city, units, urgency + availability filters
- **Blood requests** — raise requests, track them on a live board, approval workflow
- **Blood bank inventory** — group cards with low/critical warnings and facility-wise stock table
- **Hospitals directory** — search, city filter, emergency-only filter, detail dialog
- **Donor dashboard** — profile, eligibility timeline, donation history, log donation
- **Admin dashboard** — stats, donors/inventory/requests/hospitals/users management tables
- **Login / register** — demo accounts with role-based routing (donor/recipient/hospital/admin)

## Local development

```bash
npm install
npm run dev
```

Then open `http://localhost:5173`.

## Build for GitHub Pages

This project is not a plain multi-page static site. It ships as a client-side SPA plus a prerendered HTML shell for the public-facing routes, so it can be deployed to GitHub Pages while still working as an interactive app.

To produce a static export with a Pagefind search index:

```bash
npm install -D pagefind
node build_static.mjs
```

After that, the `dist/` folder is ready to upload to GitHub Pages.

### Deploy from a GitHub repository

You can publish the `dist/` folder in one of two ways:

- **Deploy from a branch:**
  1. Push the repo to GitHub.
  2. Go to **Settings > Pages**.
  3. Under **Source**, choose *Deploy from a branch*.
  4. Select the branch and folder that contains `dist/index.html` (or `dist/` if you committed the build output).
  5. Save.

- **Deploy with GitHub Actions (recommended):**
  1. Push the repo to GitHub.
  2. Activate GitHub Pages in **Settings > Pages**.
  3. Set the source to **GitHub Actions**.
  4. The workflow in `.github/workflows/static.yml` will build the static export and deploy it.

If your repository name is `<owner>/<repo>`, the site will be available at:
`https://<owner>.github.io/<repo>/`

For a user/org site stored in `<owner>.github.io`, it will be available at:
`https://<owner>.github.io/`

## Demo accounts

All demo accounts use the same password: `demo1234`

- `admin@lifelink.in`
- `donor@lifelink.in`
- `recipient@lifelink.in`
- `hospital@lifelink.in`

## Tech stack

- React 19
- TypeScript
- React Router
- Tailwind CSS 4
- Radix UI
- Framer Motion
- Sonner toasts
- Pagefind (static search, optional)

## Important note

This is a demo application with sample data. Blood availability and requests are illustrative and should not be used for real medical decisions.
