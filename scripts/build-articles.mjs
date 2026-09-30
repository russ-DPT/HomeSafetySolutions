// Builds the Home Safety Solutions article pages from content/articles.
// Runs automatically before every build (see "prebuild" in package.json),
// so Vercel regenerates the pages on each deploy. No dependencies.
//
//   content/articles/articles.json   titles, card text, alt text, per-article publish date ("published", falls back to the top-level one)
//   content/articles/NN-slug.md      one Markdown file per article
//   public/assets/img/articles/<slug>.webp   1280x720 thumbnail per article
//
// Writes public/<slug>.html for each article, the article cards on
// public/articles.html (between BEGIN/END markers), the ItemList schema there,
// and the article URLs in public/sitemap.xml and public/llms.txt.
// Rules: no prices in article text (the pricing link points to /services),
// no em dashes, credential line "Russ L'HommeDieu, DPT, ATP".

import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const PUB = join(ROOT, "public")
const CONTENT = join(ROOT, "content", "articles")
const SITE = "https://www.homesafety.solutions"
const CONSULT = "https://intakeq.com/booking/zm1cyz?serviceId=7c400002-9dcd-4689-a8e5-1e075c4c5d9c"

const data = JSON.parse(readFileSync(join(CONTENT, "articles.json"), "utf8"))
const DEFAULT_PUBLISHED = data.published
const ARTICLES = [...data.articles].sort((a, b) => a.n - b.n)

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
const pad = (n) => String(n).padStart(2, "0")

function longDate(iso) {
  const [y, m, d] = iso.split("-").map(Number)
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"]
  return `${months[m - 1]} ${d}, ${y}`
}

// ---- Minimal Markdown for the article files: headings, paragraphs,
// bullet and numbered lists, pipe tables, **bold**, *italic*, [links](url).
function inline(text) {
  let s = esc(text)
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    const h = href.replace(/&amp;/g, "&")
    const ext = /^https?:\/\//.test(h) && !h.startsWith(SITE)
    return `<a href="${esc(h)}"${ext ? ' rel="noopener"' : ""}>${label}</a>`
  })
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  s = s.replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, "$1<em>$2</em>")
  return s
}

function mdToHtml(md) {
  const lines = md.split("\n")
  const out = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }
    let m
    if ((m = line.match(/^(#{2,4})\s+(.*)$/))) {
      const lvl = m[1].length
      out.push(`<h${lvl}>${inline(m[2])}</h${lvl}>`); i++; continue
    }
    if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|\s*:?-{3,}/.test(lines[i + 1])) {
      const cells = (l) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim())
      const head = cells(line)
      i += 2
      const rows = []
      while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(cells(lines[i])); i++ }
      out.push('<div class="table-wrap"><table>\n<thead><tr>' + head.map((c) => `<th>${inline(c)}</th>`).join("") + "</tr></thead>\n<tbody>\n" +
        rows.map((r) => "<tr>" + r.map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>").join("\n") + "\n</tbody>\n</table></div>")
      continue
    }
    if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      const ordered = /^\d+\./.test(line)
      const re = ordered ? /^\d+\.\s+/ : /^[-*]\s+/
      const items = []
      while (i < lines.length && re.test(lines[i])) {
        let item = lines[i].replace(re, "")
        i++
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !re.test(lines[i])) { item += " " + lines[i].trim(); i++ }
        items.push(`<li>${inline(item)}</li>`)
        while (i < lines.length && !lines[i].trim() && i + 1 < lines.length && re.test(lines[i + 1])) i++
      }
      out.push(`<${ordered ? "ol" : "ul"}>\n${items.join("\n")}\n</${ordered ? "ol" : "ul"}>`)
      continue
    }
    const para = [line.trim()]
    i++
    while (i < lines.length && lines[i].trim() && !/^(#{2,4}\s|[-*]\s|\d+\.\s|\s*\|)/.test(lines[i])) { para.push(lines[i].trim()); i++ }
    out.push(`<p>${inline(para.join(" "))}</p>`)
  }
  return out.join("\n")
}

function loadArticle(a) {
  const src = readFileSync(join(CONTENT, `${pad(a.n)}-${a.slug}.md`), "utf8")
  const lines = src.split("\n")
  const title = lines[0].replace(/^#\s*/, "").trim()
  let body = lines.slice(1).filter((l) => !l.startsWith("*By Russ")).join("\n")
  body = body.split(`${SITE}/pricing`).join("/services").replace(/\(\/pricing\)/g, "(/services)")
  body = body.replace(/^### Sources$/m, "## Sources")
  return { title, body }
}

function renderBody(md) {
  let html = mdToHtml(md)
  if (html.includes("<h2>Sources</h2>")) {
    html = html.replace("<h2>Sources</h2>", '<section class="article-sources" aria-labelledby="sources-h"><h2 id="sources-h">Sources</h2>') + "\n</section>"
  }
  return html
}

const readMinutes = (md) => Math.max(3, Math.ceil((md.match(/\w+/g) || []).length / 200))

// ---- Page template: The Quiet Negotiation article page ----
const template = readFileSync(join(PUB, "the-quiet-negotiation.html"), "utf8")
const T_TITLE = "The Quiet Negotiation: Safety, Independence, and Compassion"
const T_DESC = /Why you cannot subtract your way to safety[^"]*/g
const headEnd = template.indexOf('<main id="main" tabindex="-1">')
const footStart = template.indexOf("</main>")
if (headEnd < 0 || footStart < 0) throw new Error("build-articles: template markers not found in the-quiet-negotiation.html")

const jsonStr = (s) => JSON.stringify(s).slice(1, -1)
const cards = []
const items = []

for (const a of ARTICLES) {
  const { title, body } = loadArticle(a)
  const url = `${SITE}/${a.slug}`
  const imgRel = `/assets/img/articles/${a.slug}.webp`
  const imgAbs = SITE + imgRel
  const mins = readMinutes(body)
  const PUBLISHED = a.published || DEFAULT_PUBLISHED
  if (!existsSync(join(PUB, imgRel))) console.warn(`build-articles: missing thumbnail ${imgRel}`)

  // Head: swap the template page's title, description, URL and image.
  // Inside JSON-LD blocks use JSON escaping; elsewhere use HTML escaping.
  let head = template.slice(0, headEnd)
  head = head.replace(/(<script type="application\/ld\+json"[^>]*>)([\s\S]*?)(<\/script>)/g, (_, o, block, c) => {
    block = block.split(T_TITLE).join(jsonStr(title)).replace(T_DESC, jsonStr(a.meta))
    block = block.replace('"mainEntityOfPage"', `"datePublished": "${PUBLISHED}",\n  "mainEntityOfPage"`)
    return o + block + c
  })
  head = head.split(T_TITLE).join(esc(title)).replace(T_DESC, esc(a.meta))
  head = head.split(`${SITE}/the-quiet-negotiation`).join(url)
  head = head.split(`${SITE}/assets/img/quiet-negotiation.png`).join(imgAbs)

  const main = `<main id="main" tabindex="-1">
<section class="page-head"><div class="wrap"><p class="breadcrumb"><a href="/">Home</a> / <a href="/articles">Articles and videos</a> / ${esc(a.kicker)}</p><div class="stripe-rule" aria-hidden="true"></div><h1>${esc(title)}</h1></div></section>
<section class="page-body"><div class="wrap">

<figure class="article-hero">
  <img src="${imgRel}" alt="${esc(a.alt)}" width="1280" height="720">
</figure>

<p class="article-byline"><span class="author">By Russ L'HommeDieu, DPT, ATP</span> <span>Doctor of Physical Therapy and RESNA Assistive Technology Professional</span> <span><time datetime="${PUBLISHED}">${longDate(PUBLISHED)}</time></span> <span>${mins} min read</span></p>

<article class="article-body">
${renderBody(body)}
</article>

<p><a class="back-to-top" href="/articles">&larr; Back to articles and videos</a></p>

</div></section>

<section class="cta-band no-print"><div class="wrap">
  <h2>Want a plan for your own home?</h2>
  <p>Every service starts with an Initial Consultation, a 30-minute phone call with Dr. L'HommeDieu. Current prices are on our services and pricing page.</p>
  <div class="btn-stack">
    <a data-link="CONSULT" class="btn btn-primary" href="${CONSULT}">Book an Initial Consultation</a>
  </div>
  <p style="margin-top:1rem"><a class="btn btn-secondary" href="/services">See services and pricing</a></p>
</div></section>
`
  writeFileSync(join(PUB, `${a.slug}.html`), head + main + template.slice(footStart))

  cards.push(`    <article class="media-card">
      <a class="media-thumb" href="/${a.slug}" aria-label="Read: ${esc(title)}">
        <img src="${imgRel}" alt="${esc(a.alt)}" width="1280" height="720" loading="lazy" decoding="async">
      </a>
      <div class="media-body">
        <p class="media-kicker">${esc(a.kicker)}</p>
        <h3><a href="/${a.slug}">${esc(title)}</a></h3>
        <p>${esc(a.card)}</p>
        <p class="media-meta">
          <span><svg class="icon" aria-hidden="true" focusable="false"><use href="/assets/img/icons.svg#i-person"></use></svg>Russ L'HommeDieu, DPT, ATP</span>
          <span><time datetime="${PUBLISHED}">${longDate(PUBLISHED)}</time> &middot; ${mins} min read</span>
        </p>
      </div>
    </article>
`)
  items.push({ headline: title, url, image: imgAbs, datePublished: PUBLISHED })
}

// ---- Articles and videos page ----
const apPath = join(PUB, "articles.html")
let ap = readFileSync(apPath, "utf8")
const BEGIN = "<!-- BEGIN:hss-articles -->", END = "<!-- END:hss-articles -->"
const block = `${BEGIN}\n${cards.join("\n")}    ${END}\n`
if (ap.includes(BEGIN)) {
  ap = ap.slice(0, ap.indexOf(BEGIN)) + block + ap.slice(ap.indexOf(END) + END.length).replace(/^\n/, "")
} else {
  ap = ap.replace('  <div class="card-grid">\n', '  <div class="card-grid">\n' + block)
}
ap = ap.replace(/(<script type="application\/ld\+json">\s*)(\{[\s\S]*?\})(\s*<\/script>)/, (all, o, json, c) => {
  let obj
  try { obj = JSON.parse(json) } catch { return all }
  if (obj["@type"] !== "ItemList") return all
  const ours = new Set(items.map((i) => i.url))
  const others = obj.itemListElement.filter((el) => !ours.has(el.item.url)).map((el) => el.item)
  const list = [...items.map((i) => ({ "@type": "Article", ...i, author: { "@id": `${SITE}/#russ` } })), ...others]
  obj.itemListElement = list.map((item, k) => ({ "@type": "ListItem", position: k + 1, item }))
  return o + JSON.stringify(obj, null, 2) + c
})
writeFileSync(apPath, ap)

// ---- sitemap.xml ----
const smPath = join(PUB, "sitemap.xml")
let sm = readFileSync(smPath, "utf8")
for (const a of ARTICLES) {
  const loc = `${SITE}/${a.slug}`
  const date = a.published || DEFAULT_PUBLISHED
  const entry = new RegExp(`(<loc>${loc.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}</loc>\\s*<lastmod>)[^<]*(</lastmod>)`)
  if (entry.test(sm)) sm = sm.replace(entry, `$1${date}$2`)
  else if (!sm.includes(`<loc>${loc}</loc>`)) sm = sm.replace("</urlset>", `  <url><loc>${loc}</loc><lastmod>${date}</lastmod></url>\n</urlset>`)
}
writeFileSync(smPath, sm)

// ---- llms.txt ----
const llPath = join(PUB, "llms.txt")
let ll = readFileSync(llPath, "utf8")
const LB = "<!-- articles:begin -->", LE = "<!-- articles:end -->"
const lblock = `${LB}\n${ARTICLES.map((a) => `  - [${loadArticle(a).title}](${SITE}/${a.slug})`).join("\n")}\n${LE}`
if (ll.includes(LB)) {
  ll = ll.slice(0, ll.indexOf(LB)) + lblock + ll.slice(ll.indexOf(LE) + LE.length)
} else {
  ll = ll.replace(/(- \[Articles\]\([^)]*\): [^\n]*\n)/, (m) => m + lblock + "\n")
}
writeFileSync(llPath, ll)

console.log(`build-articles: built ${ARTICLES.length} article pages`)
