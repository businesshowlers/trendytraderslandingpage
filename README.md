# Trendy Traders Academy — One-Page Landing Site

A single landing page built with **HTML5, CSS3 and vanilla JavaScript only**. There are no frameworks, no build step and no Node/Python files. Upload the folder to any standard web host and it works.

---

## 1. Structure

```
/
├── index.html                  The landing page (all sections, anchor navigation)
├── privacy-policy.html         Required legal pages, linked from the form and footer
├── terms-and-conditions.html
├── refund-policy.html
├── risk-disclaimer.html
├── 404.html
├── .nojekyll                   Tells GitHub Pages to serve files as-is
├── robots.txt
├── sitemap.xml
└── assets/
    ├── css/style.css           Design tokens + all components (mobile-first)
    ├── css/responsive.css      Breakpoint layer
    ├── js/config.js            ← ALL editable business values
    ├── js/main.js              Nav, scroll-spy, accordions, course details, lightbox, sticky CTA, analytics hook
    ├── js/form-validation.js   Field rules + inline errors (validated per step)
    ├── js/popup.js             The ONE two-step consultation popup + submission
    └── images/                 Logo, mentor and press assets (see §3)
```

**Landing page section order (matches the approved mobile UI):** Header → Hero with trust indicators and illustrative trading chart (`#top`) → What You Will Learn (`#learn`) → Programmes (`#courses`) → How Learning Works (`#how`) → Mentor card (`#mentor`) → FAQ (`#faq`) → Consultation CTA (`#contact`) → Footer → fixed mobile bottom navigation (Home · Courses · Learn · Contact, shown below 1024px).

**"View All" buttons** reveal extra learning topics, the Bangalore Classroom programme and more FAQs. **Programme rows** expand inline (schedule, sessions, fee, next batch) with Enrol Now and Ask an Advisor buttons. **Meet Your Mentor** expands the mentor details inside the card.

**Hero chart:** an inline SVG candlestick illustration with support, resistance and price-action labels, a moving-average line and volume bars. It is captioned "Illustrative chart for learning · not live market data" and has no prices or tickers. It animates in once, and stays static when reduced motion is preferred.

**Primary buttons** use `--brand-strong` (#cb4b0f) so white text meets WCAG AA contrast. The brighter logo orange (`--brand`) is used for accents. To match the reference's lighter button exactly, set `--brand-strong` to `#f26722` in `style.css`; white text would then fall below AA contrast.

**Course cards:** "Explore Course" expands compact details (format, schedule, sessions, fee, next batch) inside the card, with **Enrol Now** and **Get Free Consultation** buttons. There are no separate course pages.

---

## 2. Run locally

From this folder, start a static server:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`. Python is only the local server and is not part of the site. VS Code "Live Server" works too. Double-clicking `index.html` also works for browsing.

### Deploy on GitHub Pages

The repository is ready to publish as-is: every path is relative, there is no build step, and `.nojekyll` tells GitHub to serve the files unchanged.

1. Create an empty repository on GitHub (no README or licence, so the first push is clean).
2. Push this folder:
   ```bash
   git remote add origin https://github.com/<your-username>/<repository-name>.git
   git push -u origin main
   ```
3. On GitHub, open **Settings → Pages → Build and deployment**. Choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
4. After about a minute the site is live at `https://<your-username>.github.io/<repository-name>/`.

**Custom domain (e.g. trendytraders.in):**
- In **Settings → Pages → Custom domain**, enter the domain. GitHub adds a `CNAME` file for you.
- At your DNS provider, point the domain to GitHub Pages. For an apex domain, use four `A` records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153`. For `www`, use a `CNAME` record to `<your-username>.github.io`.
- Once the certificate is issued, tick **Enforce HTTPS**.
- Canonical URLs, Open Graph tags, `sitemap.xml` and `robots.txt` already use `https://trendytraders.in/`. If you host on a different domain, update them.

**404 page:** GitHub Pages serves `404.html` automatically. It detects a `*.github.io/<repository>/` address, so its styles and links work at any depth.

---

## 3. Assets to add — required before launch

Until these files exist, the page shows tidy text fallbacks (it never shows broken images).

| File | What it is | Notes |
|---|---|---|
| `assets/images/logo.png` | Official TTA logo | **Trim the white space around the logo** (cropping only — no recolouring or stretching). A horizontal, transparent logo around 400×110 px is ideal; it displays at 38 px tall. |
| `assets/images/mentor-abhishek-jha-avatar.webp` | Mentor card photo — **in place** | A round crop of the supplied photo (face only, cropped inside the sticker badges; nothing edited). |
| `assets/images/mentor-abhishek-jha.webp` + `.png` | Original supplied mentor artwork | Kept as the source file; not currently shown on the page. | ⚠ The supplied artwork has claims built into the image: "4.8 · Join 30K+ happy users" (no review source, and it differs from the 45,000+ used elsewhere) and "Best Mentor in India". Consider a clean version without these badges. |
| `assets/images/press/theprint.jpg` | Screenshot of the ThePrint article | Original, unedited screenshots. They are framed with `object-fit: contain`, so they are never cropped. About 1200 px wide, under 250 KB. |
| `assets/images/press/thequint.jpg` | Screenshot of The Quint article | |
| `assets/images/press/asianet-newsable.jpg` | Screenshot of the Asianet News Newsable article | |
| `assets/images/og-image.jpg` | Social share image, 1200×630 | |

**Press coverage:** only articles with a verified URL are shown. All three current ones (checked 9 Oct 2026) are paid/partner placements, which is labelled on each card and stated under the grid. To add another, copy one `<article class="press-card">` block in `index.html`. Forbes, The Week, Outlook, Hindustan Times and LiveMint appear on the current site, but no article URLs were found for them, so they are not shown.

---

## 4. Everyday edits — `assets/js/config.js`

| What | Key |
|---|---|
| Next batch date | `display.nextBatch`. Also update the same date in `index.html` (no-JS/SEO fallback and `startDate` in the JSON-LD). |
| Diamond Membership duration | `display.diamondDuration`. While empty, the card reads "Duration to be confirmed". |
| Phone / email | `display` + `contact` |
| Enrol Now links | `enrolUrls`. Currently all point to `https://wa.link/r1hf3x` (the live site's "Join Now"); replace with checkout URLs. |
| Testimonials | `testimonials: []`. The section stays hidden until genuine, permission-cleared reviews with attribution are added. |
| Auto-popup timing | `popup.autoOpenDelaysMs` — `[5000, 25000]`: first at 5 s, again at 25 s |

---

## 5. Two-step consultation popup

- **Step 1 — Let's Get to Know You:** full name, email, mobile (+91), age (18+). Then **Continue**.
- **Step 2 — Help Us Guide You Better:** trading amount, occupation, WhatsApp brochure (Yes/No), and an optional, unchecked email-marketing consent. Then **Back** or **Get Free Consultation**.
- Each step is validated before moving on. Both steps live in one `<form>`, so Step 1 values are kept when going Back and are sent together with Step 2. Pressing Enter in Step 1 acts as Continue.
- Under-18 visitors cannot proceed past Step 1.
- The popup auto-opens **at 5 s, and again at 25 s** after landing if it was closed. It never auto-opens after a successful submission, never on top of another dialog or the open mobile menu, and never while the visitor is typing in a page field. Each slot is used once per browser session (`sessionStorage`, with an in-memory fallback). Every consultation button opens it manually (`data-open-consultation="<location>"`).
- It closes with ✕, Escape or a backdrop click, returns focus to the button that opened it, and locks page scroll while open.

### Backend (to be connected)

No backend is connected yet. Until `form.endpoint` in `config.js` is set, a valid submission shows an honest "couldn't send" message with the phone and email. It **never shows fake success**.

**Request:** `POST` JSON to `form.endpoint`:

```json
{
  "fullName": "…", "email": "…", "phone": "+919876543210", "age": 25,
  "tradeAmount": "20k-50k | 50k-1L | 1L-5L | 5L+",
  "occupation": "Student | Self-employed | Salaried | Business Owner | Home Maker",
  "whatsappBrochure": "yes | no | null",
  "emailMarketingConsent": false,
  "captchaToken": "only when CAPTCHA is enabled",
  "context": { "ctaLocation": "hero", "page": "/", "pageTitle": "…", "referrer": "…", "utm": {}, "submittedAt": "ISO-8601" }
}
```

**Response:** `2xx` counts as success. A non-2xx status, or `"ok": false` / `"success": false` in the body, shows an error and keeps the input. Return `{"ok": true, "id": "…"}`; the id de-duplicates the conversion event.

**Server-side requirements:**
- Re-validate every field on the server: age ≥ 18 and a 10-digit Indian mobile starting 6–9.
- Reject requests where the honeypot field `website` is filled.
- Store the consent choices, and only send promotional messages to visitors who opted in.
- Keep CRM keys and CAPTCHA secrets on the server, never in `config.js`.
- **Optional CAPTCHA:** set `captcha.provider: 'turnstile'` and the public `siteKey`.

---

## 6. Analytics

No tags are included, which avoids duplicates. Paste the **existing** GTM/GA4/Meta Pixel snippet once, where `index.html` has the `<!-- Analytics: … -->` comment. Events go to `dataLayer` (or `gtag`), with **no personal data**.

| Event | When |
|---|---|
| `consultation_cta_click` | Any consultation button (`cta_location`) |
| `consultation_popup_impression` | Popup opens (`trigger`: auto/manual) |
| `consultation_form_start` | First input, once per open |
| `consultation_form_validation_error` | Step blocked (`step`, `fields` = field names only) |
| `consultation_step1_complete` | Step 1 passed |
| `consultation_form_submit` | Valid Step 2 submission attempted |
| `consultation_lead_success` | **Only after server confirmation**, de-duplicated by `lead_ref` |
| `consultation_form_error` | Server/network failure (`status`) |
| `consultation_popup_dismiss` | Closed without submitting (`step`, `form_started`) |
| `course_details_open`, `enrol_click`, `press_screenshot_open` | Engagement |

Set `analytics.metaPixelLead: true` to also fire Meta `Lead` (with `eventID` = `lead_ref`).

---

## 7. Launch checklist

1. Add the assets in §3.
2. Connect the backend (§5) and test a real submission end to end.
3. Paste the existing analytics snippet (§6).
4. Set up 301 redirects from old URLs to `/` or the matching `#section`. Examples: `/technical-analysis-course/`, `/best-stock-market-course/`, `/online-stock-market-course/` and `/best-stock-market-course-in-bangalore/` → `/#courses`; `/about-us/` → `/#mentor`. Old policy URLs go to the matching `.html` pages. Decide what to do with the current city pages.
5. Set the host's 404 page to `/404.html`, and submit `sitemap.xml` in Search Console.
6. **Confirm with the business:**
   - Diamond Membership duration and fee (the live site shows ₹1,77,000 and conflicting durations).
   - Mentor credential wording.
   - Legal copy (adapted from the live policies; have it reviewed).
   - The 4.8 rating was left out because no source is given.

---

## 8. Testing performed (9 Oct 2026, Chromium, local static server)

- **Layout:** `index.html` and the policy/404 pages at 320, 360, 390, 430, 768, 1024, 1280 and 1440 px, with no horizontal overflow and one `<h1>` each. Section order matches the brief. No broken links or anchors. 11 consultation triggers. Collapsed panels are not keyboard-focusable.
- **Two-step form:**
  - Step 1 blocks Continue on empty fields and on under-18; Enter acts as Continue.
  - Step 2 receives focus and validates its own fields.
  - Back keeps the Step 1 values.
  - No endpoint gives an honest error. A server 501 gives an error with input kept.
  - A mocked 200 shows success. A triple-click sent one request, and the lead event fired once with no personal data.
- **Popup rules:** auto-opens at ~5 s; does not auto-reopen after being closed in the same session; manual buttons still open it; Escape closes it and returns focus. Tested on a 375 px mobile viewport too.
- **Console:** no JavaScript errors. The only 404s are the image assets not yet supplied.

**Not yet tested:** a real backend/CRM and CAPTCHA (not connected), Safari/iOS and Firefox, a screen-reader pass, and Lighthouse.
