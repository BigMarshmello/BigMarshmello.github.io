// Randomly spawns "radar ping" blips inside the hero's radar-sweep circle.
function spawnRadarBlip(container) {
  const blip = document.createElement("span");
  blip.className = "radar-blip";

  // random point within a circle (sqrt keeps the distribution uniform, not center-heavy)
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.sqrt(Math.random()) * 48; // % from center, stays inside the ring
  blip.style.left = 50 + radius * Math.cos(angle) + "%";
  blip.style.top = 50 + radius * Math.sin(angle) + "%";

  blip.addEventListener("animationend", () => blip.remove());
  container.appendChild(blip);
}

function startRadarBlips(container) {
  (function scheduleNext() {
    const delay = 700 + Math.random() * 1600;
    setTimeout(() => {
      spawnRadarBlip(container);
      scheduleNext();
    }, delay);
  })();
}

// Types out the tagline's existing text, holds, deletes, then retypes — looping forever.
function startTypewriterLoop(el) {
  const text = el.textContent;
  const TYPE_SPEED = 45;
  const DELETE_SPEED = 25;
  const HOLD_TIME = 1800;
  const GAP_TIME = 400;

  let i = 0;
  let deleting = false;

  function tick() {
    if (!deleting) {
      i++;
      el.textContent = text.slice(0, i);
      if (i === text.length) {
        deleting = true;
        setTimeout(tick, HOLD_TIME);
        return;
      }
      setTimeout(tick, TYPE_SPEED);
    } else {
      i--;
      el.textContent = text.slice(0, i);
      if (i === 0) {
        deleting = false;
        setTimeout(tick, GAP_TIME);
        return;
      }
      setTimeout(tick, DELETE_SPEED);
    }
  }

  tick();
}

// Custom radar-blip cursor + throttled ping trail. Skipped entirely on
// touch/no-hover devices and when the user prefers reduced motion.
function initCustomCursor() {
  const noHover = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (noHover || prefersReducedMotion) return;

  const INTERACTIVE_SELECTOR = "a, button, .filter-btn, .skill-point";
  const BLIP_INTERVAL = 120; // ms between trail blips while moving

  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  dot.setAttribute("aria-hidden", "true");
  document.body.appendChild(dot);
  document.body.classList.add("custom-cursor-active");

  let mouseX = 0;
  let mouseY = 0;
  let rafScheduled = false;
  let lastBlipTime = 0;

  function updateDotPosition() {
    dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
    rafScheduled = false;
  }

  function spawnTrailBlip(x, y) {
    const blip = document.createElement("span");
    blip.className = "cursor-trail-blip";
    blip.style.left = x + "px";
    blip.style.top = y + "px";
    blip.addEventListener("animationend", () => blip.remove());
    document.body.appendChild(blip);
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

      const now = performance.now();
      if (now - lastBlipTime > BLIP_INTERVAL) {
        lastBlipTime = now;
        spawnTrailBlip(mouseX, mouseY);
      }
    },
    { passive: true }
  );

  document.addEventListener("mouseover", (e) => {
    dot.classList.toggle("cursor-dot--hover", !!e.target.closest(INTERACTIVE_SELECTOR));
  });
}

// Slim fixed bar at the top of the viewport that fills as the user scrolls down.
function initScrollProgress() {
  const bar = document.createElement("div");
  bar.className = "scroll-progress-bar";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);

  let ticking = false;

  function update() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight =
      document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = pct + "%";
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );

  update();
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
    startTypewriterLoop(taglineEl);
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

  const radarBlips = document.getElementById("radarBlips");
  if (radarBlips && !prefersReducedMotion) {
    startRadarBlips(radarBlips);
  }

  initCustomCursor();
  initScrollProgress();
});
