// Builds a printable PDF for every article in content/articles.
// Runs before build-articles.mjs (see "prebuild" in package.json), so each
// deploy regenerates the PDFs from the same Markdown the web pages use.
//
// Writes public/assets/pdf/<slug>.pdf and public/assets/pdf/manifest.json
// ({ slug: { pages, kb } }), which build-articles.mjs reads to label the
// "Download PDF" button with the page count and file size.
// Fonts (Open Sans + Poppins, SIL OFL) live in scripts/fonts.

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import PDFDocument from "pdfkit"
import sharp from "sharp"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const PUB = join(ROOT, "public")
const CONTENT = join(ROOT, "content", "articles")
const FONTS = join(ROOT, "scripts", "fonts")
const OUT = join(PUB, "assets", "pdf")
const SITE = "https://www.homesafety.solutions"
const CONSULT = "https://intakeq.com/booking/zm1cyz?serviceId=7c400002-9dcd-4689-a8e5-1e075c4c5d9c"

const C = { ink: "#13293D", soft: "#4B5563", gulf: "#0B3D62", line: "#C9DAEA", stripe: "#F4B400", stripeSoft: "#FFF3CC", seaglass: "#EEF5FB" }
const PAGE = { size: "LETTER", margin: 60 }
const W = 612 - PAGE.margin * 2
const BODY = 11
const GAP = 3

const data = JSON.parse(readFileSync(join(CONTENT, "articles.json"), "utf8"))
const pad = (n) => String(n).padStart(2, "0")
const longDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number)
  return `${["January","February","March","April","May","June","July","August","September","October","November","December"][m - 1]} ${d}, ${y}`
}
const absUrl = (h) => (/^https?:\/\//.test(h) ? h : h.startsWith("#") ? null : SITE + (h.startsWith("/") ? h : "/" + h))

function loadArticle(a) {
  const lines = readFileSync(join(CONTENT, `${pad(a.n)}-${a.slug}.md`), "utf8").split("\n")
  const title = lines[0].replace(/^#\s*/, "").trim()
  let body = lines.slice(1).filter((l) => !l.startsWith("*By Russ") && !/^[A-Z][a-z]{2} \d{1,2}, \d{4} · @/.test(l)).join("\n")
  body = body.split(`${SITE}/pricing`).join("/services").replace(/\(\/pricing\)/g, "(/services)")
  return { title, body }
}

// Inline Markdown -> runs of { text, bold, italic, link }.
function runs(text) {
  const out = []
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*\s][^*]*?)\*/g
  let last = 0, m
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) })
    if (m[1]) out.push(...runs(m[1]).map((r) => ({ ...r, link: absUrl(m[2]) })))
    else if (m[3]) out.push(...runs(m[3]).map((r) => ({ ...r, bold: true })))
    else out.push({ text: m[4], italic: true })
    last = re.lastIndex
  }
  if (last < text.length) out.push({ text: text.slice(last) })
  return out
}
const plain = (text) => runs(text).map((r) => r.text).join("")

function fontFor(r) { return r.bold ? "bold" : r.italic ? "italic" : "regular" }

function writeRuns(doc, rs, x, width, opts = {}) {
  const size = opts.size || BODY
  const color = opts.color || C.ink
  doc.x = x
  rs.forEach((r, i) => {
    const last = i === rs.length - 1
    doc.font(fontFor(r)).fontSize(size).fillColor(r.link ? C.gulf : color)
    doc.text(r.text, { width, lineGap: GAP, continued: !last, link: r.link || null, underline: !!r.link, align: "left" })
  })
  doc.x = PAGE.margin
}

function ensure(doc, h) {
  if (doc.y + h > doc.page.height - PAGE.margin - 20) doc.addPage()
}

function heading(doc, text, lvl) {
  const size = lvl === 2 ? 16 : 13
  ensure(doc, size * 2 + 60)
  doc.moveDown(lvl === 2 ? 0.9 : 0.6)
  doc.font(lvl === 2 ? "head" : "headSemi").fontSize(size).fillColor(C.gulf).text(plain(text), PAGE.margin, doc.y, { width: W, lineGap: 1 })
  doc.moveDown(0.35)
}

function list(doc, items, ordered) {
  const indent = 18
  items.forEach((item, i) => {
    const rs = runs(item)
    doc.font("regular").fontSize(BODY)
    ensure(doc, doc.heightOfString(plain(item), { width: W - indent, lineGap: GAP }) > 80 ? 40 : doc.heightOfString(plain(item), { width: W - indent, lineGap: GAP }))
    const y = doc.y
    doc.font(ordered ? "bold" : "regular").fillColor(ordered ? C.gulf : C.ink).text(ordered ? `${i + 1}.` : "\u2022", PAGE.margin + 2, y, { width: indent, lineGap: GAP })
    doc.y = y
    writeRuns(doc, rs, PAGE.margin + indent, W - indent)
    doc.moveDown(0.25)
  })
  doc.moveDown(0.4)
}

function table(doc, head, rows) {
  const cols = head.length
  const size = 9.5
  const padX = 6, padY = 5
  doc.fontSize(size)
  const weight = head.map((h, c) => Math.max(plain(h).length, ...rows.map((r) => Math.min(plain(r[c] || "").length, 90))) + 6)
  const longestWord = head.map((h, c) => {
    doc.font("bold").fontSize(size)
    const words = [h, ...rows.map((r) => r[c] || "")].flatMap((t) => plain(t).split(/\s+/))
    return Math.max(...words.map((w) => doc.widthOfString(w))) + padX * 2 + 2
  })
  const mins = longestWord.map((m) => Math.min(m, W / cols * 1.6))
  const spare = Math.max(0, W - mins.reduce((s, v) => s + v, 0))
  const total = weight.reduce((s, v) => s + v, 0)
  let widths = mins.map((m, c) => m + spare * (weight[c] / total))
  const scale = W / widths.reduce((s, v) => s + v, 0)
  widths = widths.map((v) => v * scale)
  const rowH = (cells, font) => {
    doc.font(font).fontSize(size)
    return Math.max(...cells.map((c, i) => doc.heightOfString(plain(c || ""), { width: widths[i] - padX * 2, lineGap: 1 }))) + padY * 2
  }
  const drawRow = (cells, isHead) => {
    const font = isHead ? "bold" : "regular"
    const h = rowH(cells, font)
    const y = doc.y
    let x = PAGE.margin
    if (isHead) doc.rect(PAGE.margin, y, W, h).fill(C.seaglass)
    cells.forEach((c, i) => {
      doc.font(font).fontSize(size).fillColor(C.ink).text(plain(c || ""), x + padX, y + padY, { width: widths[i] - padX * 2, lineGap: 1 })
      x += widths[i]
    })
    doc.moveTo(PAGE.margin, y + h).lineTo(PAGE.margin + W, y + h).lineWidth(0.6).strokeColor(C.line).stroke()
    doc.y = y + h
    doc.x = PAGE.margin
  }
  doc.moveDown(0.3)
  ensure(doc, rowH(head, "bold") + rowH(rows[0] || head, "regular"))
  drawRow(head, true)
  for (const r of rows) {
    if (doc.y + rowH(r, "regular") > doc.page.height - PAGE.margin - 20) { doc.addPage(); drawRow(head, true) }
    drawRow(r, false)
  }
  doc.moveDown(0.8)
}

function note(doc, text) {
  const padding = 10
  doc.font("regular").fontSize(10)
  const h = doc.heightOfString(plain(text), { width: W - padding * 2 - 4, lineGap: 2 }) + padding * 2
  ensure(doc, h)
  const y = doc.y
  doc.rect(PAGE.margin, y, W, h).fill(C.stripeSoft)
  doc.rect(PAGE.margin, y, 4, h).fill(C.stripe)
  doc.y = y + padding
  writeRuns(doc, runs(text), PAGE.margin + padding + 4, W - padding * 2 - 4, { size: 10 })
  doc.y = y + h
  doc.moveDown(0.8)
}

function body(doc, md) {
  const lines = md.split("\n")
  let i = 0
  let inSources = false
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }
    let m
    if ((m = line.trim().match(/^\{\{youtube:([A-Za-z0-9_-]{11})\|([^}]+)\}\}$/))) {
      writeRuns(doc, [{ text: "Video: ", bold: true }, { text: m[2] + ". " }, { text: "Watch on YouTube", link: `https://www.youtube.com/watch?v=${m[1]}` }], PAGE.margin, W)
      doc.moveDown(0.6); i++; continue
    }
    if ((m = line.match(/^(#{2,4})\s+(.*)$/))) {
      inSources = m[2].trim() === "Sources"
      heading(doc, m[2].trim(), Math.min(m[1].length, 3)); i++; continue
    }
    if (/^\s*>/.test(line)) {
      const q = []
      while (i < lines.length && /^\s*>/.test(lines[i])) { q.push(lines[i].replace(/^\s*>\s?/, "")); i++ }
      note(doc, q.join(" ").trim()); continue
    }
    if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|\s*:?-{3,}/.test(lines[i + 1])) {
      const cells = (l) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim())
      const head = cells(line)
      i += 2
      const rows = []
      while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(cells(lines[i])); i++ }
      table(doc, head, rows); continue
    }
    if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      const ordered = /^\d+\./.test(line)
      const re = ordered ? /^\d+\.\s+/ : /^[-*]\s+/
      const items = []
      while (i < lines.length && re.test(lines[i])) {
        let item = lines[i].replace(re, "")
        i++
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !re.test(lines[i])) { item += " " + lines[i].trim(); i++ }
        items.push(item)
        while (i < lines.length && !lines[i].trim() && i + 1 < lines.length && re.test(lines[i + 1])) i++
      }
      if (inSources) {
        items.forEach((it) => { ensure(doc, 30); writeRuns(doc, runs(it), PAGE.margin, W, { size: 9.5, color: C.soft }); doc.moveDown(0.3) })
        doc.moveDown(0.4)
      } else list(doc, items, ordered)
      continue
    }
    const para = [line.trim()]
    i++
    while (i < lines.length && lines[i].trim() && !/^(#{2,4}\s|[-*]\s|\d+\.\s|\s*\||\s*>)/.test(lines[i])) { para.push(lines[i].trim()); i++ }
    const text = para.join(" ")
    doc.font("regular").fontSize(BODY)
    ensure(doc, Math.min(doc.heightOfString(plain(text), { width: W, lineGap: GAP }), 45))
    writeRuns(doc, runs(text), PAGE.margin, W, inSources ? { size: 9.5, color: C.soft } : {})
    doc.moveDown(0.7)
  }
}

async function heroImage(a) {
  const local = join(PUB, "assets", "img", "articles", `${a.slug}.webp`)
  try {
    let buf
    if (existsSync(local)) buf = readFileSync(local)
    else if (a.thumbUrl) { const r = await fetch(a.thumbUrl); if (r.ok) buf = Buffer.from(await r.arrayBuffer()) }
    if (!buf) return null
    return await sharp(buf).resize(1280, 720, { fit: "cover" }).flatten({ background: "#ffffff" }).jpeg({ quality: 82 }).toBuffer()
  } catch (e) {
    console.warn(`build-article-pdfs: no image for ${a.slug} (${e.message})`)
    return null
  }
}

const LOGO = join(PUB, "assets", "img", "logo-horizontal.png")

async function build(a) {
  const { title, body: md } = loadArticle(a)
  const published = a.published || data.published
  const url = `${SITE}/${a.slug}`
  const doc = new PDFDocument({
    size: PAGE.size, margin: PAGE.margin, bufferPages: true,
    info: { Title: title, Author: "Russ L'HommeDieu, DPT, ATP", Subject: a.meta || "", Creator: "Home Safety Solutions", CreationDate: new Date(`${published}T12:00:00Z`), ModDate: new Date(`${published}T12:00:00Z`) },
    lang: "en-US", displayTitle: true,
  })
  doc.registerFont("regular", join(FONTS, "OpenSans-Regular.ttf"))
  doc.registerFont("bold", join(FONTS, "OpenSans-Bold.ttf"))
  doc.registerFont("italic", join(FONTS, "OpenSans-Italic.ttf"))
  doc.registerFont("head", join(FONTS, "Poppins-Bold.ttf"))
  doc.registerFont("headSemi", join(FONTS, "Poppins-SemiBold.ttf"))
  const chunks = []
  doc.on("data", (c) => chunks.push(c))
  const done = new Promise((r) => doc.on("end", r))

  if (existsSync(LOGO)) doc.image(LOGO, PAGE.margin, PAGE.margin - 10, { height: 34 })
  doc.font("regular").fontSize(9).fillColor(C.soft).text("homesafety.solutions", PAGE.margin, PAGE.margin + 2, { width: W, align: "right" })
  doc.y = PAGE.margin + 44
  doc.font("bold").fontSize(9).fillColor(C.soft).text((a.kicker || "Article").toUpperCase(), PAGE.margin, doc.y, { width: W, characterSpacing: 1 })
  doc.moveDown(0.3)
  doc.font("head").fontSize(22).fillColor(C.ink).text(title, { width: W, lineGap: 2 })
  doc.moveDown(0.4)
  doc.rect(PAGE.margin, doc.y, 56, 4).fill(C.stripe)
  doc.y += 14
  doc.font("bold").fontSize(10).fillColor(C.ink).text("By Russ L'HommeDieu, DPT, ATP", PAGE.margin, doc.y, { width: W, continued: true })
  doc.font("regular").fillColor(C.soft).text(`  ·  Doctor of Physical Therapy and RESNA Assistive Technology Professional  ·  ${longDate(published)}`)
  doc.moveDown(0.8)

  const img = await heroImage(a)
  if (img) {
    const h = W * (720 / 1280)
    doc.image(img, PAGE.margin, doc.y, { width: W, height: h })
    doc.y += h + 16
  }

  body(doc, md)

  ensure(doc, 90)
  doc.moveDown(0.6)
  const y = doc.y
  doc.rect(PAGE.margin, y, W, 76).fill(C.gulf)
  doc.font("head").fontSize(13).fillColor("#FFFFFF").text("Want a plan for your own home?", PAGE.margin + 16, y + 14, { width: W - 32 })
  doc.font("regular").fontSize(10).fillColor("#FFFFFF").text("Every service starts with an Initial Consultation, a 30-minute phone call with Dr. L'HommeDieu. ", { width: W - 32, continued: true, lineGap: 2 })
  doc.font("bold").text("Book at homesafety.solutions", { link: CONSULT, underline: true })

  const range = doc.bufferedPageRange()
  for (let p = range.start; p < range.start + range.count; p++) {
    doc.switchToPage(p)
    const bottom = doc.page.margins.bottom
    doc.page.margins.bottom = 0
    const fy = doc.page.height - 38
    doc.moveTo(PAGE.margin, fy - 8).lineTo(PAGE.margin + W, fy - 8).lineWidth(0.6).strokeColor(C.line).stroke()
    doc.font("regular").fontSize(8.5).fillColor(C.soft)
    doc.text(url.replace("https://www.", ""), PAGE.margin, fy, { width: W / 2, link: url, lineBreak: false })
    doc.text(`Page ${p + 1} of ${range.count}`, PAGE.margin + W / 2, fy, { width: W / 2, align: "right", lineBreak: false })
    doc.page.margins.bottom = bottom
  }
  doc.end()
  await done
  const file = join(OUT, `${a.slug}.pdf`)
  writeFileSync(file, Buffer.concat(chunks))
  return { pages: range.count, kb: Math.round(statSync(file).size / 1024) }
}

mkdirSync(OUT, { recursive: true })
const manifest = {}
for (const a of data.articles) manifest[a.slug] = await build(a)
writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n")
console.log(`build-article-pdfs: wrote ${Object.keys(manifest).length} PDFs to public/assets/pdf`)
