// Marks the section the reader is in within the "In this guide" contents list.
(function () {
  var nav = document.querySelector(".article-toc");
  if (!nav || !("IntersectionObserver" in window)) return;
  var links = {};
  nav.querySelectorAll('a[href^="#"]').forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
  var heads = Object.keys(links).map(function (id) { return document.getElementById(id); }).filter(Boolean);
  if (!heads.length) return;

  function setCurrent(id) {
    Object.keys(links).forEach(function (k) {
      if (k === id) links[k].setAttribute("aria-current", "true");
      else links[k].removeAttribute("aria-current");
    });
  }

  function update() {
    var line = window.innerHeight * 0.3, current = null;
    heads.forEach(function (h) { if (h.getBoundingClientRect().top <= line) current = h.id; });
    setCurrent(current);
  }

  var io = new IntersectionObserver(update, { rootMargin: "0px 0px -60% 0px" });
  heads.forEach(function (h) { io.observe(h); });
  window.addEventListener("scroll", update, { passive: true });
  update();
})();
