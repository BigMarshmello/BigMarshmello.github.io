// Edit these to change what the hero tagline cycles through — the first
// entry is shown as-is if JS never runs, so keep it as the "real" tagline.
const TAGLINE_PHRASES = [
  "Final year Electrical & Computer Engineering student at UCT",
  "Embedded systems engineer",
  "Radar & signal processing",
  "Mechanical design tinkerer",
];

function startTypewriter(el, phrases) {
  const TYPE_SPEED = 45;
  const DELETE_SPEED = 25;
  const HOLD_TIME = 1800;
  const GAP_TIME = 400;

  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function tick() {
    const current = phrases[phraseIndex];

    if (!deleting) {
      charIndex++;
      el.textContent = current.slice(0, charIndex);
      if (charIndex === current.length) {
        deleting = true;
        setTimeout(tick, HOLD_TIME);
        return;
      }
      setTimeout(tick, TYPE_SPEED);
    } else {
      charIndex--;
      el.textContent = current.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        setTimeout(tick, GAP_TIME);
        return;
      }
      setTimeout(tick, DELETE_SPEED);
    }
  }

  tick();
}

// Mobile nav toggle + smooth-scroll close-on-click + footer year.
document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const isOpen = navMenu.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navMenu.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const taglineEl = document.getElementById("tagline");
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (taglineEl && !prefersReducedMotion) {
    startTypewriter(taglineEl, TAGLINE_PHRASES);
  }
});
