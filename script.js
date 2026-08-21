// The radar sweep and its contacts are pure CSS animations. This parks them
// (animation-play-state: paused, via the .radar-idle class) whenever the hero
// is off-screen, so no compositor work happens while the user reads further
// down the page. Without an observer the animation keeps ticking forever.
function initRadarVisibility() {
  const hero = document.querySelector(".hero, .error-hero");
  if (!hero) return;

  if (!("IntersectionObserver" in window)) return; // animation just runs as normal

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        hero.classList.toggle("radar-idle", !entry.isIntersecting);
      });
    },
    { threshold: 0 }
  );

  observer.observe(hero);
}

// Types out the tagline's existing text once on load, then leaves it alone.
// Deliberately does NOT loop: the tagline is the page's primary identifying
// line, and a type/delete cycle left it unreadable most of the time.
function typeTaglineOnce(el) {
  const text = el.textContent;
  const TYPE_SPEED = 45;

  let i = 0;
  el.textContent = "";

  (function tick() {
    i++;
    el.textContent = text.slice(0, i);
    if (i < text.length) setTimeout(tick, TYPE_SPEED);
  })();
}

// Custom crosshair cursor. Skipped entirely on touch/no-hover devices and when
// the user prefers reduced motion.
function initCustomCursor() {
  const noHover = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (noHover || prefersReducedMotion) return;

  const INTERACTIVE_SELECTOR = "a, button, .filter-btn, .skill-point";

  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  dot.setAttribute("aria-hidden", "true");
  document.body.appendChild(dot);
  document.body.classList.add("custom-cursor-active");

  let mouseX = 0;
  let mouseY = 0;
  let rafScheduled = false;

  function updateDotPosition() {
    dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
    rafScheduled = false;
  }

  window.addEventListener(
    "mousemove",
    (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!rafScheduled) {
        rafScheduled = true;
        requestAnimationFrame(updateDotPosition);
      }
    },
    { passive: true }
  );

  document.addEventListener("mouseover", (e) => {
    dot.classList.toggle("cursor-dot--hover", !!e.target.closest(INTERACTIVE_SELECTOR));
  });
}

// Fades + slides each section's content up into place as it enters the
// viewport. Grouped items (project cards, skill points) get a small
// incremental delay so they cascade in rather than popping simultaneously.
function initScrollReveal() {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (prefersReducedMotion || !("IntersectionObserver" in window)) return;

  const STAGGER_MS = 80;
  const targets = [];

  function addGroup(elements) {
    elements.filter(Boolean).forEach((el, i) => {
      el.classList.add("reveal");
      el.style.setProperty("--reveal-delay", `${i * STAGGER_MS}ms`);
      targets.push(el);
    });
  }

  addGroup([document.querySelector(".hero-content")]);
  addGroup([
    document.querySelector(".about .section-title"),
    document.querySelector(".about-content"),
  ]);
  addGroup([
    document.querySelector(".projects .section-title"),
    document.querySelector(".projects .section-subtitle"),
    document.querySelector(".project-filters"),
  ]);
  addGroup(Array.from(document.querySelectorAll(".project-card")));
  addGroup([document.querySelector(".skills .section-title")]);
  addGroup(Array.from(document.querySelectorAll(".skill-point")));
  addGroup([
    document.querySelector(".contact .section-title"),
    document.querySelector(".contact .section-subtitle"),
    document.querySelector(".contact-links"),
  ]);

  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  targets.forEach((el) => observer.observe(el));
}

// Highlights the left-gutter marker for whichever section is crossing the
// middle of the viewport. The rootMargin collapses the observer's root to a
// thin band at the vertical centre, so exactly one contiguous section is
// "active" at a time (and none while the hero is centred, which is correct).
function initGutterMarkers() {
  const markers = document.querySelectorAll(".gutter-marker");
  if (!markers.length || !("IntersectionObserver" in window)) return;

  const markerForSection = new Map();
  markers.forEach((marker) => {
    const section = document.getElementById(marker.dataset.section);
    if (section) markerForSection.set(section, marker);
  });
  if (!markerForSection.size) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const marker = markerForSection.get(entry.target);
        if (marker) marker.classList.toggle("is-active", entry.isIntersecting);
      });
    },
    { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
  );

  markerForSection.forEach((_, section) => observer.observe(section));
}

// Theme toggle. Dark is the CSS default (bare :root), so light is opt-in via a
// data-theme attribute on <html>. The choice is held in a plain variable for
// the life of the page — deliberately NOT localStorage/sessionStorage — so it
// resets to dark on reload.
function initThemeToggle() {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  let theme = "dark";

  function apply() {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    btn.textContent = theme === "dark" ? "[DARK]" : "[LIGHT]";
    btn.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
    );
  }

  btn.addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark";
    apply();
  });

  apply();
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

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const taglineEl = document.getElementById("tagline");
  if (taglineEl && !prefersReducedMotion) {
    typeTaglineOnce(taglineEl);
  }

  const filterButtons = document.querySelectorAll(".filter-btn");
  const projectCards = document.querySelectorAll(".project-card");

  if (filterButtons.length && projectCards.length) {
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.dataset.filter;

        filterButtons.forEach((b) => b.classList.toggle("is-active", b === btn));

        projectCards.forEach((card) => {
          const categories = (card.dataset.category || "").split(" ");
          const show = filter === "all" || categories.includes(filter);
          card.classList.toggle("is-hidden", !show);
        });
      });
    });
  }

  initThemeToggle();
  initGutterMarkers();
  initRadarVisibility();
  initCustomCursor();
  initScrollReveal();
});
