(function () {
  "use strict";
  var C = window.HSS_CONFIG || { stripe: {} };
  var doc = document.documentElement;
  doc.classList.add("js");

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Text size control */
  var size = store("hss-text") || "normal";
  function applySize(s) {
    if (s === "normal") doc.removeAttribute("data-text"); else doc.setAttribute("data-text", s);
    $$(".text-size button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.size === s)); });
  }
  applySize(size);
  $$(".text-size button").forEach(function (b) {
    b.addEventListener("click", function () { store("hss-text", b.dataset.size); applySize(b.dataset.size); });
  });

  /* Mobile navigation */
  var toggle = $(".menu-toggle"), nav = $("#site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
      document.body.classList.toggle("menu-open", !open);
      toggle.querySelector(".label").textContent = open ? "Menu" : "Close";
    });
  }

  /* The header is identical on every page, so the current page is marked here */
  var here = location.pathname.replace(/\.html$/, "").replace(/\/$/, "") || "/";
  $$("#site-nav a[href^='/']").forEach(function (a) {
    if (a.getAttribute("href") === here) a.setAttribute("aria-current", "page");
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    $$(".nav details[open]").forEach(function (d) { d.removeAttribute("open"); d.querySelector("summary").focus(); });
  });
  document.addEventListener("click", function (e) {
    $$(".nav details[open]").forEach(function (d) { if (!d.contains(e.target)) d.removeAttribute("open"); });
  });

  /* Header shadow once the page scrolls */
  var header = $(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }

  /* Payment links from config (booking links are plain PracticeQ hrefs, same tab) */
  $$("[data-pay]").forEach(function (a) {
    var url = C.stripe && C.stripe[a.dataset.pay];
    if (url) { a.href = url; }
    else {
      a.href = C.phoneHref || "tel:+18133659171";
      var t = a.querySelector(".label") || a;
      if (!a.dataset.keepLabel) t.textContent = "Call to pay: " + (C.phoneDisplay || "(813) 365-9171");
    }
  });

  /* Hero floor plan: draw the walkthrough once it is on screen */
  var plan = $(".floorplan");
  if (plan && !reduceMotion && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { plan.classList.add("is-live"); io.disconnect(); } });
    }, { threshold: 0.35 });
    io.observe(plan);
  }

  /* Audience chooser: one path open at a time */
  var choices = $$(".choice[aria-controls]");
  choices.forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute("aria-controls"));
    if (panel) panel.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", function () {
      var willOpen = btn.getAttribute("aria-expanded") !== "true";
      choices.forEach(function (o) {
        o.setAttribute("aria-expanded", "false");
        var p = document.getElementById(o.getAttribute("aria-controls")); if (p) p.hidden = true;
      });
      if (willOpen && panel) {
        btn.setAttribute("aria-expanded", "true"); panel.hidden = false;
        var h = panel.querySelector("h3"); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
        panel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
      }
    });
  });

  /* Ready for Discharge location screen (no health information collected) */
  var screen = $("#rfd-screen");
  if (screen) {
    var gated = $("[data-gated]"), out = $("#rfd-result");
    screen.addEventListener("change", function () {
      var p = (screen.querySelector("input[name=patient]:checked") || {}).value;
      var h = (screen.querySelector("input[name=home]:checked") || {}).value;
      if (!p || !h) return;
      if (p === "other" || h === "other") {
        gated.hidden = true;
        out.className = "status status-stop";
        out.innerHTML = "We can only provide this service when both the patient and the home are in Florida, New York, or Ohio, because those are the states where we are licensed. Call " +
          "<a href=\"" + C.phoneHref + "\">" + C.phoneDisplay + "</a> and we will help you find someone who can.";
      } else {
        gated.hidden = false;
        out.className = "status status-ok";
        out.textContent = "Good news: we can serve this discharge. Choose a session below.";
      }
    });
  }

  /* Fall risk quick check (answers stay on this device, nothing is sent) */
  var qc = $("#quickcheck");
  if (qc) {
    var step2 = $("#qc-step2"), step1Result = $("#qc-step1-result"), qcResult = $("#qc-result");
    var answer = function (name) { var c = qc.querySelector("input[name=" + name + "]:checked"); return c ? c.value : null; };
    var keyNames = ["k1", "k2", "k3"];
    var keyPositive = function () { return keyNames.some(function (n) { return answer(n) === "yes"; }); };
    var consultLink = function () {
      return "<a href=\"" + ((document.querySelector("a[data-link=CONSULT]") || {}).href || "/book#consultation") + "\">Book a consultation</a>";
    };
    var showStep2 = function () {
      step2.hidden = false;
      // Step 1 questions match checklist statements 1, 3 and 5; fill only blanks so later edits are kept.
      [["k1", "q1"], ["k2", "q3"], ["k3", "q5"]].forEach(function (pair) {
        var v = answer(pair[0]);
        if (v && !answer(pair[1])) qc.querySelector("input[name=" + pair[1] + "][value=" + v + "]").checked = true;
      });
      step2.querySelector("legend").focus();
    };

    $("#qc-next").addEventListener("click", function () {
      var answered = keyNames.filter(answer).length;
      if (answered < 3) {
        step1Result.className = "status status-warn";
        step1Result.textContent = "Answer all 3 questions to continue. You have answered " + answered + ".";
        step1Result.focus();
        return;
      }
      if (keyPositive()) {
        step1Result.className = "status status-warn";
        step1Result.textContent = "A yes to any of these questions means you may be at increased risk of falling. Mention it to your doctor. The statements below show what may be behind it.";
        showStep2();
      } else {
        step1Result.className = "status status-ok";
        step1Result.innerHTML = "You answered no to all three. That suggests average risk. It does not mean no risk, so ask these questions again each year and after any hospital stay, new medicine, or fall. " +
          "<button class=\"btn btn-secondary btn-small\" type=\"button\" id=\"qc-anyway\">Take the 12-statement check anyway</button>";
        $("#qc-anyway").addEventListener("click", showStep2);
        step1Result.focus();
      }
    });

    qc.addEventListener("submit", function (e) {
      e.preventDefault();
      var rows = $$(".qc-item[data-points]", qc), score = 0, answered = 0, reasons = [];
      rows.forEach(function (row) {
        var yes = row.querySelector("input[value=yes]:checked"), no = row.querySelector("input[value=no]:checked");
        if (yes) {
          score += Number(row.dataset.points); answered++;
          if (reasons.indexOf(row.dataset.why) < 0) reasons.push(row.dataset.why);
        } else if (no) answered++;
      });
      if (answered < rows.length) {
        qcResult.className = "status status-warn";
        qcResult.textContent = "Answer all " + rows.length + " statements to see your result. You have answered " + answered + ".";
        qcResult.focus();
        return;
      }
      var fell = answer("q1") === "yes";
      var html;
      if (score >= 4) {
        qcResult.className = "status status-warn";
        html = "<p>Your score is " + score + " out of 14. A score of 4 or more means you may be at increased risk of falling. Talk with your doctor about it, and consider a Home Safety Visit so we can look at your home and how you move through it.</p>";
      } else if (fell) {
        qcResult.className = "status status-warn";
        html = "<p>Your score is " + score + " out of 14. That is under 4, but you have fallen in the past year, and one fall is the strongest sign of another. That still means increased risk. Talk with your doctor about it, even if the fall seemed minor.</p>";
      } else if (keyPositive()) {
        qcResult.className = "status status-warn";
        html = "<p>Your score is " + score + " out of 14, which is under 4. You did answer yes in step 1, so still raise it with your doctor at your next visit.</p>";
      } else {
        qcResult.className = "status status-ok";
        html = "<p>Your score is " + score + " out of 14. That suggests average risk. It does not mean no risk. Keep your home clear and well lit, and check again if anything changes, such as a hospital stay, a new medicine, or a fall.</p>";
      }
      if (answer("q3") === "yes" && answer("q4") === "yes") {
        html += "<p>Feeling unsteady and holding onto furniture are good reasons to ask your doctor for a physical therapy referral now. You do not need to wait for more tests first.</p>";
      }
      if (reasons.length) {
        html += "<p>What your yes answers point to:</p><ul>" + reasons.map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ul>";
      }
      if (qcResult.className.indexOf("warn") >= 0) {
        html += "<p>Print this page and bring it to your Medicare Annual Wellness Visit. " + consultLink() + " to talk with Dr. L'HommeDieu about becoming safer at home.</p>";
      }
      qcResult.innerHTML = html;
      qcResult.focus();
    });

    qc.addEventListener("reset", function () {
      [step1Result, qcResult].forEach(function (r) { r.className = "qc-result"; r.textContent = ""; });
      step2.hidden = true;
    });
  }

  /* Contractor directory: vetted partners first, then companies not yet vetted */
  var dir = $("#directory");
  if (dir) {
    var tierSel = $("#f-tier"), count = $("#dir-count"), pending = $("#directory-pending"), all = [];
    var TIER = { handyman: "Handyman", contractor: "Licensed contractor (to confirm)", trades: "Licensed trades", specialty: "Specialty equipment", unconfirmed: "Type of work to be confirmed" };
    var TIER_V = { handyman: "Handyman", contractor: "Licensed contractor", trades: "Licensed trades", specialty: "Specialty equipment" };
    function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }
    function card(c) {
      var v = !!c.vetted;
      return "<article class=\"contractor" + (v ? "" : " contractor-pending") + "\">" +
        (v ? "" : "<p class=\"pending-flag\">Not yet vetted</p>") +
        "<h3>" + esc(c.name) + "</h3>" +
        "<p><span class=\"tag\">" + esc((v ? TIER_V : TIER)[c.tier] || c.tier) + "</span>" +
        (v && c.caps ? "<span class=\"tag tag-caps\">CAPS certified</span>" : "") +
        (!v && c.capsConfirmed ? "<span class=\"tag tag-caps\">CAPS since " + esc(c.capsConfirmed) + " (NAHB directory)</span>" : "") +
        (!v && !c.capsConfirmed && c.capsListed ? "<span class=\"tag\">Listed as CAPS in a directory (unconfirmed)</span>" : "") +
        (c.basedIn ? "<span class=\"tag\">" + (/confirm/.test(c.basedIn) ? esc(c.basedIn) : "Based in " + esc(c.basedIn)) + "</span>" : "") + "</p>" +
        (c.services ? "<p>" + esc(c.services) + "</p>" : "") +
        (c.contactName ? "<p><strong>Contact:</strong> " + esc(c.contactName) + "</p>" : "") +
        (c.address ? "<p><strong>Address:</strong> " + esc(c.address) + "</p>" : "") +
        (c.license ? "<p><strong>Florida license:</strong> " + esc(c.license) + "</p>" : "") +
        (c.phone ? "<p><strong>Phone:</strong> <a href=\"tel:" + esc(c.phone.replace(/[^0-9+]/g, "")) + "\">" + esc(c.phone) + "</a></p>" : "") +
        (c.email ? "<p><strong>Email:</strong> <a href=\"mailto:" + esc(c.email) + "\">" + esc(c.email) + "</a></p>" : "") +
        (c.website ? "<p><a href=\"" + esc(c.website) + "\" target=\"_blank\" rel=\"noopener\">Website</a></p>" : "") +
        "<p class=\"price-note\">" + (v ? "Vetted " + esc(c.verified) : "Source: " + esc(c.source)) + "</p></article>";
    }
    function render() {
      var t = tierSel.value;
      var list = all.filter(function (c) { return !t || c.tier === t; });
      var vetted = list.filter(function (c) { return c.vetted; }), notYet = list.filter(function (c) { return !c.vetted; });
      count.textContent = vetted.length + " vetted " + (vetted.length === 1 ? "partner" : "partners") + ", " + notYet.length + " not yet vetted";
      dir.innerHTML = vetted.length ? vetted.map(card).join("") :
        "<div class=\"empty\"><p>" + (t ? "No vetted partners for this type of work yet. " : "We are vetting our first partners now. ") +
        "Check back soon, or ask Dr. L'HommeDieu on your consultation call.</p></div>";
      if (pending) pending.innerHTML = notYet.length ? notYet.map(card).join("") :
        "<div class=\"empty\"><p>No companies in this group match these filters.</p></div>";
    }
    var fromPage = window.HSS_CONTRACTORS;
    (fromPage ? Promise.resolve(fromPage) : fetch("/data/contractors.json", { cache: "no-store" }).then(function (r) { return r.json(); }))
      .then(function (d) { all = (d.contractors || []).filter(function (c) { return c.published; }); render(); })
      .catch(function () { all = []; render(); });
    tierSel.addEventListener("change", render);
  }

  /* Contractor application */
  var app = $("#contractor-apply");
  if (app) {
    app.addEventListener("submit", function (e) {
      e.preventDefault();
      var out = $("#apply-status"), btn = app.querySelector("button[type=submit]");
      var data = {};
      new FormData(app).forEach(function (v, k) { if (data[k]) data[k] = [].concat(data[k], v); else data[k] = v; });
      btn.disabled = true; out.className = "status"; out.textContent = "Sending your application.";
      fetch("/api/contractor-apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error(res.j && res.j.error || "Send failed");
          out.className = "status status-ok"; out.textContent = "Application received. We will email you within 5 business days with next steps and where to send your license and insurance certificates.";
          app.reset();
        })
        .catch(function (err) {
          out.className = "status status-stop";
          out.innerHTML = "Your application did not send (" + err.message + "). Please try again, or email it to <a href=\"mailto:" + C.email + "\">" + C.email + "</a>.";
        })
        .finally(function () { btn.disabled = false; out.focus(); });
    });
  }

  /* Service area map: use the custom Google My Maps embed when configured */
  var map = document.getElementById("service-map");
  if (map && C.serviceAreaMap) map.src = C.serviceAreaMap;

  /* Print buttons */
  $$("[data-print]").forEach(function (b) { b.addEventListener("click", function () { window.print(); }); });

  var y = $("#year"); if (y) y.textContent = new Date().getFullYear();

})();
