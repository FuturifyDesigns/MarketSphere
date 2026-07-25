# MarketSphereGroup

Online service marketplace platform for **Market Sphere Group (Pty) Ltd** — connecting customers with verified service providers across Botswana.

Live site: [marketspheregroup.com](https://marketspheregroup.com/)

## Tech Stack

- **Frontend:** React 19 + Vite + TypeScript
- **Routing:** React Router (HashRouter)
- **Backend:** Supabase (Auth, PostgreSQL, Storage)
- **Motion:** Lenis smooth scroll, GSAP ScrollTrigger, Framer Motion
- **Edge:** Custom domain with CDN / reverse proxy for HTTPS and security headers

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

### 6. Production deploy

1. Build with `npm run build` and publish the `dist/` directory to your static origin.
2. Point `marketspheregroup.com` (and optional `www`) at a CDN or reverse proxy in front of that origin. Prefer proxy/orange-cloud style DNS so visitors only see the custom domain — not origin hostnames in DNS, certs, or response headers.
3. Apply the HTTP security headers from `ops/cdn-security-headers.txt` (and/or ship `public/_headers` with the build). Meta tags alone cannot set HSTS or `frame-ancestors`.
4. In Supabase: **Authentication → URL Configuration**
   - Site URL: `https://marketspheregroup.com/`
   - Redirect URLs include: `https://marketspheregroup.com/**`, `https://www.marketspheregroup.com/**`, `http://localhost:5173/**`
5. Update Auth email templates from `supabase/email-templates/` (links use the custom domain)

## Logo Assets

Replace `public/logo.svg` and `public/favicon.svg` with your official logo files if you have higher-resolution versions.

## Company Info

- **Market Sphere Group (Pty) Ltd**
- Registration: UIN BW00000887185
- Location: Gaborone, Botswana
- Email: info@marketspheregroup.com
