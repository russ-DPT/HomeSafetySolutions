(() => {
  const root = document.querySelector(".featured-articles")
  if (!root) return
  const track = root.querySelector(".featured-track")
  const buttons = root.querySelectorAll(".featured-btn")
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

  const step = () => {
    const slide = track.querySelector(".featured-slide")
    if (!slide) return track.clientWidth
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0
    const perView = Math.max(1, Math.floor((track.clientWidth + gap) / (slide.offsetWidth + gap)))
    return perView * (slide.offsetWidth + gap)
  }

  const update = () => {
    const max = track.scrollWidth - track.clientWidth - 2
    buttons[0].disabled = track.scrollLeft <= 2
    buttons[1].disabled = track.scrollLeft >= max
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      track.scrollBy({ left: Number(btn.dataset.dir) * step(), behavior: reduceMotion ? "auto" : "smooth" })
    })
  })

  track.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
    e.preventDefault()
    track.scrollBy({ left: (e.key === "ArrowRight" ? 1 : -1) * step(), behavior: reduceMotion ? "auto" : "smooth" })
  })

  track.addEventListener("scroll", update, { passive: true })
  window.addEventListener("resize", update)
  update()
})()
