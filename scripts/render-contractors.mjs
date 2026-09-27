// Renders the contractor directory from public/data/contractors.json straight into
// public/contractors.html so the list is readable without JavaScript.
// Runs in prebuild after sync-booking-links.mjs. site.js still re-renders on load
// to power the "Type of work" filter; keep card() below in step with card() there.
import { readFileSync, writeFileSync } from "node:fs"

const PAGE = "public/contractors.html"
const DATA = "public/data/contractors.json"
const NO_VETTED = "We are vetting our first partners now. Check back soon, or ask Dr. L'HommeDieu on your consultation call."

const TIER = { handyman: "Handyman", contractor: "Licensed contractor (to confirm)", trades: "Licensed trades", specialty: "Specialty equipment", unconfirmed: "Type of work to be confirmed" }
const TIER_V = { handyman: "Handyman", contractor: "Licensed contractor", trades: "Licensed trades", specialty: "Specialty equipment" }

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

function card(c) {
  const v = !!c.vetted
  return `<article class="contractor${v ? "" : " contractor-pending"}">` +
    (v ? "" : `<p class="pending-flag">Not yet vetted</p>`) +
    `<h3>${esc(c.name)}</h3>` +
    `<p><span class="tag">${esc((v ? TIER_V : TIER)[c.tier] || c.tier)}</span>` +
    (v && c.caps ? `<span class="tag tag-caps">CAPS certified</span>` : "") +
    (!v && c.capsConfirmed ? `<span class="tag tag-caps">CAPS since ${esc(c.capsConfirmed)} (NAHB directory)</span>` : "") +
    (!v && !c.capsConfirmed && c.capsListed ? `<span class="tag">Listed as CAPS in a directory (unconfirmed)</span>` : "") +
    (c.basedIn ? `<span class="tag">${/confirm/.test(c.basedIn) ? esc(c.basedIn) : "Based in " + esc(c.basedIn)}</span>` : "") + "</p>" +
    (c.services ? `<p>${esc(c.services)}</p>` : "") +
    (c.contactName ? `<p><strong>Contact:</strong> ${esc(c.contactName)}</p>` : "") +
    (c.address ? `<p><strong>Address:</strong> ${esc(c.address)}</p>` : "") +
    (c.license ? `<p><strong>Florida license:</strong> ${esc(c.license)}</p>` : "") +
    (c.phone ? `<p><strong>Phone:</strong> <a href="tel:${esc(c.phone.replace(/[^0-9+]/g, ""))}">${esc(c.phone)}</a></p>` : "") +
    (c.email ? `<p><strong>Email:</strong> <a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p>` : "") +
    (c.website ? `<p><a href="${esc(c.website)}" target="_blank" rel="noopener">Website</a></p>` : "") +
    `<p class="price-note">${v ? "Vetted " + esc(c.verified) : "Source: " + esc(c.source)}</p></article>`
}

const all = (JSON.parse(readFileSync(DATA, "utf8")).contractors || []).filter((c) => c.published)
const vetted = all.filter((c) => c.vetted)
const notYet = all.filter((c) => !c.vetted)

const blocks = {
  directory: vetted.length ? vetted.map(card).join("") : `<div class="empty"><p>${esc(NO_VETTED)}</p></div>`,
  "directory-pending": notYet.length ? notYet.map(card).join("") : `<div class="empty"><p>No companies are listed in this group yet.</p></div>`,
  "dir-count": `${vetted.length} vetted ${vetted.length === 1 ? "partner" : "partners"}, ${notYet.length} not yet vetted`,
}

let html = readFileSync(PAGE, "utf8")
for (const [id, inner] of Object.entries(blocks)) {
  const start = `<!-- rendered:${id} -->`, end = `<!-- /rendered:${id} -->`
  if (html.includes(start)) {
    const re = new RegExp(`${start}[\\s\\S]*?${end}`)
    html = html.replace(re, () => start + inner + end)
  } else {
    const open = new RegExp(`(<(div|p) id="${id}"[^>]*>)([\\s\\S]*?)(</\\2>\\n)`)
    if (!open.test(html)) throw new Error(`render-contractors: #${id} not found in ${PAGE}`)
    // First run only: the loading placeholder is a single nested <div class="empty"><p>…</p></div>.
    html = html.replace(new RegExp(`(<(?:div|p) id="${id}"[^>]*>)(?:<div class="empty"><p>[^<]*</p></div>)?(</(?:div|p)>)`), (_, a, b) => a + start + inner + end + b)
    if (!html.includes(start)) throw new Error(`render-contractors: could not place #${id}`)
  }
}
writeFileSync(PAGE, html)
console.log(`render-contractors: ${vetted.length} vetted, ${notYet.length} not yet vetted`)
