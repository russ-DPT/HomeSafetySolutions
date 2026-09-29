# Home Safety Solutions — SEO and AI-search audit report

Branch: `v0/articles-and-seo-audit`. 46 site files changed.

## 1. Fixes, in priority order

1. Canonical tags on every indexed page point to `https://www.homesafety.solutions/...`.
2. Business structured data retyped as `MedicalBusiness` (39 pages), with the clinician as `Person` and verified credentials. No insurance and no school listed, by request.
3. Titles and meta descriptions rewritten to "Page | Home Safety Solutions, Tampa Bay".
4. `sitemap.xml` and `robots.txt` in place; AI crawlers allowed.
5. Custom 404 page linking to services, service area and booking.
6. Breadcrumbs, both visible and in structured data (37 pages).
7. Service pages: `Service` + `Offer` data with exact prices, a Key facts box, and an answer-first summary.
8. FAQ expanded to 110 questions with a definitions section; each has matching `FAQPage` data.
9. New `/compare` page and `/articles` page with two articles.
10. `llms.txt` and `llms-full.txt` (full text of 13 core pages).
11. Reviewed-by and Last updated lines on the six service pages and Compare.
12. Service area: communities paragraph plus a "What we look for in Tampa Bay homes" section (sunken living rooms, lanai sliders, pool decks, hurricane season).
13. Speed: six images converted to WebP (2.68 MB to 307 KB total; the service area map went from 822 KB to 78 KB). Footer logo and OT icon lazy-load; the OT icon has explicit dimensions; preconnect to IntakeQ on booking pages.
14. Vercel Web Analytics and Speed Insights tags on every page. Search Console and Bing verification placeholders on the homepage.

## 2. Structured data results

All 57 JSON-LD blocks across the site parse cleanly. Types in use: MedicalBusiness, Person, EducationalOccupationalCredential, Service, Offer, OfferCatalog, FAQPage (8 pages, 131 questions), BreadcrumbList, Article, WebPage, AboutPage, ContactPage, CollectionPage, ItemList.

Not yet run: Google's Rich Results Test and the schema.org validator. Both need a public URL, so run them on the deployed preview (see checklist).

## 3. Internal linking (step 10)

- Every service page links to FAQ, Service area and About from its main content.
- Every audience page links to booking from its main content and to at least one relevant service page.

## 4. Scores

Lighthouse and Core Web Vitals scores need the deployed site, since dev-server numbers aren't representative. Before-and-after measurements should be taken on production before and after this branch is merged. Speed Insights will record real-user Core Web Vitals from launch.

## 5. Article ideas (not published)

Drawn from common questions in this field. Not yet checked against keyword-volume data.

| # | Target question | Intent | Suggested outline |
|---|---|---|---|
| 1 | What should the house have ready before a hospital discharge? | Urgent, practical | Bathroom, bed, path, entry; what can wait; who checks it |
| 2 | Who does a home safety assessment, and is a PT or OT the right person? | Compare providers | Roles; contractor vs clinician; questions to ask |
| 3 | How do I make a sunken living room safe for a walker? | How-to | Risks; rail, ramp, room-use options; when to get an assessment |
| 4 | Is a lanai sliding door a fall risk? | How-to | Track height; door weight; threshold ramps; device width |
| 5 | How do I keep a power wheelchair or oxygen working in a hurricane? | Seasonal, urgent | Batteries; backup power; special-needs shelters; evacuation plan |
| 6 | What grab bars do I actually need in the bathroom? | How-to | Placement; blocking; suction bars; why a fitted plan beats a kit |
| 7 | Can my parent age in place in their current home? | Decision | Signs it works; signs it doesn't; what an assessment answers |
| 8 | What happens during a home safety visit? | Pre-booking | Before, during, after; the written plan; what to have ready |
| 9 | Is a free contractor home safety check really free? | Compare | Incentives; what a clinician looks for; independence policy |
| 10 | How can I check on a parent's safety from another state? | Remote caregiving | Video visits; sensors; who to call locally |
| 11 | What's the difference between a ramp, a threshold ramp and a lift? | Research | Slope rules; space; cost range; when each fits |
| 12 | How do I prevent falls at night? | How-to | Lighting; path to bathroom; bedside setup; medication timing |
| 13 | Should we buy a one-story home before retiring in Florida? | Decision | What to check on a tour; Right Home service |
| 14 | Does Medicare pay for a home safety assessment? | Cost | Plain answer; what this practice charges; no insurance billed |

## 6. Manual checklist for Dr. Russ

- [ ] Google Search Console: add the property, paste the verification code into the homepage placeholder, and submit `/sitemap.xml`.
- [ ] Bing Webmaster Tools: same steps (or import from Search Console).
- [ ] Vercel: turn on Web Analytics and Speed Insights in the project dashboard.
- [ ] Confirm `homesafety.solutions` redirects to `www.homesafety.solutions` in Vercel Domains.
- [ ] Run Google's Rich Results Test on the homepage, one service page, the FAQ and one article.
- [ ] Google Business Profile: set it up as a service-area business (hide the street address), then add services, prices and the booking link.
- [ ] Bing Places and Apple Business Connect: same details.
- [ ] Directories: RESNA ATP directory, APTA Find a PT, and any local Area Agency on Aging provider list.
- [ ] Review the community list on /service-area and remove any town you don't visit.
- [ ] Review the contractor column on /compare.
- [ ] Choose which article ideas to write or approve.
