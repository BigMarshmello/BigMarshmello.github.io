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
});
