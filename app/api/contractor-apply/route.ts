// Receives the contractor application and emails it via Resend.
// Environment variables (Vercel > Project > Settings > Environment Variables):
//   RESEND_API_KEY   from resend.com
//   NOTIFY_EMAIL     where applications go, e.g. info@homesafety.solutions
//   FROM_EMAIL       a verified sender on your domain, e.g. "HSS Website <apply@yourdomain.com>"
// Contractor applications contain no health information.

const clean = (v: unknown, max = 2000) =>
  String(Array.isArray(v) ? v.join(", ") : v ?? "")
    .replace(/[<>]/g, "")
    .slice(0, max)
    .trim()

export async function GET() {
  return Response.json({ error: "Use POST" }, { status: 405 })
}

export async function POST(req: Request) {
  let b: Record<string, unknown> = {}
  try {
    b = (await req.json()) as Record<string, unknown>
  } catch {
    b = {}
  }

  if (b.website_confirm) return Response.json({ ok: true }) // honeypot: silently accept bots

  const required = ["company", "contact", "email", "phone", "example", "terms"]
  const missing = required.filter((k) => !clean(b[k]))
  if (missing.length) return Response.json({ error: "Please complete: " + missing.join(", ") }, { status: 400 })
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean(b.email)))
    return Response.json({ error: "Please enter a valid email" }, { status: 400 })

  const fields: [string, unknown][] = [
    ["Company", b.company],
    ["Contact", b.contact],
    ["Email", b.email],
    ["Phone", b.phone],
    ["Website", b.website],
    ["Florida license", b.license],
    ["Tiers", b.tier],
    ["Zones", b.zones],
    ["CAPS", b.caps],
    ["Insurance", b.insurance],
    ["Response time", b.response],
    ["Proud example", b.example],
    ["Agreed to partner terms", b.terms ? "Yes" : "No"],
  ]
  const text = fields.map(([k, v]) => `${k}: ${clean(v)}`).join("\n")

  if (!process.env.RESEND_API_KEY || !process.env.NOTIFY_EMAIL || !process.env.FROM_EMAIL) {
    return Response.json({ error: "The application inbox is not set up yet" }, { status: 500 })
  }

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL,
        to: [process.env.NOTIFY_EMAIL],
        reply_to: clean(b.email, 200),
        subject: `Contractor application: ${clean(b.company, 120)}`,
        text,
      }),
    })
    if (!r.ok) return Response.json({ error: "Email service error" }, { status: 502 })
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: "Could not reach the email service" }, { status: 502 })
  }
}
