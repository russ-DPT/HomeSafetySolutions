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

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const PUB = join(ROOT, "public")
const CONTENT = join(ROOT, "content", "articles")
const SITE = "https://www.homesafety.solutions"
const CONSULT = "https://intakeq.com/booking/zm1cyz?serviceId=7c400002-9dcd-4689-a8e5-1e075c4c5d9c"

const data = JSON.parse(readFileSync(join(CONTENT, "articles.json"), "utf8"))
const DEFAULT_PUBLISHED = data.published
const publishedOf = (a) => a.published || DEFAULT_PUBLISHED
const ARTICLES = [...data.articles].sort((a, b) => publishedOf(b).localeCompare(publishedOf(a)) || b.n - a.n)

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
const pad = (n) => String(n).padStart(2, "0")

function longDate(iso) {
  const [y, m, d] = iso.split("-").map(Number)
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"]
  return `${months[m - 1]} ${d}, ${y}`
}

// ---- Minimal Markdown for the article files: headings, paragraphs,
// bullet and numbered lists, pipe tables, **bold**, *italic*, [links](url),
// and a YouTube embed on its own line: {{youtube:VIDEO_ID|Caption}}.
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

const slugify = (s) => s.toLowerCase().replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")

function mdToHtml(md) {
  const lines = md.split("\n")
  const out = []
  const usedIds = new Set()
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }
    let m
    if ((m = line.trim().match(/^\{\{youtube:([A-Za-z0-9_-]{11})\|([^}]+)\}\}$/))) {
      const [, id, label] = m
      out.push(`<figure class="article-video">
  <div class="article-video-frame"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="${esc(label)}" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>
  <figcaption>${esc(label)}. <a href="https://www.youtube.com/watch?v=${id}" rel="noopener">Watch on YouTube</a></figcaption>
</figure>`)
      i++; continue
    }
    if ((m = line.match(/^(#{2,4})\s+(.*)$/))) {
      const lvl = m[1].length
      const text = m[2].trim()
      if (lvl > 3 || text === "Sources") { out.push(`<h${lvl}>${inline(text)}</h${lvl}>`); i++; continue }
      let id = slugify(text) || "section", k = 2
      while (usedIds.has(id)) id = `${slugify(text)}-${k++}`
      usedIds.add(id)
      out.push(`<h${lvl} id="${id}">${inline(text)}</h${lvl}>`); i++; continue
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

// Articles flagged "toc": true in articles.json get an "In this guide" contents
// list (sticky sidebar on wide screens) and a "Back to contents" link at the end
// of each section. Both are .no-narrate so Listen skips them.
function tocFor(html) {
  const sections = [...html.matchAll(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g)].map(([, id, label]) => ({ id, label: label.replace(/<[^>]+>/g, "") }))
  if (sections.length < 3) return ""
  return `<nav class="article-toc no-narrate no-print" id="contents" aria-labelledby="toc-h">
  <p class="article-toc-title" id="toc-h">In this guide</p>
  <ol>
${sections.map((s) => `    <li><a href="#${s.id}">${s.label}</a></li>`).join("\n")}
  </ol>
</nav>`
}

function addBackLinks(html) {
  const back = '<p class="toc-back no-narrate no-print"><a href="#contents">Back to contents</a></p>\n'
  let seen = 0
  return html.replace(/<h2( id="[^"]+")?>/g, (tag) => (seen++ === 0 ? tag : back + tag))
}

function renderBody(md, withToc = false) {
  let html = mdToHtml(md)
  if (withToc) html = addBackLinks(html)
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

// Previous / next article links, in publishing order (article number).
const BY_NUMBER = [...data.articles].sort((x, y) => x.n - y.n)
function pagerFor(a) {
  const i = BY_NUMBER.findIndex((x) => x.slug === a.slug)
  const link = (x, dir) => {
    if (!x) return ""
    const label = dir === "prev" ? "&larr; Previous article" : "Next article &rarr;"
    return `<a class="pager-${dir}" href="/${x.slug}" rel="${dir}"><span class="pager-label">${label}</span><span class="pager-title">${esc(loadArticle(x).title)}</span></a>`
  }
  const prev = link(BY_NUMBER[i - 1], "prev")
  const next = link(BY_NUMBER[i + 1], "next")
  if (!prev && !next) return ""
  return `<nav class="article-pager no-narrate no-print" aria-label="More articles">${prev}${next}</nav>`
}
// Printable PDF per article, built by build-article-pdfs.mjs (runs first).
const PDF_MANIFEST = join(PUB, "assets", "pdf", "manifest.json")
const PDFS = existsSync(PDF_MANIFEST) ? JSON.parse(readFileSync(PDF_MANIFEST, "utf8")) : {}
function pdfButton(slug) {
  const p = PDFS[slug]
  if (!p) { console.warn(`build-articles: no PDF for ${slug}`); return "" }
  const size = p.kb >= 1024 ? `${(p.kb / 1024).toFixed(1)} MB` : `${p.kb} KB`
  return `<p class="article-actions no-narrate no-print"><a class="btn btn-secondary" href="/assets/pdf/${slug}.pdf" download type="application/pdf"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>Download printable PDF</a> <span class="article-actions-meta">${p.pages} pages, ${size}</span></p>`
}

const cards = []
const items = []

for (const a of ARTICLES) {
  const { title, body } = loadArticle(a)
  const url = `${SITE}/${a.slug}`
  const imgRel = `/assets/img/articles/${a.slug}.webp`
  const imgSrc = a.thumbUrl || imgRel
  const imgAbs = a.thumbUrl || SITE + imgRel
  const mins = readMinutes(body)
  const PUBLISHED = a.published || DEFAULT_PUBLISHED
  if (!a.thumbUrl && !existsSync(join(PUB, imgRel))) console.warn(`build-articles: missing thumbnail ${imgRel}`)

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
  <img src="${imgSrc}" alt="${esc(a.alt)}" width="1280" height="720">
</figure>

<p class="article-byline"><span class="author">By Russ L'HommeDieu, DPT, ATP</span> <span>Doctor of Physical Therapy and RESNA Assistive Technology Professional</span> <span><time datetime="${PUBLISHED}">${longDate(PUBLISHED)}</time></span> <span>${mins} min read</span></p>

${pdfButton(a.slug)}

${a.toc ? (() => { const html = renderBody(body, true); return `<div class="article-layout has-toc">
${tocFor(html)}
<article class="article-body">
${html}
</article>
</div>` })() : `<article class="article-body">
${renderBody(body)}
</article>`}

${pagerFor(a)}

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
  let foot = template.slice(footStart)
  if (a.toc) foot = foot.replace('<script src="/assets/js/narrate.js" defer></script>', '<script src="/assets/js/narrate.js" defer></script>\n<script src="/assets/js/toc.js" defer></script>')
  writeFileSync(join(PUB, `${a.slug}.html`), head + main + foot)

  cards.push(`    <article class="media-card">
      <a class="media-thumb" href="/${a.slug}" aria-label="Read: ${esc(title)}">
        <img src="${imgSrc}" alt="${esc(a.alt)}" width="1280" height="720" loading="lazy" decoding="async">
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

// ---- Featured articles carousel, just above the footer on every page ----
const FB = "<!-- BEGIN:hss-featured -->", FE = "<!-- END:hss-featured -->"
const FEATURED_COUNT = 8
const FOOTER = '<footer class="site-footer">'

function featuredBlock(currentSlug) {
  const picks = ARTICLES.filter((a) => a.slug !== currentSlug).slice(0, FEATURED_COUNT)
  const slides = picks.map((a) => {
    const { title, body } = loadArticle(a)
    return `      <li class="featured-slide">
        <article class="writing-card">
          <a class="writing-thumb" href="/${a.slug}" tabindex="-1" aria-hidden="true">
            <img src="${a.thumbUrl || `/assets/img/articles/${a.slug}.webp`}" alt="" width="1280" height="720" loading="lazy" decoding="async">
          </a>
          <div class="writing-body">
            <p class="writing-tags"><span>${esc(a.kicker)}</span></p>
            <h3><a href="/${a.slug}">${esc(title)}</a></h3>
            <p class="writing-meta"><time datetime="${publishedOf(a)}">${longDate(publishedOf(a))}</time> &middot; ${readMinutes(body)} min read</p>
            <p class="writing-excerpt">${esc(a.card)}</p>
          </div>
        </article>
      </li>`
  }).join("\n")
  return `${FB}
<section class="featured-articles no-print" aria-labelledby="featured-h">
  <div class="wrap">
    <div class="featured-head">
      <div>
        <p class="featured-eyebrow">Latest</p>
        <h2 id="featured-h">Articles</h2>
      </div>
      <div class="featured-actions">
        <a class="featured-all" href="/articles">View all articles <span aria-hidden="true">&rarr;</span></a>
        <div class="featured-controls">
          <button type="button" class="featured-btn" data-dir="-1" aria-label="Previous articles" aria-controls="featured-track">&larr;</button>
          <button type="button" class="featured-btn" data-dir="1" aria-label="Next articles" aria-controls="featured-track">&rarr;</button>
        </div>
      </div>
    </div>
    <ul class="featured-track" id="featured-track" tabindex="0" aria-label="Recent articles, scroll sideways for more">
${slides}
    </ul>
  </div>
</section>
<script src="/assets/js/carousel.js" defer></script>
${FE}
`
}

let featuredPages = 0
for (const file of readdirSync(PUB)) {
  if (!file.endsWith(".html")) continue
  const path = join(PUB, file)
  let html = readFileSync(path, "utf8")
  const block = file === "index.html" ? featuredBlock("index") : ""
  if (!block) {
    if (html.includes(FB)) {
      html = html.slice(0, html.indexOf(FB)) + html.slice(html.indexOf(FE) + FE.length).replace(/^\n/, "")
      writeFileSync(path, html)
    }
    continue
  }
  if (html.includes(FB)) {
    html = html.slice(0, html.indexOf(FB)) + block + html.slice(html.indexOf(FE) + FE.length).replace(/^\n/, "")
  } else if (html.includes(FOOTER)) {
    html = html.replace(FOOTER, block + "\n" + FOOTER)
  } else continue
  writeFileSync(path, html)
  featuredPages++
}

console.log(`build-articles: built ${ARTICLES.length} article pages, featured carousel on ${featuredPages} page(s)`)
