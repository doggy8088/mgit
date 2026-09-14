---
name: mgit website
description: A strip-chart fleet recorder printed on paper — one pen per repository, specs on an engraved plate.
colors:
  paper: "#f5f6f4"
  paper-deep: "#eceeea"
  rule-hair: "#e8ebe9"
  rule: "#d7dcda"
  rule-strong: "#bcc4c2"
  window: "#ffffff"
  ink: "#15161a"
  ink-2: "#4b4d53"
  ink-3: "#616369"
  blue: "#0f5c86"
  blue-deep: "#0a3f5c"
  alarm: "#b01b1b"
  plate: "#191a1d"
  plate-2: "#22242a"
  plate-ink: "#edede8"
  plate-dim: "#a3a199"
  plate-blue: "#7fb6d6"
  plate-alarm: "#e58a86"
  plate-rule: "rgba(237, 237, 232, 0.2)"
  plate-rule-soft: "rgba(237, 237, 232, 0.1)"
  # The paper objects are made of stock, not of a theme: the --sheet-* family is
  # the ramp the strip, the runlog and the official install window re-declare in
  # dark, and it holds the same values in both themes. The light --paper / --ink
  # / --rule / --window / --select are pure aliases of it (values unchanged).
  sheet: "#f5f6f4"
  sheet-deep: "#eceeea"
  sheet-window: "#ffffff"
  sheet-rule: "#d7dcda"
  sheet-rule-strong: "#bcc4c2"
  sheet-ink: "#15161a"
  sheet-ink-2: "#4b4d53"
  sheet-ink-3: "#616369"
  sheet-blue: "#0f5c86"
  sheet-blue-deep: "#0a3f5c"
  sheet-alarm: "#b01b1b"
  sheet-select: "#dce7ee"
  select: "#dce7ee"
  plate-body: "#cfcdc6"
  plate-cell: "#d6d4cd"
  plate-blue-deep: "#a5cfe6"
  # The dark desk (:root[data-theme="dark"] in site.css): only the desk and the
  # panel move, and every key below re-resolves the token above it. No --sheet-*
  # value changes in either theme.
  paper-dark: "#191a1d"
  paper-deep-dark: "#101114"
  rule-dark: "rgba(237, 237, 232, 0.1)"
  rule-strong-dark: "rgba(237, 237, 232, 0.2)"
  window-dark: "#22242a"
  ink-dark: "#edede8"
  ink-2-dark: "#c9c7bf"
  ink-3-dark: "#aeaca4"
  blue-dark: "#7fb6d6"
  blue-deep-dark: "#a5cfe6"
  alarm-dark: "#ea9793"
  plate-dim-dark: "#aeaca4"
  plate-alarm-dark: "#ea9793"
  select-dark: "#14374c"
typography:
  display:
    fontFamily: "Archivo, \"mgit Display\", -apple-system, BlinkMacSystemFont, \"PingFang TC\", \"Noto Sans TC\", \"Microsoft JhengHei\", sans-serif"
    fontSize: "clamp(2rem, 3.55vw, 3.0625rem)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.024em"
  headline:
    fontFamily: "Archivo, \"mgit Display\", -apple-system, BlinkMacSystemFont, \"PingFang TC\", \"Noto Sans TC\", \"Microsoft JhengHei\", sans-serif"
    fontSize: "clamp(1.5rem, 2.5vw, 2.25rem)"
    fontWeight: 600
    lineHeight: 1.16
    letterSpacing: "-0.016em"
  title:
    fontFamily: "Archivo, \"mgit Display\", -apple-system, BlinkMacSystemFont, \"PingFang TC\", \"Noto Sans TC\", \"Microsoft JhengHei\", sans-serif"
    fontSize: "clamp(1.9rem, 3vw, 2.6rem)"
    fontWeight: 600
    lineHeight: 1.16
    letterSpacing: "-0.012em"
  subhead:
    fontFamily: "Archivo, \"mgit Display\", -apple-system, BlinkMacSystemFont, \"PingFang TC\", \"Noto Sans TC\", \"Microsoft JhengHei\", sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.16
  intro:
    fontFamily: "Archivo, -apple-system, BlinkMacSystemFont, \"PingFang TC\", \"Noto Sans TC\", \"Microsoft JhengHei\", sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 400
    lineHeight: 1.55
  lede:
    fontFamily: "Archivo, -apple-system, BlinkMacSystemFont, \"PingFang TC\", \"Noto Sans TC\", \"Microsoft JhengHei\", sans-serif"
    fontSize: "clamp(1.125rem, 1.5vw, 1.3125rem)"
    fontWeight: 400
    lineHeight: 1.55
  case:
    fontFamily: "Archivo, -apple-system, BlinkMacSystemFont, \"PingFang TC\", \"Noto Sans TC\", \"Microsoft JhengHei\", sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Archivo, -apple-system, BlinkMacSystemFont, \"PingFang TC\", \"Noto Sans TC\", \"Microsoft JhengHei\", sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.65
    fontFeature: "tabular-nums"
  label:
    fontFamily: "Archivo, -apple-system, BlinkMacSystemFont, \"PingFang TC\", \"Noto Sans TC\", \"Microsoft JhengHei\", sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.11em"
  panel-caps:
    fontFamily: "Archivo, -apple-system, BlinkMacSystemFont, \"PingFang TC\", \"Noto Sans TC\", \"Microsoft JhengHei\", sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.13em"
  data:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, \"SF Mono\", Menlo, Consolas, \"Liberation Mono\", monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.65
  command:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, \"SF Mono\", Menlo, Consolas, \"Liberation Mono\", monospace"
    fontSize: "0.9375rem"
    fontWeight: 500
  data-log:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, \"SF Mono\", Menlo, Consolas, \"Liberation Mono\", monospace"
    fontSize: "0.78125rem"
    fontWeight: 400
    lineHeight: 1.7
  data-small:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, \"SF Mono\", Menlo, Consolas, \"Liberation Mono\", monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.04em"
  figure:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, \"SF Mono\", Menlo, Consolas, \"Liberation Mono\", monospace"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.15
rounded:
  focus-ring: "1px"
  scrollbar-thumb: "8px"
spacing:
  u: "8px"
  s1: "8px"
  s2: "16px"
  s3: "24px"
  s4: "32px"
  s5: "48px"
  s6: "72px"
  s7: "112px"
  s8: "160px"
components:
  window:
    backgroundColor: "{colors.window}"
    textColor: "{colors.ink}"
    padding: "0.55rem 0.65rem 0.55rem 0.75rem"
  window-command:
    typography: "{typography.data}"
    textColor: "{colors.ink}"
  switch:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "0.42rem 0.6rem"
  switch-copied:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  replay-button:
    backgroundColor: "{colors.window}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "0.4rem 0.6rem"
  instrument-frame:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    width: "100%"
  window-plate:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.plate-ink}"
    padding: "0.55rem 0.65rem 0.55rem 0.75rem"
  legend-panel:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.plate-ink}"
    padding: "16px 0"
  paperhead-case:
    textColor: "{colors.ink-2}"
    padding: "16px 0 0"
  band-intro:
    textColor: "{colors.ink-2}"
    padding: "16px 0 0"
  legend-row:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-3}"
    typography: "{typography.data-small}"
    padding: "0.3rem 16px"
  plate:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.plate-ink}"
    padding: "32px"
  plate-figure:
    typography: "{typography.figure}"
    textColor: "{colors.plate-ink}"
  plate-row-term:
    typography: "{typography.data}"
    textColor: "{colors.plate-ink}"
  runlog:
    backgroundColor: "{colors.window}"
    textColor: "{colors.ink}"
  runlog-bar:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.plate-ink}"
    typography: "{typography.data-small}"
    padding: "0.4rem 0.75rem"
  docs-row:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "24px 0"
  docs-row-hover:
    backgroundColor: "{colors.window}"
    textColor: "{colors.ink}"
  docs-nav-item:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-2}"
    padding: "0.45rem 0.5rem 0.45rem 0.35rem"
  docs-nav-item-current:
    backgroundColor: "{colors.window}"
    textColor: "{colors.ink}"
  lang-switch:
    backgroundColor: "{colors.window}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    padding: "0.35rem 0.6rem"
  lang-switch-current:
    textColor: "{colors.ink}"
  theme-switch:
    backgroundColor: "{colors.window}"
    textColor: "{colors.ink}"
    width: "34px"
    height: "34px"
  theme-switch-dark-on:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    width: "34px"
    height: "34px"
  callout:
    backgroundColor: "{colors.window}"
    textColor: "{colors.ink-2}"
    padding: "24px"
  cmdline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.command}"
    padding: "0.5rem 0"
  cmdline-note:
    textColor: "{colors.ink-3}"
    typography: "{typography.data-small}"
  switch-ghost:
    backgroundColor: "none"
    textColor: "{colors.ink-3}"
    typography: "{typography.label}"
    padding: "0.15rem 0.25rem"
  switch-ghost-hover:
    textColor: "{colors.ink}"
  switch-ghost-copied:
    textColor: "{colors.blue}"
  toc-title:
    textColor: "{colors.ink-3}"
    typography: "{typography.label}"
    padding: "0 0 16px"
  toc-item:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-2}"
    padding: "0.4rem 0.4rem 0.4rem 0.3rem"
  toc-item-hover:
    backgroundColor: "{colors.window}"
    textColor: "{colors.ink}"
  toc-item-level3:
    textColor: "{colors.ink-3}"
  rules:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-2}"
    padding: "0.6rem 0 0.6rem 1.9rem"
  rules-number:
    textColor: "{colors.ink-3}"
    typography: "{typography.data-small}"
  band-footnote:
    textColor: "{colors.ink-2}"
    padding: "24px 0 0"
  runlog-body:
    backgroundColor: "{colors.window}"
    textColor: "{colors.ink}"
    typography: "{typography.data-log}"
    padding: "16px 24px"
  runlog-hint:
    textColor: "{colors.ink-3}"
    typography: "{typography.data-small}"
---

# Design System: mgit website

## Overview

**Creative North Star: "The Strip-Chart Fleet Recorder"**

The whole site is one instrument. A single strip of chart paper advances under N pens, one pen per repository: a flat line is a clean repository, the excursion is the one that needs you, and the run closes in a totals band printed at the foot of the paper. The page therefore has no cards, no icon grid and no hero-plus-install-box; it has a printed head, a dark lane legend wired to the strip, and bands of the same continuous paper separated by a hairline rule and 112px of quiet. The vocabulary is plain throughout: the legend's number column is headed `#`, the documentation is 文件 / Docs, and chapter numbers are plain two-digit `01`–`08` — no coined shorthand.

The materials are a print room's, not a UI kit's. Paper runs edge to edge and the texture under it is real — after dark it is graphite that runs edge to edge, and the sheet becomes an object standing on it. The grain of a photographed sheet (`plates/paper-fibre.jpg`) is re-laid on the token's own tone, so the stock carries tooth at the exact `#f5f6f4` and no overlay stands between the material and the reader. The chart paper is the instrument's own material and appears only inside the strip: `plates/chart-paper.jpg` (grain re-laid on `#f5f6f4` at σ 4.4), one 1px printed rule every 40px, and 40px ticks down both edges, so no rule and no pattern ever runs through a line of prose. Dark objects are lacquered rather than filled — the plate, the footer, the lane legend, the graphite install window and the runlog bar all carry `plates/graphite-plate.jpg`, its grain re-laid on `#191a1d` at σ 4.0 (and after dark the four that stay panels — plate, footer, legend, runlog bar — carry `plates/graphite-plate-2.jpg`, the same photograph on `#22242a`). What carries the rest of the world is rules: the 2px ink rules that divide the page, the dotted 1px hairlines between legend, navigation, margin-index and table rows, the docs row rules, the margin rule beside the chapter rail, and the engraved plate. Content is ink — graphite, link blue, alarm red — and nothing else (on the dark desk the same three meanings print in the plate family's inks; the ground changes, the meanings do not). Anything that must feel physical is printed as an object: a punched window for a chapter's own action (white on paper, the sheet itself after dark), a printed monospace command line on the paper for everything else, a dark engraved plate for specs and calibration figures, a printed frame for the recorded terminal session. Depth is a printing metaphor (a lifted sheet, a seated plate, a punched hole), never a light source.

The build refines the direction contract in one place: the clean pen draws in link blue, not graphite, and graphite is spent on the dirty pen. The build wins; the pen vocabulary below is the shipped one.

Two themes, one world. `document.documentElement.dataset.theme` switches between the instrument on a lit desk and the same instrument after dark: the desk and the panel go graphite — `--plate #191a1d` under the desk's own lacquer, `--plate-2 #22242a` for the objects that stand on it — and **the paper objects stay paper**: the strip keeps `#f5f6f4` + chart-paper, the runlog and the official install window take `#fff` + paper-fibre. In dark the official install window is the page's **brightest** object, which is how the "one heaviest action" invariant survives the flip; `color-scheme` follows the theme, an inline head script sets the attribute before the first paint (`localStorage["mgit-theme"]`, then `prefers-color-scheme`), and `@media print` always forces the sheet.

**Key Characteristics:**

- One continuous sheet: `paper-chart` and `paper-log` both repaint `var(--paper)` over one photographed texture — `#f5f6f4` + fibre in light, `--plate #191a1d` + graphite lacquer after dark; the chart paper is the strip's own material, not the page's; sections are bands, never cards.
- Three inks carry meaning — graphite, link blue, alarm on paper; plate ivory, plate blue, plate alarm on the dark desk — and colour means data and nothing else: the structure layer is neutral rule greys, the light landing measures 0.23% warm pixels at 1600px (all of it alarm ink), and the dark one 0.301% coloured pixels against light's 0.296% with an identical hue histogram.
- Instrument components: a dark lane legend wired to the strip, an engraved plate, a recorded-session frame, a five-word state vocabulary, a numbered rule list.
- Three AI-generated textures carry material and nothing else — fibre under the page, chart paper in the strip, lacquered graphite behind the plate, the legend, the graphite window and the runlog bar — each re-laid on its token's own tone so the grain is visible without a scrim, and never a depicted object; the dark theme ships a fourth file from the same photograph (`graphite-plate-2.jpg`, grain re-laid on `#22242a`) so a panel still reads as an object on an already-dark desk.
- Two themes, one world: a material variant, not a hue inversion — after dark the desk and the panel go graphite and every paper object re-declares the `--sheet-*` ramp and stays paper; a 34px keycap in the head toggles it, and print always forces the sheet.
- On paper, commands are printed lines (`.cmdline` with a text-only copy switch) and only a chapter's own action keeps the punched window — white on paper, and after dark the sheet itself, standing on graphite.
- A margin index holds the chapter's own sections beside the text at ≥1280px (sticky, 232px) and as a compact list above the prose below that.
- Square corners throughout; hierarchy is rule weight (1px hair, 2px structure) and printed marks.
- One authored moment: the carriage sweep that draws the traces in 2400ms, with a replay control and a reduced-motion settle.
- Three type voices: Archivo (variable width) for lettering and text, "mgit Display" (a Noto Sans TC subset) for CJK display, JetBrains Mono for data.

## Colors

A printed page's palette in two materials: plain warm paper, and the desk it stands on. In light the desk is the sheet; after dark the desk is the plate and the sheet stays the sheet. Either way a neutral rule family only ever draws structure, graphite prints text, one link blue carries healthy data and links, one alarm red carries failure, and the instrument plate keeps its own four inks. The paper objects are made of stock, not of a theme: the `--sheet-*` family (`--sheet #f5f6f4`, `--sheet-window #ffffff`, `--sheet-ink #15161a`, `--sheet-blue #0f5c86`, `--sheet-alarm #b01b1b`, …) is the ramp the strip, the runlog and the official install window re-declare in dark, and `--paper` / `--ink` / `--rule` / `--window` / `--select` are pure aliases of it in light — same values, unchanged — that re-resolve to the plate family after dark.

### Primary

- **Link Blue** (#0f5c86): the system's action ink — links, the 2px `:focus-visible` outline, the clean pen (2.2px), the clean swatch in the state vocabulary. Hovering deepens it to **Deep Link Blue** (#0a3f5c). On the dark desk `--blue` re-resolves to **Plate Blue** (#7fb6d6) and its hover to **Plate Blue Deep** (#a5cfe6), because `#0f5c86` measures only 2.40:1 on graphite: the link ink moves with the ground (5.58 worst-grain in dark).

### Secondary

- **Alarm Red** (#b01b1b): the failure ink, always paired with a word or a code — the failed pen (2.6px), the cross mark, the exit-code tick, the failing line inside a runlog, the failed state word in a legend. Its only two non-failure appearances are pointers, not meaning: the text caret and the 6px square that marks the open docs chapter.

### Tertiary

- **Hairline Rule Grey** (#e8ebe9): declared in the palette and currently unspent — the strip's 40px whisper line moved up to Rule Grey, so nothing draws with it.
- **Rule Grey** (#d7dcda): the workhorse separator — the 40px whisper line inside the strip, the dotted 1px hairline between legend rows, docs navigation items, margin-index items and table rows, the rule above the runlog's scroll hint, and the scrollbar track.
- **Strong Rule Grey** (#bcc4c2): one step louder, for anything that has to hold a line against paper: the strip's lane dividers (dashed 2/6), the strip's edge ticks (12px columns of 40px rules down each end), the rule under a command line, and the scrollbar thumb.

The pink grid family that once ruled the paper (`#efa8b4`, `#dd8d9a`, `#ecd2d6`) is retired from the stylesheet: the structure layer carries no colour now, and the strip's chart paper is a photograph rather than a drawn grid.

### Neutral

- **Chart Paper** (#f5f6f4): the light page ground and, in both themes, the stock the paper objects are made of (`--sheet`). Both body classes repaint it over the fibre texture in light and over the graphite lacquer in dark, and the strip's field keeps it either way. **Deep Paper** (#eceeea): the pressed state of the copy switch; after dark `--paper-deep` re-resolves to `#101114`, the pressed step on a graphite desk.
- **Punched White** (#ffffff): the system's only white value, and still an opening rather than a surface — punched windows (windows, the runlog body, callouts), the replay and language switches, and the hovered or current row. After dark it belongs to the paper objects: the runlog and the official install window take `--sheet-window` + paper-fibre, so the install window becomes the page's brightest object.
- **Graphite** (#15161a): body and headings, the wordmark, 1px frames, the run tag, the dirty pen, the flag mark. After dark `--ink` re-resolves to **Plate Ivory** (#edede8) and the desk's ink prints light.
- **Graphite 2** (#4b4d53): the second voice for anything that explains rather than asserts — the hero lede, band intros, the hero case line, the instrument note, callout and procedure prose, table heads, rule-list items, band footnotes, docs-row descriptions, docs navigation and margin-index items, the language switch's idle link, the vocabulary word default, the interrupted / no-repos swatch, and the summary line inside a runlog. The dirty state word uses it only on paper (≤620px); on the graphite legend (≥621px) dirty prints in Plate Ivory. After dark it is `#c9c7bf`.
- **Graphite 3** (#616369): 12px chrome and quiet lines — labels, captions, lane and chapter numbers, spec stamps, the command-line note, dimmed vocabulary words, the runlog's rule and quiet lines, the strip's ticks. Set against the *measured* darkest grain (226/255 — the fibre's tail is heavier than a Gaussian, so a ±σ estimate is not enough), not against the token: 4.64:1 there, 5.51:1 on the token's own `#f5f6f4`, per the note beside the token in `site.css`. After dark it re-resolves to **Plate Dim** `#aeaca4`, measured 5.39 against the desk's *lightest* grain (52/255) — the mirror of the same habit.
- **Instrument Plate** (#191a1d): the dark engraved object (plates and footer) on paper, and after dark the desk itself — the body wears `graphite-plate.jpg` on it. **Plate Deep** (#22242a): after dark, the step the panels stand on (legend, plate, footer, runlog bar on `graphite-plate-2.jpg`) and the flat fill of every punch and keycap — the separation that keeps a panel an object on an already-dark desk.
- **Plate Ivory** (#edede8): plate titles, row terms and calibration figures on the engraved plate; repository names, the dirty word and the command on the graphite legend and window; the runlog bar's title; and in dark the desk's body ink. **Plate Dim** (#a3a199, after dark `#aeaca4`): plate spec stamps, figure captions, footer group titles and colophon; the legend's chrome, its clean word and the runlog bar's meta. It was lifted because the panel moved up a step: 4.06 against plate-2's lightest grain before, 4.62 after.
- **Plate Blue** (#7fb6d6): links inside plates and the footer; after dark also the desk's own `--blue` and the focus ring on graphite. **Plate Alarm** (#e58a86, after dark `#ea9793`): the failed state word on a graphite legend — the one failure ink the dark panel can carry at legible contrast (4.67 against plate-2's lightest grain).
- **Plate Rules** — `rgba(237, 237, 232, 0.2)` and `rgba(237, 237, 232, 0.1)`: the engraved hairlines on dark surfaces. The 0.2 alpha draws the legend head rule, the plate head rule, the spec-table header rule, the graphite window's switch border and its scrollbar, and the footer colophon rule; the 0.1 alpha draws the legend row rules, the plate's interior rows and the spec-table row rules. After dark the same two hairlines become the desk's structure: `--rule` is the 0.1 alpha and `--rule-strong` the 0.2, so every divider on the graphite desk is an ivory hairline rather than a grey one.

**The desk, after dark.** The dark block keys on `:root[data-theme="dark"]` and re-resolves the aliases against the plate family: `--ink → --plate-ink`, `--ink-2 → #c9c7bf`, `--ink-3 → --plate-dim`, `--blue → --plate-blue`, `--blue-deep → --plate-blue-deep`, `--alarm → --plate-alarm`, `--paper → --plate`, `--paper-deep → #101114`, `--window → --plate-2`, `--rule → --plate-rule-soft`, `--rule-strong → --plate-rule`, `--select → #14374c`. Only two light-theme tokens were lifted, because the panel moved up a step: `--plate-dim` `#a3a199 → #aeaca4` and `--plate-alarm` `#e58a86 → #ea9793` (measured 4.62 and 4.67 against plate-2's lightest grain, up from 4.06 and 4.16). No light-theme value changed, and no `--sheet-*` value changes in either theme. Desk text was measured against the desk's *lightest* grain (52/255, the tail of the graphite plate): `--ink` 10.43, `--ink-2` 7.24, `--ink-3` 5.39, `--blue` 5.58, `--alarm` 5.45. The paper objects keep their own measured inks: `--sheet-ink` 13.94, `--sheet-ink-2` 6.51, `--sheet-ink-3` 4.63 (4.761 on the strip's chips after they moved to paper-fibre), `--sheet-blue` 5.59, `--sheet-alarm` 5.36.

Four literals that used to sit outside the token layer were promoted so the dark theme could re-declare them: the `::selection` wash (`--select`, `#dce7ee` light / `#14374c` dark), the plate link hover (`--plate-blue-deep #a5cfe6`), and the plate body text ramp (`--plate-body #cfcdc6`, `--plate-cell #d6d4cd`) — light pixels unchanged. The textures carry no overlay values at all — their grain is re-laid on the token colour itself, so the mean of every shipped plate *is* the token. The recorded output's rule lines no longer carry a fifth hue: they print in Graphite 3.

### Named Rules

**The Structure-Only Rule.** Ruling is neutral and carries no colour: the three rule greys — and, after dark, the desk's ivory hairlines at 0.1/0.2 alpha — draw every separator, tick, table rule and scrollbar, and they never carry text, never border a control or a message, and never encode state. Colour in this system means data and nothing else — outside the pens, their marks and the failure word the page is neutral: the shipped landing measures 0.23% warm pixels across a 1600px page, all of it alarm ink, and the dark page 0.301% coloured pixels with the same hue histogram (light 0.296%).

**The Instrument-Grid Rule.** Chart paper is the strip's material, not the page's: a photographed sheet whose grain is re-laid on the token tone at σ 4.4 (no scrim), a 1px printed rule every 40px, and 40px ticks down both edges. Reading surfaces carry their structure through rules — 2px dividers, dotted 1px hairlines, the margin rule — never through a ruled pattern under text; the page's own ground may carry a material texture at a whisper, but never a grid.

**The Alarm-Pairs-With-a-Word Rule.** An alarm mark never arrives alone: it ships with a printed word (`失敗` / `failed`), a code (`exit 128`) or a cross, so color is never the only carrier of state.

**The Punched-White Rule.** White is an opening, not a surface: a window, a runlog, a callout, a switch, or the hovered/current row. No band, no section, no page is white; after dark the same openings stand on graphite and the official install window is the page's brightest object — a punched hole is still a hole.

**The Material-Variant Rule.** A theme here is a material variant of one world, never a hue inversion: the desk and the panel change material and the paper objects stay paper, re-declaring the `--sheet-*` ramp on the strip, the runlog and the official install window. A theme that repaints a paper object, or that inverts hues without moving a material, is a different world — and no desk or panel may be a flat fill in either theme (dark measures σ 3.49–5.67 across its material surfaces, every one above 3).

## Typography

**Display Font:** Archivo (variable, `wdth` 62–125 / `wght` 100–900, latin subset) with **"mgit Display"** — a 44 KB Noto Sans TC subset, `wght` 100–900 — behind it in the `--display` stack
**Body Font:** Archivo (same face, same stack in `--sans`)
**Label/Mono Font:** JetBrains Mono (`wght` 100–800, latin subset)

**Character:** an instrument panel's lettering. One grotesque used at three widths (the variable face is set to 104/106/108/116/122% for panel caps and headings), a technical mono for anything a reader could paste into a shell, and a CJK display subset so the Chinese headings keep the drawn voice of the Latin ones instead of falling to a platform face.

### Hierarchy

- **Page headline** (700, `clamp(2rem, 3.55vw, 3.0625rem)`, line-height 1.02, tracking -0.024em, width 108%, 38ch): the single h1 per page, display stack — the biggest voice on the site, so the hero reads as a poster.
- **Section headline** (600, `clamp(1.5rem, 2.5vw, 2.25rem)`, 1.16, -0.016em, width 104%; chapter titles `clamp(1.9rem, 3vw, 2.6rem)`, -0.012em): band titles and chapter titles.
- **Prose heading** (600, 1.16, display stack; `clamp(1.5rem, 2.2vw, 2rem)` for h2 in a section, 1.25rem for h3): inside reading content; the h3 step sits clear of the 1.0625rem body instead of crowding it.
- **Lede** (400, `clamp(1.125rem, 1.5vw, 1.3125rem)`, 1.55, Graphite 2, 46ch): the one explanation under a headline.
- **Chapter intro** (400, 1.1875rem, 1.55, Graphite 2, 64ch, `text-wrap: pretty`): the subtitle under a docs chapter title; a smaller measure than the prose it introduces, so it reads as a standfirst, with orphan words wrapped away.
- **Case line** (400, 0.9375rem, 1.5, Graphite 2, 62ch): the hero's plain-language example under the install window.
- **Body** (400, 1.0625rem, 1.65, Graphite, tabular numerals, 68ch `--measure`): prose; notes, captions and plate definitions step down to 0.9375rem, 0.875rem at the smallest.
- **Panel caps** (600, 0.8125rem, uppercase, tracking 0.12–0.13em, width 116%): plate titles and procedure names.
- **Label** (600, 0.75rem, uppercase, tracking 0.11em, width 108%, Graphite 3): printed labels on windows, callouts, notes, table captions and heads, footer groups, pager links, the margin index title.
- **Data** (JetBrains Mono, 400, 0.8125rem, 1.65): plate terms, spec tables, the legend's run metadata.
- **Command text** (JetBrains Mono, 500, 0.9375rem): the monospace line of a `.cmdline`, one step heavier than the data it replaces so a command reads as the page's instruction rather than as a caption.
- **Recorded data** (JetBrains Mono, 400, 0.78125rem, 1.7): the lines inside a runlog frame, sized so a recorded 80-column line fits its column instead of scrolling; it drops to 0.6875rem at ≤620px.

The ladder at 1440px runs h1 49 → h2 36 → hero lede 21 → body and band intro 17 → 15 → 14 → 13 → 12px, so the eye always has a next step down. Orphan control is part of the type system, not a nicety: `.prose`, `.band__intro`, `.docmain__intro` and the rule list all set `text-wrap: pretty`, so a last line never leaves one word behind (the rule list's third item measured a 30px last line before this; it now wraps whole).
- **Data chrome** (JetBrains Mono, 400–500, 0.75rem, tracking 0.04–0.06em): lane numbers (`01`…`06`), chapter numbers (`01`…`08`), spec stamps, run tags, captions, strip ticks (12px/500); legend repository names are 0.8125rem/500.
- **Calibration figure** (JetBrains Mono, 400, 1.5rem, 1.15): the plate's four numbers, each followed by a 0.875rem Archivo explanation.

### Named Rules

**The Three Voices Rule.** Archivo for lettering and text, "mgit Display" for CJK at display sizes, JetBrains Mono for data, paths, commands and tables. No fourth face, and mono is never a costume for "technical" — it is reserved for things that are literally code, data or measurement.

**The Panel-Caps Rule.** Every all-caps line in this system is small: 0.75–0.8125rem, 0.09–0.13em tracking, 108/116% width. Large display caps do not exist here.

**The Subset Rule.** "mgit Display" carries only the 155 characters the shipped headings use; anything outside that set falls back to the platform CJK stack, which is not the world's voice. New zh-TW display copy must be added to the subset, or it arrives in a platform face.

**The Tabular Rule.** All numerals are `tabular-nums`; counts, exit codes and durations must align in columns without a mono face.

## Layout

A 1440px shell (`--shell`) centered with `clamp(16px, 4vw, 48px)` side padding. The spacing rhythm is one 8px unit: `--u` with `--s1`–`--s8` = 8 / 16 / 24 / 32 / 48 / 72 / 112 / 160px. Shipped rules consume `s1`–`s7`; `s8` (160px) is declared headroom. Reading measures are explicit: 68ch for prose (`--measure`), 74ch for a band intro, 64ch for a chapter intro, 62ch for the hero's case line and plate definitions, 46ch for a lede, 74ch for a docs-row description.

Bands sit on the same paper: `padding-block: 112px` (72px at ≤900px) with a 1px Graphite top rule; a band head keeps a 48px gap to its content, and its intro is fixed at 1.0625rem (17px), line-height 1.6, `max-width: 74ch` with `text-wrap: pretty`, so the last line never leaves one word behind (measured 1440/1200/1000/800px: every band intro is 1–3 lines, none orphaned; 390px: 1–5 lines). Two-column content uses `repeat(auto-fit, minmax(min(320px, 100%), 1fr))` with 48/72px gaps; stacked groups use 24px (48px when wide). A pair of run logs is the exception: `.split--logs` stays a single column until `min-width: 1350px`, then splits into two equal columns 24px apart, because a recorded line cannot wrap — two columns only read as one spread when each can hold the longest line, and the measured result is 656/656px at 1440, 1180/1180 at 1280, 1008/1008 at 1100 and 824/824 at 900, with no clipping; 620 and 390 still overflow and are handled by the hint instead. The instrument frame is a two-column grid — dark legend `minmax(210px, 244px)` plus a 1fr paper strip, split by a 2px Graphite rule — and the strip holds `clamp(240px, 30vh, 320px)` of height (300px at ≤900px, 340px at ≤620px).

The landing's printed head caps its own measures: the headline at 38ch, the lede at 46ch, the case line at 62ch, and the install window at `min(100%, 940px)` — outside the reading measure, so the command never clips.

The docs layer is a chapter rail plus the article: `minmax(200px, 264px)` and 1fr with a 72px gutter, the rail sticky at 16px from the top behind a 2px Graphite right rule (the margin rule). It carries eight chapters numbered `01`–`08`, titled `文件 · mgit 2.0.2`, and the pager reads `下一章 · 02` / `Next chapter · 02` — the number is the link, not a code. At ≥1280px the article itself becomes a three-row grid — the chapter head spans both columns, the prose keeps its 68ch measure in column 1, the margin index takes a 232px column 2 across a 32px gap and sticks 16px below the top, and the pager spans both — so the index fills what was dead space beside the measure. Between 1101px and 1349px the rail narrows to 200px so the text column keeps its measure while the index still has room. The docs index (`docs/index.html`, `en/docs/index.html`) is a single band on paper: an h1, a one-line intro, the eight docs rows, and the footer.

Responsive behavior steps at 1349 (with 1101, where the chapter rail narrows to 200px), 1280 (with its 1279 twin, where the margin index takes its column and, below, stacks above the prose), 1100 (the docs collapse), 900 and 620. At ≤1279px the margin index leaves the margin and becomes a compact bordered list above the prose (`repeat(auto-fit, minmax(220px, 1fr))`). At ≤1100px the docs collapse to a single column and the rail becomes static, full width above the article, with a 2px bottom rule replacing the margin rule. At ≤900px the instrument stacks the legend above the strip (the 2px divider becomes a bottom rule), band padding drops to 72px, and plate rows stack into term-over-definition. At ≤620px body text drops to 1rem, mono drops again (0.6875rem inside runlogs and windows, 0.75rem in command lines), the legend reverts from graphite to the surface it stands on (its dark mass would swallow a phone screen), the rule list drops to a single column, the strip grows to 340px, legend columns narrow to 2.7rem, the install window drops its platform label, the runlog reveals its `← scrolls sideways` hint, and the docs row drops its arrow.

Two themes, one layout. `:root[data-theme="dark"]` re-resolves the desk tokens, `color-scheme` follows the theme on the root, an inline `<head>` script sets the attribute before the stylesheet so the first paint is already the right paper, and `@media print` forces the sheet back (`--paper #f5f6f4`, `--ink #15161a`, `color-scheme: light`, the body on paper-fibre). The dark desk is `--plate #191a1d` under `graphite-plate.jpg`, its panel steps up to `--plate-2 #22242a` on `graphite-plate-2.jpg`, and the paper objects keep their ramp — the strip stays `#f5f6f4` + chart-paper, the runlog and the official install window become `#fff` + paper-fibre — while at ≤620px the legend goes back to being the surface it stands on, which in dark is the bare desk itself. Geometry is identical in both themes: 388 leaf nodes measure the same, page heights 8716 / 12256 are unchanged because the dark footer draws its 1px hairline as `inset 0 1px 0` instead of a border-top, and the shipped header went from 75.98 to exactly 76px (132 at 390). Overflow is 0 across 1440 / 1280 / 1100 / 900 / 620 / 390 × five pages × both themes, and the light theme's pixels are otherwise untouched — a reduced-motion pair diff shows nothing moved but the new header control and the three strip chips (1440 mean |Δ| 0.033, 0.052% of pixels above 8 LSB; 390 mean 0.150, 0.264%). The head band carries the wordmark, the four nav links, the 34px theme keycap and the language group; it measures exactly 76px on one row at 1440 / 1000 / 620 and folds to two rows (132px) at 390px, with no horizontal overflow — 561px up keeps one row on the tighter 16px column gap, and at ≤560px the second row is always the paired theme switch + language group, never an orphan at any width 380–620.

### Named Rules

**The One-Sheet Rule.** Landing and docs are the same paper. Sections are separated by a hairline rule and 112px of quiet — not by cards, containers-with-borders, or background changes.

**The 8px Rule.** Every gap, padding and offset is a step on the unit: 8 / 16 / 24 / 32 / 48 / 72 / 112. A one-off spacing value is a bug in the system, not a style choice.

## Elevation & Depth

Flat by default: there is no shadow on the paper itself, no gradient fill, no glow, and no colored shadow anywhere in the build. Depth is a printing metaphor carried by three graphite lifts (the lifted sheet, the seated plate, the lifted graphite window) and two inset bevels (the punched window, the keycap). The sheet can be lifted (the instrument frame floats off the desk), the plate can be seated (the dark object casts into the paper), and a hole can be punched (windows and switches carry an inset top highlight and a bottom inset shadow so they read as openings and keycaps). Interactive state is expressed by inversion and punch-out — hover turns a row white, a copied switch inverts to Graphite — never by raising it.

**The dark re-cut.** The same vocabulary is re-cut once, for a ground that is already dark: the lifts deepen (`0 22px 44px -36px rgba(0, 0, 0, 0.95)` for the installed sheet, `0 24px 48px -40px rgba(0, 0, 0, 0.9)` for the seated plate, `0 26px 50px -44px rgba(0, 0, 0, 0.95)` for the instrument frame), the punches swap their lips for the dark reading (`inset 0 1px 0 rgba(237, 237, 232, 0.07), inset 0 -1px 0 rgba(0, 0, 0, 0.5)`; keycaps `inset 0 -2px 0 rgba(0, 0, 0, 0.5)` at rest and `inset 0 2px 0 rgba(0, 0, 0, 0.6)` pressed), and the seated plate's 1px hairline is drawn inside the box — `inset 0 1px 0 var(--plate-rule-soft)` on the footer, because a `border-top` would push the footer's content down one pixel and make the dark page a pixel taller than the light one. The install window, a paper object, keeps its light bevels and adds the dark lift on top.

### Shadow Vocabulary

- **Lifted sheet** (`box-shadow: 0 26px 50px -44px rgba(21, 22, 26, 0.65)`): the instrument frame, once.
- **Seated plate** (`box-shadow: 0 24px 48px -40px rgba(21, 22, 26, 0.9)`): the dark plate and footer object.
- **Punched window** (`box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 0 rgba(21, 22, 26, 0.05)`): the white command window; the runlog frame carries no bevel — its 2px ink frame and graphite bar do that work.
- **Lifted graphite window** (`box-shadow: 0 22px 44px -36px rgba(21, 22, 26, 0.95)`): the install window on the plate material, the one command that lifts off the page.
- **Keycap** (`box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85), inset 0 -2px 0 rgba(21, 22, 26, 0.09)`): the copy switch at rest; pressed it becomes `inset 0 2px 0 rgba(21, 22, 26, 0.12)` and moves `translateY(1px)`.

### Named Rules

**The Shadow-Vocabulary Rule.** The depth vocabulary is these five effects, full stop — one of them (the keycap) in two states. A new shadow needs a printing reason — a lifted sheet, a seated plate, a punched hole — and decoration is not one; the language switch's 2px inset underline is a state mark, not a sixth depth.

**The Inversion Rule.** Hover and selection are printed as ink/paper inversion or a punched white opening, not as elevation: `background: Graphite, color: Paper` for a copied switch, white for a hovered docs row or the current nav item.

## Shapes

Square corners everywhere: the only radii in the shipped rules are the 1px focus ring and the 8px scrollbar thumb. Frames are 1px Graphite hairlines (`--hair`) at the default, and 2px Graphite marks structure — the head band, the legend divider, table heads, the docs nav, the pager, the procedure head. Interior separation is a dotted 1px Rule Grey hairline (legend rows, docs navigation items, margin-index items, table rows, the rule under a command line, the runlog scroll hint) or a dotted 2/6 lane rule in the same grey in the strip. The recurring silhouette is the printed mark: a 7px square Graphite bullet in prose lists, a 6px Alarm square after the current chapter number, a 10×2px rule as a pen-weight swatch, a 5px flag triangle, a 6px cross, an 18px arrow, a 14×8 carriage block, and the 12px columns of 40px ticks at the strip's edges. All icons are authored SVG at 12–20px with 1.4–1.8px strokes at the same weight (the copy glyph 1.4, the theme keycap's 16px field 1.4 with its left half inked, the replay glyph 1.5, the arrow 1.6, the cross 1.8); nothing is an emoji or a glyph standing in for an icon.

### Named Rules

**The Hairline-and-Punch Rule.** Hierarchy comes from rule weight (1px hair, 2px structure) and from printed marks. Never from radius, never from a container's background, never from a border above 2px on a card, callout or list item.

## Components

The shared blocks — head, footer, window, command line, docs rows, plates — are assembled by `website/build/*.py` (an author tool; the shipped pages are static HTML), so a shared component is changed once in `build/common.py` and re-emitted across all twenty pages rather than hand-copied.

### Paper stocks (the surface)

Character: plain stock, one paper, and the material is genuinely visible. The page ground is `background-color: var(--paper)` plus `url("plates/paper-fibre.jpg")` at `900px auto` — no scrim: the plate's grain is re-laid on the token's own tone (`website/build/make-textures.py`), so its mean is `#f5f6f4` and only the grain (σ 3.2/255) varies, giving a measured paper spread of 3.44/255 where the earlier scrimmed version measured 3/255 — a flat fill. After dark the ground swaps both colour and material: `--paper` is `--plate #191a1d` and the body wears `graphite-plate.jpg` instead, because a dark desk may not be a flat fill either (measured σ 4.68 in the dark theme). The chart paper is a separate material and stays inside the strip in both themes: `url("plates/chart-paper.jpg")` (1000×667, 70kB, σ 4.4) at `1200px auto` under the printed 1px Rule Grey line every 40px; 12px columns of Strong Rule Grey ticks at both edges. The strip re-declares the sheet ramp in dark, so its ground, its rules and its ticks are the light theme's — σ 5.67 there, the busiest material on the page. Dark objects are the same treatment on graphite: `url("plates/graphite-plate.jpg")` (900×600, 52kB, σ 4.0, mean `#191a1d`) at `900px auto` behind the plate, the footer, the lane legend, the graphite install window and the runlog bar — measured 3.9–4.7/255 grain where the scrimmed version was flat. After dark the four panels among them — plate, footer, legend, runlog bar — swap to `url("plates/graphite-plate-2.jpg")` (900×600, 53kB, σ 4.0, mean `#22242a`), the step that keeps them objects on an already-dark desk (σ 3.49–4.65 measured there), while the install window becomes a paper object and the punched windows, the lang and theme keycaps and the replay button stay flat `--plate-2` fills (σ 0). `paper-chart` (landing bodies) and `paper-log` (docs bodies) only repaint the colour over that ground, which is what lets the texture show through every page. What keeps the reading surface in the world is drawn, not photographed: 2px Graphite dividers, 1px dotted Rule Grey hairlines under list and table rows, the docs row rules, the margin rule beside the chapter rail, and the engraved plate.

### Instrument frame (legend + strip)

Character: a printed recorder, not a chart widget. A 1px Graphite border and the lifted-sheet shadow (both re-resolve after dark — an ivory hairline border and the deeper dark lift), split by a 2px Graphite vertical rule into a narrow printed legend (`minmax(210px, 244px)`) and a 1fr paper strip. **The legend is the instrument's panel**: from 621px up it wears the same lacquered graphite as the plates (`graphite-plate.jpg`, grain on `#191a1d`) — repository names in Plate Ivory, everything else in Plate Dim, dirty in Plate Ivory, failed in Plate Alarm, head rule at plate alpha 0.2 and row rules at 0.1 — so the wide frame carries one dark mass beside the clean paper the pens draw on; at ≤620px it reverts to the surface it stands on and that surface's inks (the dark mass would swallow a phone screen) — paper in light, the bare desk in dark, where the panel is simply transparent and the grain runs through. After dark the panel step is `graphite-plate-2` on `#22242a`, like every other panel that stands on the desk. Its head row prints two labels under plain words — the number column is headed `#`, the second column `儲存庫 · 分支` / `Repository · branch` — and each row is a baseline-aligned grid of a two-digit number `01`…`06` (0.75rem mono, dim), the repository name (0.8125rem mono, weight 500) and a meta line that prints the branch and the state word once — a change count and the offending detail appear only when there is something to say (`main · 乾淨`, `main · 1 項變更 · 有變更 · M src/main.rs`) — separated by dotted hairlines. The strip's ground is the chart-paper texture (σ 4.4) with the printed 40px rule on top, and it holds a real drawn SVG, the run tag (the command itself: `mgit pull`, `mgit --summary`), the caption line, the state vocabulary and the exit line. Those last three — `.strip__meta`, `.vocab`, `.strip__exit` (12–13px) — sit on small chips of clean paper (paper-fibre at `900px auto`, `0.1 / 0.3rem` padding) so no printed rule ever crosses 12px type: over chart paper the same text measured 4.415 against the worst grain, and the fibre's 226/255 lifts it to 4.761 — the only light-theme pixels that moved besides the new header control.

### Traces (the pens)

Character: three pens in two stroke weights, plus two marks, drawn from the page's own record (clean and dirty 2.2px, failed 2.6px; site.css:745-765). The strip is a paper object, so it re-declares the sheet ramp in dark and the pens draw in the same three inks in both themes — Link Blue, Graphite, Alarm never move with the desk. The strips are rendered by `recorder.js` from `<script type="application/json" id="mgit-runs">`, so legend, traces and captions can never disagree; **each language's page ships only its own record** — `landing.py`'s `localized_runs()` folds `detail_en` into `detail` for the English tree, so an EN page carries no Chinese data fields even in source, and the EN tree scans clean of CJK outside the two words a reader sees (the language switch and the copyright name); the SVG is `aria-hidden` presentation, `viewBox` matched to pixel size, one dashed lane rule at each lane boundary — seven per strip, fourteen across the two shipped strips — and nothing else inside the field: no vertical lines, no baselines, no mesh.

- **Clean pen** — 2.2px Link Blue, dead flat across the lane.
- **Dirty pen** — 2.2px Graphite, one square S-curve excursion per change (7px corner radius, plateau capped at 58px, amplitude ≤ min(lane × 0.36, 34)), each closed with a 5px Graphite flag mark.
- **Failed pen** — 2.6px Alarm, one violent overshoot to 1.85× amplitude that rings and settles, marked with a 6px Alarm cross and the exit code as 12px/700 Alarm mono.
- **Lane furniture** — Strong Rule Grey holds the lines a pen runs against: a 1px dashed 2/6 divider at each lane boundary (7 per strip) and the 40px tick columns at both edges; the paper's own whisper line is Rule Grey, one step quieter. Stroke widths are CSS px because the SVG keeps `preserveAspectRatio: none` with a viewBox measured in pixels, so 1 unit = 1px.
- **Legend linkage** — hovering a legend row drops every other trace to 0.26 opacity and lifts the named one to 3.2px.

### Carriage sweep (the one authored moment)

Character: the recorder's pen carriage crossing the paper. A 1px Graphite head at 40% opacity with a 14×8 Graphite block travels left to right over 2400ms on a requestAnimationFrame cubic ease-out, while each trace draws itself with `stroke-dashoffset` 1 → 0 (paths carry `pathLength="1"`), one lane staggered 60ms, easing `cubic-bezier(.22, .61, .24, 1)`. Marks and ticks stay hidden until 82% of the sweep (1968ms) and fade in over 260ms linear; the carriage then parks at the right edge and fades out over 200ms. It fires once when the strip first crosses 35% of the viewport, redraws on resize (settled), and can be replayed by the **replay control**: a punched white chip with a 12px drawn glyph and a label in panel caps, inverting to Graphite/Paper on hover in 140ms. Under `prefers-reduced-motion: reduce` the script settles immediately — traces drawn, marks visible, carriage parked and hidden — and the replay control re-settles instead of animating.

### Punched window and copy switch

Character: a command printed into a punched hole, in two materials. **The official install commands — the page's one primary action, every one of them — take the graphite window** (`window--plate`): `--plate` ground plus `graphite-plate.jpg` (grain on `#191a1d`), Plate Ivory command, Plate Dim labels, a flat transparent switch that hovers to `rgba(237, 237, 232, 0.12)` and inverts to Plate Ivory on copy, and a heavier graphite shadow (`0 22px 44px -36px rgba(21, 22, 26, 0.95)`). Everything else a window carries — the verification and build lines — stays on paper: white (`--window`), 1px Graphite bordered, with the punched-window bevel and `0.55 / 0.65 / 0.55 / 0.75rem` padding. In dark the two swap materials, not roles: the install window becomes the sheet — `--sheet-window` + paper-fibre, sheet inks, the paper keycap switch and its sheet-blue focus ring — and is the page's brightest object, while the verification and build windows become flat `--plate-2` punches in the desk, their bevels re-cut for a dark ground because a white inset on graphite reads as a glow and a black inset on paper as nothing. In both materials a label on the left names the platform or tool, and the command sets in 0.8125rem mono with `white-space: pre` and horizontal scroll — commands are never wrapped. The paper switch is stock, 1px Graphite bordered, panel caps, `0.42 / 0.6rem` padding, keycap bevel; hover presses it to Deep Paper, `:active` drops it 1px and swaps the bevel, and the copied state inverts to Graphite/Paper in 140ms with the label swapped to `已複製` / `COPIED` for 1800ms (`aria-live="polite"`; copy failure swaps to `請手動複製`).

### Command line and the ghost switch

Character: everything else a reader might copy, printed straight onto the paper as the page's instruction rather than a caption. A `.cmdline` is one line of the chapter's own work: the command in JetBrains Mono at 0.9375rem, weight 500 (Graphite, `white-space: pre`, horizontally scrollable, never wrapped; the markup ships `tabindex="0"` so it scrolls without JavaScript), with an optional 0.75rem note naming its platform or tool in Graphite 3, closed by a 1px Strong Rule Grey rule and 0.5rem of block padding — one step louder than the paper's own hairlines, because a command is something you act on. Its copy control is the **ghost switch** — the same switch geometry with the box removed: no border, no background, no bevel, 0.15 / 0.25rem padding, Graphite 3 underlined at 0.2em offset; hover darkens it to Graphite and the copied state turns it Link Blue, keeping the text-only treatment. The docs layer uses these throughout and the landing's case band opens with one; the boxed window is reserved for the official install and verification commands. At ≤620px the command text drops to 0.75rem.

### Engraved plate (spec table, calibration figures, rows)

Character: the instrument's spec plate — the largest of the page's five graphite surfaces in light (with the footer, the lane legend at ≥621px, the graphite install window and the runlog bar; `.plate` at site.css:1118 is the one that spans a whole band), and after dark one of the four panels standing on a graphite desk. `--plate` ground plus `graphite-plate.jpg` (900×600, 52kB, σ 4.0, mean `#191a1d`) at `900px auto` — no scrim, so the panel reads as lacquered graphite rather than a flat fill; Plate Ivory ink, 1px plate border, seated-plate shadow; head in panel caps (title) with a mono spec stamp in Plate Dim, body padding 32px. Three interior forms: **calibration figures** in an auto-fit `minmax(240px, 1fr)` grid at 32px gaps, each a mono 1.5rem number above a 0.875rem Archivo explanation in Plate Dim; **spec tables** in mono 0.8125rem with plate hairlines at 0.1/0.2 alpha, header in Plate Dim, first column Plate Ivory and never wrapping; and **rows** of a mono term plus a 0.9375rem definition (`--plate-body` #cfcdc6, 62ch) over 0.1-alpha rules. Links inside a plate take Plate Blue. After dark the same plate wears `graphite-plate-2.jpg` on `--plate-2`, its 1px border drops to `--plate-rule-soft` (the tone step carries the panel) and its seated shadow is re-cut for a dark ground; one known un-fixed nit: under `data-theme="dark"` in print the plate's own surface rules still resolve `#22242a` against the light press's `#191a1d` — negligible, and the build leaves it.

### Rule list (`rules`)

Character: the rules of a system printed as a numbered list, in two balanced columns. An `<ol>` with `counter-reset: rule` laid out with CSS `columns: 2` and a 72px column gap, opened by a 2px Graphite rule and 16px of air; each `li` increments the counter, avoids breaking across columns, sits on a 1px Rule Grey hairline with `0.6rem 0 0.6rem 1.9rem` padding, and sets in 0.9375rem Graphite 2 at 1.55, with the number drawn absolutely at the left in 0.75rem JetBrains Mono Graphite 3. Measured at 1440 the two columns come out equal — 177px each — and both start on the band's first row. It replaced a version where each `li` was a grid, which turned every inline `<code>` and `<b>` into its own grid item and shredded the sentences into ten lines: the list owns the columns, the item owns only its own text.

### Band footnote

Character: the one line that closes a band's evidence. `margin-top: 24px`, 92ch measure, 0.875rem Graphite 2 — under the two equal runlogs in the 它怎麼找儲存庫 band, where it names the depth difference the logs show.

### Runlog (the recorded session)

Character: a printed frame for a real terminal session — the only paper object framed all round in 2px (site.css:1036; every other paper surface takes a 1px hairline or a 2px edge rule). A 2px Graphite frame around a white body; the bar is graphite with the same plate texture (`graphite-plate.jpg`, grain on `#191a1d`), carrying the command as its title at weight 700 in Plate Ivory, the meta in Plate Dim, and a 1px plate-coloured seam where it meets the white body, so a recorded session announces itself before you read a line. The body sets in 0.78125rem mono at 1.7 with `white-space: pre` and horizontal scroll, is a named group (`role="group"`, an `aria-label` naming the command whose output it is) and is keyboard-scrollable (`tabindex="0"` in the markup) — sized so a recorded 80-column line fits the column at desktop width instead of scrolling. At ≤620px the body drops to 0.6875rem. A `.runlog__hint` line (`← 可橫向捲動` / `← scrolls sideways`, 0.75rem Graphite 3 over a dotted Rule Grey rule) appears only where it is true: `recorder.js` measures each body's scrollWidth against its clientWidth, sets `data-scrollable` on the frame, and re-checks 150ms after a resize — so a desktop log that fits shows no hint at all. The site only frames and inks what the binary printed: the 80-`=` rules and section dividers in Graphite 3, folder lines in Graphite 500, quiet blank lines in Graphite 3, failures in Alarm, the summary in Graphite 2 — and no fifth hue anywhere. In dark the frame re-declares the sheet ramp — body `#fff` on paper-fibre (σ 3.49), frame and interior rules in sheet ink, the bar on `graphite-plate-2.jpg` (σ 4.38) — so the recorded printout keeps its stock whichever desk it stands on. The symbols (`📂`, `✗`) and the column layout are the CLI's own print reproduced verbatim — the site has no emoji iconography of its own; its marks are drawn SVG.

### Docs row (the index)

Character: a row of the documentation index, shared by two pages. The same eight rows — identical copy, identical order — are emitted once and used by the landing's 文件 band and by the docs index (`docs/index.html` / `en/docs/index.html`), so the two can never drift. Grid `4.5rem 1fr auto` on baseline with 24px block padding and a Rule Grey hairline under it: a two-digit number `01`–`08` in 0.75rem mono Graphite 3, chapter name in the display stack at 1.0625rem/500, description at 0.9375rem Graphite 2 capped at 74ch, and an 18px drawn arrow at the right edge. Hover and `:focus-visible` punch the row with `--window` — white on paper, `--plate-2` after dark; nothing moves. At ≤620px the row drops to `3.4rem 1fr` and the arrow is removed.

### Margin index (the chapter's own sections)

Character: the chapter's table of contents, printed in the margin beside the text. Built from the chapter's own h2/h3 list, with heading targets `sec-1`, `sec-2`, … in document order, so the index and the page can never disagree. The nav carries an `aria-label` (`本章內容` / `On this page`) and a panel-caps title over a 1px Graphite rule; each item is a 0.9375rem Graphite 2 line over a dotted Rule Grey hairline, padded `0.4 / 0.4 / 0.4 / 0.3rem`, with `data-level="3"` items stepping down to 0.875rem in Graphite 3. Hover and focus punch an item white. At ≥1280px it is a 232px column two of the article grid, sticky 16px below the top; at ≤1279px it becomes a compact list above the prose, fenced top and bottom by 1px Graphite rules with an auto-fit `minmax(220px, 1fr)` list.

### Docs navigation and pager

Character: the docs table of contents, then the page turn. The docs tree has a door of its own — `docs/index.html`, one band with an h1 (`文件` / `Docs`), a one-line intro and the same eight rows — so the header's 文件 link lands on a page rather than a directory listing. The rail is a sticky column (16px from the top) with a 2px Graphite right rule — the margin rule — a panel-caps title (`文件 · mgit 2.0.2` / `Docs · mgit 2.0.2`) over a 1px Graphite rule, and items that grid a two-digit chapter number `01`–`08` beside the chapter name over a dotted Rule Grey hairline; the current page is punched white, weighted 600, and its number gets a 6px Alarm square. The chapter head itself is title and intro only — no stamp above the title — and the pager closes a chapter over a 2px Graphite top rule, with a panel-caps `下一章 · 02` / `Next chapter · 02` label above the destination name, blue on hover. In the article grid the head and pager span both columns, so the pager always sits under the prose at full width.

### Footer plate

Character: the page ends on the instrument's base plate — the same `graphite-plate.jpg`, grain re-laid on `#191a1d`, as the plate above. `--plate` ground with three auto-fit groups (`minmax(220px, 1fr)`), group titles in panel caps Plate Dim, links in Plate Blue, definitions at 0.9375rem (`--plate-body` #cfcdc6), and a colophon row across a 0.2-alpha plate rule at 0.8125rem with the licence link at the right. After dark the footer is `--plate-2` on `graphite-plate-2.jpg` and its 1px top hairline is drawn as `inset 0 1px 0` rather than a border, so both themes keep the same geometry.

### State vocabulary

Character: the printed key that makes the strip legible without color. Five words appear once per strip foot — 乾淨 clean · 有變更 dirty · 失敗 failed · 被中斷 interrupted · 找不到儲存庫 no repos — each with a 10×2px pen-weight swatch. Swatch inks: Link Blue for clean, Graphite for dirty, Alarm for failed, Graphite 2 for interrupted and no-repos. Words not active in the run dim to Graphite 3 with a Rule Grey swatch. Word and pen agree, and alarm is reserved: the dirty word prints in Plate Ivory on the graphite legend (≥621px) and Graphite 2 on the paper one (≤620px), its mark is Graphite, and only failed prints and marks Alarm.

### Theme switch (the keycap)

Character: the desk's own answer to the copy switch — a keycap the reader presses to change what the instrument stands on, and the only control in the head that carries a state rather than a destination. A 34×34 `type="button"` (`min-height: 34px`, the language group's own height) with a 1px ink border, the copy switch's keycap bevel, a 16×16 authored glyph at stroke 1.4 whose left half is inked — "paper, or ink" at 16px, with no second colour — an `aria-label` (`深色主題` / `Dark theme`) and `data-theme-toggle`. It sits between `.head__links` and `.lang` and shares their chrome. Hover presses it to `--paper-deep`; `:active` drops it 1px and swaps the bevel; `aria-pressed="true"` means dark is on and inverts the keycap to ink/paper with the bevel removed — exactly how a copied switch inverts, so the state is carried by ink and a mark, not by a word. The mark reads in both themes because `--ink` and `--paper` move with the desk; in dark the keycap is a flat `--plate-2` punch with the dark bevel. Focus is the page ring — 2px `--blue` at 2px offset, which is Plate Blue in dark (#7fb6d6, 5.66 worst case) because `#0f5c86` measures only 2.40 on graphite.

The mechanism behind it: an inline `<head>` script **before** the stylesheet sets `data-theme` pre-paint from `localStorage["mgit-theme"]`, falling back to `prefers-color-scheme`, and `recorder.js`'s `initTheme()` owns the click, the persistence and following the system while nothing is stored; the pages declare `light dark` in their meta and `color-scheme` is set per theme. Nothing cross-fades (the flip is instant), a throwing `localStorage` leaves the page working with the system's theme for the session, and print restores the sheet.

### Head band, skip link, browser surfaces

The head is a single band over a 2px Graphite bottom rule and carries exactly four things: the wordmark (`mgit`, text only, 122% width at weight 700 — the version spec stamp is gone), the four nav links in panel caps with a blue underline on hover, the theme keycap (34×34, between the links and the language group), and the language switch at the right, where the current language is printed in full Graphite at weight 700 over a 2px inset ink underline — the head gives colour weight back to the content instead of inverting a whole box. Version information lives in the footer colophon (`Release 2.0.2`, `© 2026 Will 保哥 · MIT 授權 …`), never as a badge in the head. Every landmark is named: the head links are `網站` / `Site`, the chapter list is `文件章節` / `Docs chapters`, the chapter rail is `章節` / `Chapters`, the margin index is `本章內容` / `On this page`, and the pager is `章節切換` / `Chapter navigation`. A skip link is punched white, parked at -100px and dropped to 16px on focus. The browser tab carries the same materials: `assets/favicon.svg` is paper `#f5f6f4`, one graphite bar, one blue pen line and three printed rules, linked as an SVG icon from every page. Browser surfaces belong to the system: `::selection` is a pale blue wash (`--select`: #dce7ee light, #14374c dark) under the theme's ink, the caret is Alarm, scrollbars run `--rule-strong` on a `--rule` track (12px, 4px `--paper` border, 8px radius — ivory hairlines on graphite after dark), and focus is a 2px Link Blue outline at 2px offset with a 1px radius — except on graphite, where the ring switches to Plate Blue so it stays visible against the plate (the light ring measures 5.59 worst case, the dark one 5.66; `#0f5c86` on graphite would be 2.40).

## Do's and Don'ts

### Do:

- **Do** keep the reading surface paper, not pattern: `paper-chart` and `paper-log` repaint `var(--paper)` — `#f5f6f4` in light, `#191a1d` after dark — over one texture (the fibre in light, the graphite lacquer in dark) whose grain is laid on the token's own tone, and the chart paper stays inside the strip where the pens draw.
- **Do** use imagery as material only — fibre under the page, chart paper in the strip, lacquered graphite behind the plate, the legend, the graphite window and the runlog bar — each AI-generated texture carrying its prompt as an embedded JPEG comment and a sibling `.prompt.txt`; the dark panels' `graphite-plate-2.jpg` is the same photograph at a second tone, with its own prompt file.
- **Do** re-lay a texture's grain on the token it stands on (`website/build/make-textures.py`: paper-fibre σ 3.2 on `#f5f6f4`, graphite-plate σ 4.0 on `#191a1d`, graphite-plate-2 σ 4.0 on `#22242a`, chart-paper σ 4.4 on `#f5f6f4`) so the material is visible at the token's own tone instead of under a scrim.
- **Do** keep every material visible in both themes: every surface that carries one measures σ ≥ 3 (dark: desk 4.68, legend 3.72, strip 5.67, runlog bar 4.38 and body 3.49, install window 3.62, plate 4.39, footer 4.65) — the desk and the panel may never be flat fills.
- **Do** keep the paper objects paper in dark: the strip (`#f5f6f4` + chart-paper), the runlog and the official install window (`#fff` + paper-fibre) re-declare the `--sheet-*` ramp, so only the desk and the panel ever move between themes.
- **Do** hold 12–17px chrome to 4.5 against the worst grain of the surface it sits on, not against the token — the light sheet on its darkest fibre (226/255), the dark desk on its lightest graphite (52/255) — and give a surface that cannot clear it a different material, as the strip's chips did when they moved from chart paper (4.415) to paper fibre (4.761).
- **Do** let ink carry content and paper carry structure through rules: 2px dividers, dotted 1px hairlines under list, table, navigation and index rows, the margin rule, the docs row rules.
- **Do** pair every failure with a mark and a word (failed pen + cross + `exit 128`), and print the whole five-word state vocabulary once per strip.
- **Do** set display-size CJK in the `--display` stack so it lands in "mgit Display", and extend the 155-character subset when new headline copy appears.
- **Do** print a command as a `.cmdline` on the paper with the text-only ghost switch; give the official install commands the window (`window--plate`) as the page's one primary action — graphite on the light desk, the sheet itself after dark — and let verification and build lines keep the punched window on paper in light and as a flat punch in the dark desk.
- **Do** ration the graphite: the official install commands are the page's one primary action — five graphite windows on each landing (one in the hero, four in the install band: install.sh, install.ps1, `npm install -g @willh/mgit`, `npx @willh/mgit`) and three in each docs install chapter — the lane legend is the wide frame's dark mass (≥621px, reverting to the surface it stands on at ≤620px where it would swallow the screen), and every recorded session's bar is graphite so the session announces itself before it is read. The ration is one heaviest action per page, not one colour: after dark that action is the page's **brightest** object, the install window on stock.
- **Do** keep numbers plain and self-describing: `01`–`08` for chapters, `01`–`06` for lanes, the command itself (`mgit pull`) where a run needs a name.
- **Do** print a rule set as a `rules` list: CSS columns own the two balanced columns, each `li` owns only its own text and a 1px hairline.
- **Do** keep the margin index in step with the chapter's own h2/h3 headings (`sec-1`, `sec-2`, … in document order) so the index and the page can never disagree.
- **Do** keep commands, paths, repository names, exit codes, plate terms and spec tables in JetBrains Mono; keep prose in Archivo.
- **Do** hold every gap to the 8px unit: 112px between bands, 48px from a band head to its content, 24–32px inside groups.
- **Do** keep corners square, and express state as inversion (Graphite/Paper) or a punched white opening.
- **Do** honor reduced motion by settling the strip to its final state — drawn traces, visible marks, parked carriage — rather than suppressing the drawing.
- **Do** theme the browser surfaces (selection, caret, scrollbars, focus ring) from the same palette; all four already ship themed, and the ring turns Plate Blue on graphite — light 5.59 worst case, dark 5.66, where `#0f5c86` would be 2.40.
- **Do** name every landmark (`網站`, `文件章節`, `章節`, `本章內容`, `章節切換`) and give a scrollable region a tab stop only when it actually overflows — `initScrollers()` measures each command line and runlog body and flips `tabindex` between 0 and -1, so the keyboard never stops on a line that already fits.

### Don't:

- **Don't** carry text, borders or state on a rule, and don't use the rule greys as anything but hairline, tick, separator or scrollbar.
- **Don't** put colour back into the structure layer — no tinted grid, no coloured ruling, no coloured hairline; colour belongs to ink and to failure.
- **Don't** scrim a texture or ship it flat: an overlay that keeps only a few percent of the grain turns a material into a fill (the scrimmed build measured a 3/255 spread on every dark surface), and a fill carrying a material's name is worse than no material at all.
- **Don't** lay a ruled pattern under running text — no chart paper, no reading rule, no repeating gradient beneath a column of prose; the page's own ground may carry a material texture at a whisper, never a grid, and never a picture.
- **Don't** put a picture on this site that pretends to be the product. The imagery is background material and nothing else: no depicted object, no mockup, no scene, no caption claiming a photograph shows mgit working — the run logs and exit codes are the evidence, and they come from the binary.
- **Don't** make a `li` a grid. The rule list is a CSS-columns list whose items set inline `<code>` and `<b>` as part of their own sentence; a grid item per line splits every inline element onto its own row and shreds the copy.
- **Don't** introduce a fourth ink. Graphite, Link Blue and Alarm are the whole meaning layer; a second accent dilutes the alarm.
- **Don't** use Alarm as decoration — it only appears with a failure word, a code, or a cross.
- **Don't** add rounded panels, soft UI shadows, glows, gradient fills or colored shadows; the two lifts and two bevels in Elevation & Depth are the entire depth vocabulary.
- **Don't** carry plate inks onto paper or paper inks onto the plate: the dark object has its own four inks, the page keeps its three, and after dark the two exchange desks — the desk takes the plate family, the paper objects re-declare the sheet family — without either borrowing a colour ad hoc.
- **Don't** implement a theme by inverting hues: dark is a material variant of one world — the desk and the panel move between paper and graphite, the paper objects do not, and no `--sheet-*` value changes in either theme.
- **Don't** let the dark theme's primary action lose its "one heaviest" status: after dark the official install window is still the page's one primary action, now the brightest object rather than the darkest.
- **Don't** confuse flat punches and keycaps with materials: the punched windows, the lang and theme keycaps and the replay button are flat `--plate-2` fills in dark (σ 0), mirroring light's flat white punches — grain belongs to the desk and the panel; holes and keys are flat.
- **Don't** let a fifth hue into the recorded output: the CLI's `=` rules, dividers and quiet lines print in Graphite 3, because colour on this site means data about repositories — never syntax.
- **Don't** invert the site into a dark theme by repainting its objects; the theme is a material variant, the paper stays paper, and print always forces the sheet back.
- **Don't** hang a label, kicker or eyebrow above a heading. No chapter head, band or page carries one: a chapter head is its title and intro, the chapter number lives in the navigation and the docs rows (where `aria-current` marks the open one), and the version lives in the footer colophon and the navigation title. The heading carries its own weight.
- **Don't** coin shorthand for things that already have plain names: the documentation is 文件 / Docs, the legend's number column is `#`, chapters and lanes are two-digit numbers, and a run is named by the command it ran (`mgit pull`), never by a code.
- **Don't** reproduce the CLI's printed symbols as site iconography, and don't style a screen that imitates the terminal outside the runlog frame.
