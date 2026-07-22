# MarketSphereGroup

Online service marketplace platform for **Market Sphere Group (Pty) Ltd** — connecting customers with verified service providers across Botswana.

Live site: [marketspheregroup.com](https://marketspheregroup.com/)  
Legacy GitHub Pages URL: [futurifydesigns.github.io/MarketSphere](https://futurifydesigns.github.io/MarketSphere/)

## Tech Stack

- **Frontend:** React 19 + Vite + TypeScript
- **Routing:** React Router (HashRouter for GitHub Pages)
- **Backend:** Supabase (Auth, PostgreSQL, Storage)
- **Motion:** Lenis smooth scroll, GSAP ScrollTrigger, Framer Motion
- **Hosting:** GitHub Pages

## Features

### Public Website
- Homepage with day→night scroll narrative
- About, Services, Contact, FAQ pages
- Browse & search verified providers
- Individual provider profiles with enquiry form

### Customer
- Register / login
- Search by category and location
- Submit service enquiries
- Save favourite providers

### Service Provider
- Register and manage business profile
- Upload logo, add services, gallery
- Enquiry inbox dashboard

### Admin
- Approve/reject provider applications
- Manage categories, users, testimonials
- Platform statistics overview

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and add your Supabase credentials:

```
VITE_SUPABASE_URL=https://creaxptcrptygvmtioub.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Set up Supabase database

Run the SQL in `supabase/schema.sql` in your Supabase SQL Editor.

Create storage buckets (public read):
- `provider-logos`
- `provider-gallery`
- `avatars`

### 4. Create admin user

After registering a user, promote them to admin in Supabase SQL:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
```

### 5. Run locally

```bash
npm run dev
```

### 6. Deploy to GitHub Pages + custom domain

1. Push to GitHub repo `FuturifyDesigns/MarketSphere`
2. Enable GitHub Pages (source: GitHub Actions)
3. In the repo: **Settings → Pages → Custom domain** → `marketspheregroup.com` (Enforce HTTPS once DNS propagates)
4. At your domain registrar, add DNS (see below)
5. In Supabase: **Authentication → URL Configuration**
   - Site URL: `https://marketspheregroup.com/`
   - Redirect URLs include: `https://marketspheregroup.com/**`, `https://www.marketspheregroup.com/**`, `http://localhost:5173/**`
6. Update Auth email templates from `supabase/email-templates/` (links use the custom domain)
7. Push to `main` — auto-deploys (`public/CNAME` ships with the site)

#### DNS for `marketspheregroup.com` (GitHub Pages)

**Apex (`marketspheregroup.com`) — A records:**

| Type | Name | Value |
|------|------|--------|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

**Optional www — CNAME:**

| Type | Name | Value |
|------|------|--------|
| CNAME | `www` | `futurifydesigns.github.io` |

After DNS propagates (minutes to 48h), turn on **Enforce HTTPS** in GitHub Pages settings.

## Logo Assets

Replace `public/logo.svg` and `public/favicon.svg` with your official logo files if you have higher-resolution versions.

## Company Info

- **Market Sphere Group (Pty) Ltd**
- Registration: UIN BW00000887185
- Location: Gaborone, Botswana
- Email: imcalledsammy@gmail.com
