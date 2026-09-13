---
name: mgit website
description: A strip-chart fleet recorder printed on paper — one pen per repository, specs on an engraved plate.
colors:
  paper: "#f5f6f4"
  paper-deep: "#eceeea"
  grid-fine: "#efa8b4"
  grid-bold: "#dd8d9a"
  grid-log: "#ecd2d6"
  window: "#ffffff"
  ink: "#15161a"
  ink-2: "#4b4d53"
  ink-3: "#6d7076"
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
typography:
  display:
    fontFamily: "Archivo, \"mgit Display\", -apple-system, BlinkMacSystemFont, \"PingFang TC\", \"Noto Sans TC\", \"Microsoft JhengHei\", sans-serif"
    fontSize: "clamp(1.85rem, 3.2vw, 2.6rem)"
    fontWeight: 600
    lineHeight: 1.06
    letterSpacing: "-0.018em"
  headline:
    fontFamily: "Archivo, \"mgit Display\", -apple-system, BlinkMacSystemFont, \"PingFang TC\", \"Noto Sans TC\", \"Microsoft JhengHei\", sans-serif"
    fontSize: "clamp(1.75rem, 3.2vw, 2.75rem)"
    fontWeight: 600
    lineHeight: 1.16
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Archivo, \"mgit Display\", -apple-system, BlinkMacSystemFont, \"PingFang TC\", \"Noto Sans TC\", \"Microsoft JhengHei\", sans-serif"
    fontSize: "clamp(1.9rem, 3vw, 2.6rem)"
    fontWeight: 600
    lineHeight: 1.16
    letterSpacing: "-0.012em"
  lede:
    fontFamily: "Archivo, -apple-system, BlinkMacSystemFont, \"PingFang TC\", \"Noto Sans TC\", \"Microsoft JhengHei\", sans-serif"
    fontSize: "clamp(1.125rem, 1.5vw, 1.3125rem)"
    fontWeight: 400
    lineHeight: 1.55
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
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-2}"
    typography: "{typography.data-small}"
    padding: "0.4rem 0.75rem"
  logbook-row:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "24px 0"
  logbook-row-hover:
    backgroundColor: "{colors.window}"
    textColor: "{colors.ink}"
  docnav-item:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-2}"
    padding: "0.45rem 0.5rem 0.45rem 0.35rem"
  docnav-item-current:
    backgroundColor: "{colors.window}"
    textColor: "{colors.ink}"
  lang-switch:
    backgroundColor: "{colors.window}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    padding: "0.35rem 0.6rem"
  lang-switch-current:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  callout:
    backgroundColor: "{colors.window}"
    textColor: "{colors.ink-2}"
    padding: "24px"
---

# Design System: mgit website

## Overview

**Creative North Star: "The Strip-Chart Fleet Recorder"**

The whole site is one instrument. A single strip of chart paper advances under N pens, one channel per repository: a flat line is a clean repository, the excursion is the one that needs you, and the run closes in a totals band printed at the foot of the paper. The page therefore has no cards, no icon grid and no hero-plus-install-box; it has a printed head, a channel legend, a strip with real traces, and bands of the same continuous paper separated by a hairline rule and 112px of quiet.

The materials are a print room's, not a UI kit's. Two stocks of the same warm-neutral paper carry all structure in pink ruling: the instrument surfaces take a fine 1mm grid with a heavier 5mm rule, the reading pages take one coarse 48px rule. Content is ink — graphite, channel blue, alarm red — and nothing else. Anything that must feel physical is printed as an object: a punched white window for a command, a dark engraved plate for specs and calibration figures, a printed frame for the recorded terminal session. Depth is a printing metaphor (a lifted sheet, a seated plate, a punched hole), never a light source.

The build refines the direction contract in one place: the clean pen draws in channel blue, not graphite, and graphite is spent on the dirty pen. The build wins; the pen vocabulary below is the shipped one.

**Key Characteristics:**

- One continuous sheet: `paper-chart` on the landings, `paper-log` on the docs; sections are bands, never cards.
- Three inks carry meaning (graphite, channel blue, alarm); pink rules carry structure only.
- Instrument components: a printed channel legend wired to the strip, punched white windows, an engraved plate, a recorded-session frame, a five-word state vocabulary.
- Square corners throughout; hierarchy is rule weight (1px hair, 2px structure) and printed marks.
- One authored moment: the carriage sweep that draws the traces in 2400ms, with a replay control and a reduced-motion settle.
- Three type voices: Archivo (variable width) for lettering and text, "mgit Display" (a Noto Sans TC subset) for CJK display, JetBrains Mono for data.

## Colors

A printed page's palette: warm chart paper, three pinks that only ever draw ruling, graphite for text, one channel blue for healthy data and links, one alarm red for failure, and a dark instrument plate carrying its own four inks.

### Primary

- **Channel Blue** (#0f5c86): the system's action ink — links, the 2px `:focus-visible` outline, the clean pen (1.5px), the clean swatch in the state vocabulary. Hovering deepens it to **Deep Channel** (#0a3f5c).

### Secondary

- **Alarm Red** (#b01b1b): the failure ink, always paired with a word or a code — the failed pen (1.9px), the cross mark, the exit-code tick, the failing line inside a runlog, the failed state word in a legend. Its only two non-failure appearances are pointers, not meaning: the text caret and the 6px square that marks the open docs chapter.

### Tertiary

- **Fine Grid Pink** (#efa8b4): the 1mm grid line, 8px pitch, drawn as background ruling on instrument surfaces; also the lane baseline in the strip.
- **Heavy Rule Pink** (#dd8d9a): the 5mm rule, 40px pitch, on the same stock; reused as the dotted hairline between legend rows, docnav items and table rows, and as the scrollbar thumb.
- **Logbook Rule Pink** (#ecd2d6): one coarse 48px rule for reading pages.

### Neutral

- **Chart Paper** (#f5f6f4): every page ground, both stocks.
- **Deep Paper** (#eceeea): the pressed state of the copy switch.
- **Punched White** (#ffffff): the only white in the system — punched openings (windows, runlog, callouts) and the hovered or current row.
- **Graphite** (#15161a): body and headings, the wordmark, 1px frames, the run tag, the dirty pen, the flag mark.
- **Graphite 2** (#4b4d53): ledes, band intros, note prose, runlog bar, table heads.
- **Graphite 3** (#6d7076): 12px chrome — labels, captions, channel numbers, spec stamps, dimmed vocabulary words.
- **Instrument Plate** (#191a1d): the dark engraved object (plates and footer). **Plate 2** (#22242a) is declared in the plate family and not yet spent by any shipped rule.
- **Plate Ivory** (#edede8): plate titles, terms, figures. **Plate Dim** (#a3a199): plate spec stamps, figure captions, footer group titles, colophon.
- **Plate Blue** (#7fb6d6): links inside plates and the footer. **Plate Alarm** (#e58a86) is declared in the plate family and not yet spent.
- **Plate Rules** — `rgba(237, 237, 232, 0.2)` and `rgba(237, 237, 232, 0.1)`: the engraved hairlines and spec-table rules on dark surfaces.

Five literal inks are used once each and are not tokens: the `::selection` pink (#f7d8dd), the runlog's rule ink (#a8545f), the plate link hover (#a5cfe6), and the plate body text ramp (#cfcdc6, #d6d4cd). They are recorded as observed one-offs, not promoted into the system.

### Named Rules

**The Structure-Only Pink Rule.** Pink draws ruling, separators and scrollbars; it never carries text, never borders a control or a message, and never encodes state.

**The Alarm-Pairs-With-a-Word Rule.** An alarm mark never arrives alone: it ships with a printed word (`失敗` / `failed`), a code (`exit 128`) or a cross, so color is never the only carrier of state.

**The Punched-White Rule.** White is an opening, not a surface: a window, a runlog, a callout, a switch, or the hovered/current row. No band, no section, no page is white.

## Typography

**Display Font:** Archivo (variable, `wdth` 62–125 / `wght` 100–900, latin subset) with **"mgit Display"** — a 44 KB Noto Sans TC subset, `wght` 100–900 — behind it in the `--display` stack
**Body Font:** Archivo (same face, same stack in `--sans`)
**Label/Mono Font:** JetBrains Mono (`wght` 100–800, latin subset)

**Character:** an instrument panel's lettering. One grotesque used at three widths (the variable face is set to 104/106/108/116/122% for panel caps and headings), a technical mono for anything a reader could paste into a shell, and a CJK display subset so the Chinese headings keep the drawn voice of the Latin ones instead of falling to a platform face.

### Hierarchy

- **Page headline** (600, `clamp(1.85rem, 3.2vw, 2.6rem)`, line-height 1.06, tracking -0.018em, width 106%): the single h1 per page, display stack.
- **Section headline** (600, `clamp(1.75rem, 3.2vw, 2.75rem)`, 1.16, -0.01em, width 104%; chapter titles `clamp(1.9rem, 3vw, 2.6rem)`, -0.012em): band titles and chapter titles.
- **Prose heading** (600, 1.16, display stack; `clamp(1.5rem, 2.2vw, 2rem)` for h2 in a section, 1.125rem for h3): inside reading content.
- **Lede** (400, `clamp(1.125rem, 1.5vw, 1.3125rem)`, 1.55, Graphite 2, 46ch): the one explanation under a headline.
- **Body** (400, 1.0625rem, 1.65, Graphite, tabular numerals, 68ch `--measure`): prose; notes, captions and plate definitions step down to 0.9375rem, 0.875rem at the smallest.
- **Panel caps** (600, 0.8125rem, uppercase, tracking 0.12–0.13em, width 116%): plate titles and procedure names.
- **Label** (600, 0.75rem, uppercase, tracking 0.11em, width 108%, Graphite 3): printed labels on windows, callouts, notes, table captions and heads, footer groups, pager links.
- **Data** (JetBrains Mono, 400, 0.8125rem, 1.65): commands, recorded lines, plate terms, spec tables.
- **Data chrome** (JetBrains Mono, 400–500, 0.75rem, tracking 0.04–0.06em): channel numbers, spec stamps, run tags, strip ticks (12px/500); legend repository names are 0.8125rem/500.
- **Calibration figure** (JetBrains Mono, 400, 1.5rem, 1.15): the plate's four numbers, each followed by a 0.875rem Archivo explanation.

### Named Rules

**The Three Voices Rule.** Archivo for lettering and text, "mgit Display" for CJK at display sizes, JetBrains Mono for data, paths, commands and tables. No fourth face, and mono is never a costume for "technical" — it is reserved for things that are literally code, data or measurement.

**The Panel-Caps Rule.** Every all-caps line in this system is small: 0.75–0.8125rem, 0.09–0.13em tracking, 108/116% width. Large display caps do not exist here.

**The Subset Rule.** "mgit Display" carries only the 155 characters the shipped headings use; anything outside that set falls back to the platform CJK stack, which is not the world's voice. New zh-TW display copy must be added to the subset, or it arrives in a platform face.

**The Tabular Rule.** All numerals are `tabular-nums`; counts, exit codes and durations must align in columns without a mono face.

## Layout

A 1440px shell (`--shell`) centered with `clamp(16px, 4vw, 48px)` side padding. The spacing rhythm is one 8px unit: `--u` with `--s1`–`--s8` = 8 / 16 / 24 / 32 / 48 / 72 / 112 / 160px. Shipped rules consume `s1`–`s7`; `s8` (160px) is declared headroom. Reading measures are explicit: 68ch for prose (`--measure`), 62ch for chapter intros and plate definitions, 46ch for a lede, 74ch for a logbook description.

Bands sit on the same paper: `padding-block: 112px` (72px at ≤900px) with a 1px Graphite top rule; a band head keeps a 48px gap to its content. Two-column content uses `repeat(auto-fit, minmax(min(320px, 100%), 1fr))` with 48/72px gaps; stacked groups use 24px (48px when wide). The instrument frame is a two-column grid — printed legend `minmax(210px, 244px)` plus a 1fr strip, split by a 2px Graphite rule — and the strip holds `clamp(280px, 36vh, 380px)` of height. The docs layer is `minmax(220px, 264px)` plus 1fr with a 72px gutter, and the nav column is sticky at 16px from the top with a 2px Graphite right rule.

Responsive behavior is three steps — 1100, 900, 620. At ≤1100px the docs collapse to a single column and the nav becomes static, full width above the article, with a 2px bottom rule instead of the right one. At ≤900px the instrument stacks the legend above the strip (the 2px divider becomes a bottom rule), band padding drops to 72px, and plate rows stack into term-over-definition. At ≤620px body text drops to 1rem, mono inside windows and runlogs to 0.75rem, the strip grows to 340px, legend columns narrow to 2.7rem, and the logbook row drops its arrow. Pages are light-only (`color-scheme: light`); there is no dark counterpart, because the plate is an object, not a theme.

### Named Rules

**The One-Sheet Rule.** Landing and docs are the same paper. Sections are separated by a hairline rule and 112px of quiet — not by cards, containers-with-borders, or background changes.

**The 8px Rule.** Every gap, padding and offset is a step on the unit: 8 / 16 / 24 / 32 / 48 / 72 / 112. A one-off spacing value is a bug in the system, not a style choice.

## Elevation & Depth

Flat by default: there is no shadow on the paper itself, no gradient fill, no glow, and no colored shadow anywhere in the build. Depth is a printing metaphor carried by exactly two soft graphite lifts and two inset bevels. The sheet can be lifted (the instrument frame floats off the desk), the plate can be seated (the dark object casts into the paper), and a hole can be punched (windows and switches carry an inset top highlight and a bottom inset shadow so they read as openings and keycaps). Interactive state is expressed by inversion and punch-out — hover turns a row white, a copied switch inverts to Graphite — never by raising it.

### Shadow Vocabulary

- **Lifted sheet** (`box-shadow: 0 26px 50px -44px rgba(21, 22, 26, 0.65)`): the instrument frame, once.
- **Seated plate** (`box-shadow: 0 24px 48px -40px rgba(21, 22, 26, 0.9)`): the dark plate and footer object.
- **Punched window** (`box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 0 rgba(21, 22, 26, 0.05)`): the window and the runlog frame.
- **Keycap** (`box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85), inset 0 -2px 0 rgba(21, 22, 26, 0.09)`): the copy switch at rest; pressed it becomes `inset 0 2px 0 rgba(21, 22, 26, 0.12)` and moves `translateY(1px)`.

### Named Rules

**The Two-Shadows Rule.** The depth vocabulary is these four values, full stop. A new shadow needs a printing reason — a lifted sheet, a seated plate, a punched hole — and decoration is not one.

**The Inversion Rule.** Hover and selection are printed as ink/paper inversion or a punched white opening, not as elevation: `background: Graphite, color: Paper` for a copied switch, white for a hovered logbook row or the current nav item.

## Shapes

Square corners everywhere: the only radii in the shipped rules are the 1px focus ring and the 8px scrollbar thumb. Frames are 1px Graphite hairlines (`--hair`) at the default, and 2px Graphite marks structure — the head band, the legend divider, table heads, the docs nav, the pager, the procedure head. Interior separation is a dotted 1px Heavy Rule Pink hairline (legend rows, docnav items, table rows) or a dotted 2/6 lane rule in the strip. The recurring silhouette is the printed mark: a 7px square Graphite bullet in prose lists, a 6px Alarm square after the current chapter number, a 10×2px rule as a pen-weight swatch, a 5px flag triangle, a 6px cross, an 18px arrow, a 14×8 carriage block. All icons are authored SVG at 12–20px with 1.4–1.6px strokes at the same weight; nothing is an emoji or a glyph standing in for an icon.

### Named Rules

**The Hairline-and-Punch Rule.** Hierarchy comes from rule weight (1px hair, 2px structure) and from printed marks. Never from radius, never from a container's background, never from a border above 2px on a card, callout or list item.

## Components

### Paper stocks (the surface)

Character: two cuts of the same stock, one for the instrument and one for reading. `paper-chart` lays two 1px repeating-linear gradients over `--paper`: Fine Grid Pink at 8px pitch and Heavy Rule Pink at 40px pitch (every fifth line). `paper-log` lays a single 1px Logbook Rule Pink line at 48px. Both are background images on the body element, so the paper runs edge to edge behind everything and is never a card.

### Instrument frame (legend + strip)

Character: a printed recorder, not a chart widget. A 1px Graphite border on paper, the lifted-sheet shadow, split by a 2px Graphite vertical rule into a narrow printed legend (`minmax(210px, 244px)`) and a 1fr strip. The legend's head row prints two labels; each channel row is a baseline-aligned grid of `CH 0n` (0.75rem mono, Graphite 3), the repository name (0.8125rem mono, weight 500) and a meta line that carries branch, change count and the state word, separated by dotted Heavy Rule Pink hairlines. The strip holds a real drawn SVG, the run tag, the caption line, the state vocabulary and the exit line.

### Traces (the pens)

Character: three pen weights and two marks, drawn from the page's own record. The strips are rendered by `recorder.js` from `<script type="application/json" id="mgit-runs">`, so legend, traces and captions can never disagree; the SVG is `aria-hidden` presentation, `viewBox` matched to pixel size, lane rules at each boundary, baseline at the quarter line.

- **Clean pen** — 1.5px Channel Blue, dead flat across the lane.
- **Dirty pen** — 1.6px Graphite, one square S-curve excursion per change (7px corner radius, plateau capped at 58px, amplitude ≤ min(lane × 0.36, 34)), each closed with a 5px Graphite flag mark.
- **Failed pen** — 1.9px Alarm, one violent overshoot to 1.85× amplitude that rings and settles, marked with a 6px Alarm cross and the exit code as 12px/700 Alarm mono.
- **Lane furniture** — 1px Heavy Rule Pink dashed 2/6 line at each lane edge, 1px Fine Grid Pink baseline at the quarter line.
- **Legend linkage** — hovering a legend row drops every other trace to 0.26 opacity and lifts the named one to 3.2px.

### Carriage sweep (the one authored moment)

Character: the recorder's pen carriage crossing the paper. A 1px Graphite head at 40% opacity with a 14×8 Graphite block travels left to right over 2400ms on a requestAnimationFrame cubic ease-out, while each trace draws itself with `stroke-dashoffset` 1 → 0 (paths carry `pathLength="1"`), one lane staggered 60ms, easing `cubic-bezier(.22, .61, .24, 1)`. Marks and ticks stay hidden until 82% of the sweep (1968ms) and fade in over 260ms linear; the carriage then parks at the right edge and fades out over 200ms. It fires once when the strip first crosses 35% of the viewport, redraws on resize (settled), and can be replayed by the **replay control**: a punched white chip with a 12px drawn glyph and a label in panel caps, inverting to Graphite/Paper on hover in 140ms. Under `prefers-reduced-motion: reduce` the script settles immediately — traces drawn, marks visible, carriage parked and hidden — and the replay control re-settles instead of animating.

### Punched window and copy switch

Character: a command printed into a punched hole. The window is white (`--window`), 1px Graphite bordered, with the punched-window bevel and `0.55 / 0.65 / 0.55 / 0.75rem` padding; a label on the left names the platform or tool, and the command sets in 0.8125rem mono with `white-space: pre` and horizontal scroll — commands are never wrapped. The switch at its end is paper stock, 1px Graphite bordered, panel caps, `0.42 / 0.6rem` padding, keycap bevel; hover presses it to Deep Paper, `:active` drops it 1px and swaps the bevel, and the copied state inverts to Graphite/Paper in 140ms with the label swapped to `已複製` / `COPIED` for 1800ms (`aria-live="polite"`; copy failure swaps to `請手動複製`). The language switch in the head is the same component with two states, the current language inverted to Graphite/Paper.

### Engraved plate (spec table, calibration figures, rows)

Character: the instrument's spec plate — the only dark object on the page. `--plate` ground, Plate Ivory ink, 1px plate border, seated-plate shadow; head in panel caps (title) with a mono spec stamp in Plate Dim, body padding 32px. Three interior forms: **calibration figures** in an auto-fit `minmax(240px, 1fr)` grid at 32px gaps, each a mono 1.5rem number above a 0.875rem Archivo explanation in Plate Dim; **spec tables** in mono 0.8125rem with plate hairlines at 0.1/0.2 alpha, header in Plate Dim, first column Plate Ivory and never wrapping; and **rows** of a mono term plus a 0.9375rem definition (#cfcdc6 literal, 62ch) over 0.1-alpha rules. Links inside a plate take Plate Blue.

### Runlog (the recorded session)

Character: a printed frame for a real terminal session. White body inside a 1px Graphite border; a bar in paper stock carrying the run name and location in 0.75rem mono with a 1px Graphite rule beneath it; the body sets in 0.8125rem mono at 1.65 with `white-space: pre` and horizontal scroll. The site only frames and inks what the binary printed: the 80-`=` rules in a dusty literal (#a8545f), folder lines in Graphite 500, quiet blank lines in Graphite 3, failures in Alarm, the summary in Graphite 2. The symbols (`📂`, `✗`) and the column layout are the CLI's own print reproduced verbatim — the site has no emoji iconography of its own; its marks are drawn SVG.

### Logbook row (the index)

Character: a row of the record book. Grid `4.5rem 1fr auto` on baseline with 24px block padding and a Heavy Rule Pink hairline under it: `CH 0n` in 0.75rem mono Graphite 3, chapter name in the display stack at 1.0625rem/500, description at 0.9375rem Graphite 2 capped at 74ch, and an 18px drawn arrow at the right edge. Hover and `:focus-visible` punch the row white; nothing moves. At ≤620px the row drops to `3.4rem 1fr` and the arrow is removed.

### Docs navigation and pager

Character: the logbook's table of contents, then the page turn. The nav is a sticky column (16px from the top) with a 2px Graphite right rule, a panel-caps title over a 1px Graphite rule, and items that grid a channel number beside the chapter name over dotted hairlines; the current page is punched white, weighted 600, and its channel number gets a 6px Alarm square. The chapter head itself is title and intro only — no stamp above the title — and the pager closes a chapter over a 2px Graphite top rule, with a panel-caps `下一章 · CH 0n` label above the destination name, blue on hover.

### Footer plate

Character: the page ends on the instrument's base plate. `--plate` ground with three auto-fit groups (`minmax(220px, 1fr)`), group titles in panel caps Plate Dim, links in Plate Blue, definitions at 0.9375rem (#cfcdc6 literal), and a colophon row across a 0.2-alpha plate rule at 0.8125rem with the licence link at the right.

### State vocabulary

Character: the printed key that makes the strip legible without color. Five words appear once per strip foot — 乾淨 clean · 有變更 dirty · 失敗 failed · 被中斷 interrupted · 找不到儲存庫 no repos — each with a 10×2px pen-weight swatch. Swatch inks: Channel Blue for clean, Graphite for dirty, Alarm for failed, Graphite 2 for interrupted and no-repos. Words not active in the run dim to Graphite 3 with a Heavy Rule Pink swatch. Word and pen agree, and alarm is reserved: dirty prints Graphite 2 and marks Graphite, while only failed prints and marks Alarm.

### Head band, skip link, browser surfaces

The head is a single band over a 2px Graphite bottom rule: the wordmark sets at 122% width and weight 700 beside a mono spec stamp, nav links are panel caps with a blue underline on hover, and the language switch sits at the right. A skip link is punched white, parked at -100px and dropped to 16px on focus. Browser surfaces belong to the system: `::selection` is pink (#f7d8dd literal) on Graphite, the caret is Alarm, scrollbars are Heavy Rule Pink on a transparent track (12px, 4px paper border, 8px radius), and focus is a 2px Channel Blue outline at 2px offset with a 1px radius.

## Do's and Don'ts

### Do:

- **Do** keep every surface on one of the two stocks — `paper-chart` on instrument surfaces, `paper-log` on reading pages — and let the paper run edge to edge.
- **Do** let ink carry content and paper carry structure: grid pinks are background ruling, hairlines and scrollbars, nothing more.
- **Do** pair every failure with a mark and a word (failed pen + cross + `exit 128`), and print the whole five-word state vocabulary once per strip.
- **Do** set display-size CJK in the `--display` stack so it lands in "mgit Display", and extend the 155-character subset when new headline copy appears.
- **Do** keep commands, paths, channel names, exit codes, plate terms and spec tables in JetBrains Mono; keep prose in Archivo.
- **Do** hold every gap to the 8px unit: 112px between bands, 48px from a band head to its content, 24–32px inside groups.
- **Do** keep corners square, and express state as inversion (Graphite/Paper) or a punched white opening.
- **Do** honor reduced motion by settling the strip to its final state — drawn traces, visible marks, parked carriage — rather than suppressing the drawing.
- **Do** theme the browser surfaces (selection, caret, scrollbars, focus ring) from the same palette; all four already ship themed.

### Don't:

- **Don't** put text, icons, borders or state into the grid pinks, and don't use Heavy Rule Pink as anything but a hairline, a separator or the scrollbar.
- **Don't** introduce a fourth ink. Graphite, Channel Blue and Alarm are the whole meaning layer; a second accent dilutes the alarm.
- **Don't** use Alarm as decoration — it only appears with a failure word, a code, or a cross.
- **Don't** add rounded panels, soft UI shadows, glows, gradient fills or colored shadows; the two lifts and two bevels in Elevation & Depth are the entire depth vocabulary.
- **Don't** carry plate inks onto paper or paper inks onto the plate: the dark object has its own four inks, and the page keeps its three.
- **Don't** invert the site into a dark theme; pages declare `color-scheme: light`, and the plate stays an object on paper.
- **Don't** hang a label, kicker or eyebrow above a heading. No chapter head, band or page carries one: a chapter head is its title and intro, the chapter coordinate lives in the navigation (where `aria-current` marks the open one), and the version lives in the head band's spec stamp and the navigation title. The heading carries its own weight.
- **Don't** reproduce the CLI's printed symbols as site iconography, and don't style a screen that imitates the terminal outside the runlog frame.
