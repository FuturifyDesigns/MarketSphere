# Market Sphere Group — Corporate Documents

Professional company profile and letterhead templates for submissions, partnerships, and official correspondence.

## Files

| File | Purpose |
|------|---------|
| `Market-Sphere-Group-Company-Profile.docx` | **Word** — 5-page branded company profile |
| `Market-Sphere-Group-Letterhead.docx` | **Word** — official letterhead with sample cover letter |
| `company-profile.html` | 4-page branded company profile (cover + overview, values, services, contact) |
| `letterhead.html` | Official letterhead with sample submission letter + blank template |
| `corporate-brand.css` | Shared styling for all corporate documents |

## Regenerate Word files

```bash
node scripts/generate-corporate-docx.mjs
```

Outputs both `.docx` files into this folder.

## How to export PDF (for tomorrow's submission)

1. Open the HTML file in **Chrome** or **Microsoft Edge** (double-click the file, or drag it into the browser).
2. Click **Save as PDF / Print** at the top, or press `Ctrl+P`.
3. Set **Destination** to **Save as PDF**.
4. Enable **Background graphics** (important for gold/bronze branding).
5. Set paper size to **A4** and margins to **Default** or **None**.
6. Save as:
   - `Market-Sphere-Group-Company-Profile.pdf`
   - `Market-Sphere-Group-Letterhead.pdf`

## Before submitting

- [ ] Replace `[Authorised Signatory Name]` and `[Title / Designation]` on the letterhead.
- [ ] Confirm recipient name/address on the cover letter if required by the programme.
- [ ] Review contact details (email, phone, address) match your latest records.
- [ ] Print one copy to check alignment and colours if submitting physically.

## Editing

All content is sourced from `src/lib/constants.ts`. To update company details site-wide, edit that file and then update the HTML documents to match.

## Brand colours

- Gold: `#C9A24B`
- Bronze: `#4A3F2F`
- Paper: `#FAF8F4`
