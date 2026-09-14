# mgit website

The product and documentation site for `mgit`: <https://mgit.gh.miniasp.com/>.
zh-TW at the root, a full English mirror under `en/`, and a browser sandbox
where the whole tool can be tried without installing it.

**Viewing the site needs no build step.** The HTML, CSS and JavaScript in this
directory are the finished artefact; any static host can serve them, and every
page works with JavaScript switched off apart from the playground itself.

## The playground is a port, not a mock-up

`assets/js/engine/` is a rule-by-rule port of the parts of mgit that decide
what happens:

| File | Ported from |
| --- | --- |
| `cli.js` | `src/cli.rs` — option parsing, the hand-over rule, the error messages |
| `discovery.js` | `src/discovery.rs` — the walk, the depth limit, symbolic links, the ordering |
| `report.js` | `src/report.rs` and `src/color.rs` — the header, the summary, the glyph sets, the escape sequences |
| `console.js` | `src/console.rs` — the colour and glyph policies and their precedence |
| `run.js` | `src/app.rs` — the orchestration, the aggregation, the exit codes |
| `help.js` | generated from the compiled binary by `build/capture-cli.sh` |

`git` itself is **simulated** (`engine/git.js`): the sandbox knows what the
scripted repositories should answer for the commands people actually try, and
for anything outside that set it says so rather than inventing output. That
line is drawn on the playground page too, because a visitor deserves to know
which half is real.

`engine/shell.js` adds the small shell around it — variable assignments,
`>` and `2>` redirects, and a pipe into `head`, `grep` and friends — because
several of mgit's promises (the summary going to stderr, `NO_COLOR`, SIGPIPE)
are only visible from a shell.

### The parity test is what keeps it honest

`tests/parity.test.mjs` builds each fixture **twice**: once as the sandbox
filesystem and once as real directories with real `git init` repositories. It
then runs the same command lines through the compiled binary and through the
browser engine and compares stdout, stderr and the exit code byte for byte.

```sh
cargo build --release
node --test website/tests/*.test.mjs
```

Eight workspaces times thirty-seven command lines, plus the unit tests for the
shell, the interrupt and the parsing corners that have no output of their own.
If the Rust changes and the port does not, this goes red.

## Working on it

```sh
python3 website/build/build.py          # rewrite every page from the content modules
python3 website/build/serve.py 8801     # preview at http://localhost:8801/ with no caching
node --test website/tests/*.test.mjs    # engine unit tests + parity against the binary
node website/build/audit.mjs            # overflow, landmarks, labels, heading order, 3 viewports
python3 website/build/check-contrast.py # WCAG AA, including the worst pixel of every texture
```

The pages are generated, so **edit the content, not the HTML**. Both languages
live in `build/content_zh.py` and `build/content_en.py` and carry the same
structure; `build.py` refuses to build when the chapters, the heading ids, the
block shapes, the scenario ids or the label keys drift apart, and it also
fails when the interface asks for a label that neither language defines.

```
build/
  build.py            the generator: pages, sitemap, robots, manifest, 404
  content_zh.py       zh-TW copy (primary)
  content_en.py       English copy (mirror, same structure)
  components.py       the interactive parts, as markup both languages share
  layout.py           document head, header, footer
  render.py           HTML helpers and the small inline markup the content uses
  capture-cli.sh      regenerate engine/help.js from the compiled binary
  make-assets.py      icons and the social card, rendered with Chrome
  make-textures.py    the surface grain, re-laid on the design tokens
  check-contrast.py   the contrast gate
  audit.mjs           headless responsive and accessibility audit
  screenshot.mjs      screenshots at an exact device width
  serve.py            preview server, no caching, GitHub Pages style 404
```

## Design

Two themes, one instrument. The page is a bench and the terminal is the tool on
it, so the terminal keeps the same dark palette in both themes: a terminal that
changes colour with the page stops reading as a terminal.

Colour never carries a state on its own. Every exit code is a number, every
repository state is a word, every diagnostic says which stream it came from.

Type is Archivo for prose and JetBrains Mono for anything a terminal would
show; both are self-hosted (OFL) latin subsets, so the site makes no third
party request of any kind. Chinese headings fall back to the system CJK face.

### The textures are generated, and they say so

`assets/img/textures/*.jpg` are AI-generated **surface grain** and nothing
else: no object, no scene, no illustration, and no image anywhere on this site
pretends to be a photograph of a product. Each one carries its generation
prompt twice, in a sidecar `.prompt.txt` and inside the JPEG comment, and the
sources they came from are kept in `build/texture-sources/`.

A generated texture cannot be used as it arrives. Laid straight onto the page
it either disappears, because its grain is too even to survive the browser's
scaling, or it drags the surface off the colour the design system declares. So
`make-textures.py` separates the grain from its own lighting, re-centres it on
the exact token colour it will cover, and then writes, measures and corrects
until the grain that survives JPEG is the amplitude that was asked for.

Because the grain is real, contrast has to be measured against **the worst
pixel of the texture**, not against the token's average. `check-contrast.py`
does that: the darkest grain of a light surface, the brightest grain of a dark
one. The lowest figure on the site today is 4.64, against the 4.5 that AA asks
for. Change a texture's amplitude or a text colour and run it again.

## What this site will not do

No analytics, no cookies, no fonts or scripts from anywhere else, no
newsletter, and nothing that needs a server. Nothing is stored about a visitor
except two conveniences in their own browser: the theme they picked and the
command history of the sandbox terminal.

No invented evidence, either: no testimonials, no download counts, no
benchmarks, no roadmap promises. The claims on the page are the ones the
repository can back — eight release targets with SHA-256 checksums, an npm
package with six platform binaries and no postinstall, MIT, and a demo whose
output is produced by a port that is tested against the real binary.

## Deployment

`.github/workflows/deploy-pages.yml` publishes this directory to GitHub Pages
on every push to `main` that touches it. `build/`, `tests/` and this README are
author tools, so the workflow leaves them out of what it uploads. The workflow runs the site tests, the
generator (and fails when the committed HTML is not what the content produces),
the contrast gate and the audit before it deploys.

The custom domain is `mgit.gh.miniasp.com`, kept in `CNAME`.
