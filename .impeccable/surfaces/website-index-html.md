---
version: 1
slug: "website-index-html"
primary_target: "archive/website_v2/index.html"
related_targets: ["archive/website_v2/docs"]
---

---
version: 1
slug: "website-index-html"
primary_target: "archive/website_v2/index.html"
related_targets: ["archive/website_v2/docs"]
---

# mgit website

**Superseded.** This records the first 2.x site, archived at `archive/website_v2/`. The site that ships now is a different design with a live sandbox; see `website/README.md`.

**Scope and visitor mode:** `archive/website_v2/index.html` (Persuade) plus the logbook docs layer under `archive/website_v2/docs/` (Read). zh-TW primary with a full EN mirror at `archive/website_v2/en/`, matching README.md / README.en.md. Static HTML/CSS and a small amount of vanilla JS, no framework, no external services, hostable from GitHub Pages.

**Audience and job:** a developer whose parent folder holds many repositories, who needs to know what state the whole fleet is in; and a first-time visitor who has never heard of mgit.

**Action and proof:** copy one install line (`curl -fsSL .../install.sh | sh`, secondary `npx @willh/mgit`). Real evidence only: the recorded session captured from the real binary, the 80-`=` section rule, `📂 Folder: … │ Branch: …`, silence for a clean repository, `✗ folder (exit code N)` summary lines, exit codes, 8 release targets with SHA256SUMS.txt, the npm package with six platform binaries and no postinstall, MIT.

**Constraints:** no invented testimonials, download counts, benchmarks or capabilities; demo data labelled as a recorded session; color never the only carrier of state; WCAG AA contrast, full keyboard reach, reduced-motion honored, 380px to 1600px.

**Unresolved:** font delivery beyond the two self-hosted latin faces, OG image origin, whether the docs layer stays one page per chapter.

## Direction contract

THESIS: The whole site is one instrument. A single strip of chart paper advances under N pens, one channel per repository: a flat line is a clean repo, the spike is the one that needs you, and the run closes in a totals band at the foot of the paper. It refuses the category's card grid and its hero-plus-install-box arrangement.

OWN-WORLD: Chart paper `#F5F6F4` as the ground, with a **neutral** structure family doing all the ruling — `#E8EBE9` hairlines, `#D7DCDA` standard rules, `#BCC4C2` strong rules — and the 2px ink rules of the document itself. Nothing in the interface is coloured except data: channel blue `#0F5C86` for clean, graphite `#15161A` for dirty, alarm `#B01B1B` for failures, each paired with a printed mark and a word. The instrument's paper window is a real photograph of chart paper at about a fifth strength under the page's own paper colour, with one whisper of a rule every 40px and the scale as edge ticks: a printed chart, never graph paper. Lettering is instrument panel caps (Archivo, expanded at display sizes), a technical mono for data (JetBrains Mono), and a subset CJK display face behind Archivo; three AI-generated **background textures** (`archive/website_v2/assets/plates/`, provenance embedded, never depicting an object: paper fibre under the page ground, graphite lacquer behind the dark plates and the footer, chart paper inside the strip) carry the material instead of decorating with pictures. Components are the instrument's: channel legend, punched white windows for the few commands that are the page's own action, printed command lines for the rest, an engraved spec plate, a start switch for the copy control, and a margin index holding the chapter's own sections beside the text.

STORY: A visitor reads one sweep and understands "one command, every repository, one report"; the first band after the instrument names the classic case in the user's own words (repositories scattered across one working directory, referring to each other, with no git submodule) so a programmer recognises their own workspace immediately; then the recorded run, the exit code and the install line make it believable, and the logbook carries the rest.

FIRST VIEWPORT: The paper window fills the first viewport. The printed head carries the wordmark and the install line with the copy switch at its end; the legend column down the left names `CH 01` … `CH 06` with the real repository names from the recorded session; the strip carries six real traces, five flat and one with a dark-red spike marked with an event mark and its word; the foot of the paper prints the run's state vocabulary (clean · dirty · failed · interrupted · no repos) and the exit code the run returned. Scale: the strip is the page's full width, the legend is a narrow printed column, the head is a single band.

FORM: Strip-chart fleet recorder, position 4 of my ordered grounded list, seed key `661c3832`.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
