# Portfolio Site

A single-page e-portfolio built with plain HTML, CSS, and JS — no frameworks,
no build step. Open `index.html` directly in a browser, or serve it with any
static file server.

## File structure

```
.
├── index.html      # all page content and section markup
├── style.css       # all styling, organized by numbered section comments
├── script.js       # mobile nav toggle + footer year (only JS needed)
├── img/            # photos, project screenshots, icons
└── docs/           # linked PDFs (resume, transcript, reports)
```

## Editing content

Search `index.html` for `[PLACEHOLDER: ...]` — every one marks text you
should replace with your own copy: your name, tagline, bio paragraphs,
project details, email address, and social links.

### Adding a new project card

1. Open `index.html` and find the `<!-- PROJECT CARD TEMPLATE -->` comments
   inside the `<div class="project-grid">` block (section `PROJECTS`).
2. Copy one whole `<article class="project-card">...</article>` block and
   paste it as a new sibling inside `.project-grid`.
3. Edit inside your new block:
   - `project-title` — the project name
   - `project-desc` — a 1–2 sentence description
   - each `<li class="tag">` — a technology used (add/remove `<li>`s as needed)
   - the two `<a>` links in `project-links` — point to the GitHub repo and
     live demo (delete the demo link if there isn't one)
   - replace the `<div class="image-placeholder">` with
     `<img src="img/your-screenshot.png" alt="Description of the project">`
     once you have a screenshot in `/img`
4. No CSS changes needed — the grid (`.project-grid` in `style.css`, section 7)
   automatically reflows to fit any number of cards.

### Adding images and documents

- Drop photos/screenshots/icons into `img/` and reference them as
  `img/filename.png`.
- Drop PDFs (resume, transcript, reports) into `docs/` and link them as
  `docs/filename.pdf` (see the "Download Resume" link in the About section).

### Changing the accent color / theme

All design tokens (colors, spacing, radius, shadows) live at the top of
`style.css` under `1. DESIGN TOKENS`, inside `:root { ... }`. Change
`--color-accent` to re-theme the whole site.

## Deploying to GitHub Pages

This repo is named `<username>.github.io`, which GitHub treats as a special
**user site** repo — whatever is on the `main` branch at the repo root is
served directly at `https://<username>.github.io/`.

1. Create the GitHub repository with that exact name (replace `<username>`
   with your actual GitHub username), if you haven't already.
2. Push this project to it:
   ```bash
   git remote add origin https://github.com/<username>/<username>.github.io.git
   git branch -M main
   git add .
   git commit -m "Initial portfolio site"
   git push -u origin main
   ```
3. In the GitHub repo, go to **Settings → Pages** and confirm the source is
   set to "Deploy from a branch" → `main` / `/ (root)`. (For a
   `<username>.github.io` repo this is usually enabled automatically.)
4. Wait a minute or two, then visit `https://<username>.github.io/`.

Any future `git push` to `main` redeploys the site automatically — no build
step required.
