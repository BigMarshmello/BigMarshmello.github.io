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

  const radarBlips = document.getElementById("radarBlips");
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (radarBlips && !prefersReducedMotion) {
    startRadarBlips(radarBlips);
  }
});
