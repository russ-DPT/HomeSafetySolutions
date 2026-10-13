import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { generateSpeech } from "ai"
import { parse, type HTMLElement } from "node-html-parser"

// Narration is read from the page HTML on the server, never from text the
// browser sends, so this route can only ever speak the site's own pages.

export const maxDuration = 60

const MODEL = "microsoft/mai-voice-2.1"
const FIRST_PART_CHARS = 450
const PART_CHARS = 1400
const BLOCKS = "h1,h2,h3,h4,p,li,blockquote,dt,dd,tr,figcaption"
const SKIP = [
  "script", "style", "noscript", "svg", "form", "iframe", "button", "nav", "table thead",
  ".breadcrumb", ".stripe-rule", ".narrate", ".no-narrate", ".article-sources", ".article-video",
  "[aria-hidden=true]", "[hidden]",
].join(",")

const PUBLIC_DIR = path.join(process.cwd(), "public")
const partsCache = new Map<string, { parts: string[]; version: string }>()

function fileForPath(pagePath: string) {
  if (!/^\/[a-z0-9-]*(\/[a-z0-9-]+)?$/.test(pagePath)) return null
  if (pagePath === "/") return "index.html"
  if (pagePath === "/resources/pace") return "resources-pace.html"
  if (pagePath.lastIndexOf("/") > 0) return null
  return `${pagePath.slice(1)}.html`
}

function speakable(el: HTMLElement) {
  const tag = el.tagName.toLowerCase()
  const text = (tag === "tr"
    ? el.querySelectorAll("th,td").map((c) => c.text.trim()).filter(Boolean).join(", ")
    : el.text)
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim()
  if (!text) return ""
  return /^h[1-4]$/.test(tag) && !/[.!?:]$/.test(text) ? `${text}.` : text
}

function toParts(blocks: string[]) {
  const parts: string[] = []
  let current = ""
  for (const block of blocks) {
    const limit = parts.length === 0 ? FIRST_PART_CHARS : PART_CHARS
    if (current && current.length + block.length + 1 > limit) {
      parts.push(current)
      current = block
    } else {
      current = current ? `${current}\n${block}` : block
    }
  }
  if (current) parts.push(current)
  return parts
}

async function loadNarration(pagePath: string) {
  const file = fileForPath(pagePath)
  if (!file) return null
  const cached = partsCache.get(file)
  if (cached) return cached

  let html: string
  try {
    html = await readFile(path.join(PUBLIC_DIR, file), "utf8")
  } catch {
    return null
  }

  const main = parse(html).querySelector("main")
  if (!main) return null
  main.querySelectorAll(SKIP).forEach((el) => el.remove())

  const blockEls = main.querySelectorAll(BLOCKS)
  const set = new Set(blockEls)
  const blocks = blockEls
    .filter((el) => {
      for (let p = el.parentNode; p && p !== main; p = p.parentNode) if (set.has(p)) return false
      return true
    })
    .map(speakable)
    .filter(Boolean)

  const parts = toParts(blocks)
  const version = createHash("sha256").update(MODEL).update(parts.join("\u0000")).digest("hex").slice(0, 12)
  const result = { parts, version }
  if (process.env.NODE_ENV === "production") partsCache.set(file, result)
  return result
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const pagePath = url.searchParams.get("path") ?? ""
  const narration = await loadNarration(pagePath)
  if (!narration || narration.parts.length === 0) {
    return Response.json({ error: "This page has no narration." }, { status: 404 })
  }

  const partParam = url.searchParams.get("part")
  if (partParam === null) {
    return Response.json(
      { parts: narration.parts.length, version: narration.version },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400" } },
    )
  }

  const part = Number(partParam)
  if (!Number.isInteger(part) || part < 0 || part >= narration.parts.length) {
    return Response.json({ error: "Unknown part." }, { status: 404 })
  }
  if (url.searchParams.get("v") !== narration.version) {
    return Response.json({ error: "Page changed. Reload narration." }, { status: 409 })
  }

  try {
    const { audio } = await generateSpeech({
      model: MODEL,
      text: narration.parts[part],
      instructions: "Read warmly and clearly at a calm, unhurried pace, like a friendly clinician explaining something to an older adult and their family.",
    })
    return new Response(audio.uint8Array as BodyInit, {
      headers: {
        "Content-Type": audio.mediaType || "audio/mpeg",
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("[narrate] speech generation failed:", error)
    return Response.json({ error: "Narration is unavailable right now." }, { status: 502 })
  }
}
