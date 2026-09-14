"""The interactive pieces of the site, as markup both languages share.

Every component works as plain HTML first: the terminal shows a recorded
transcript, the tabs show the first panel, the depth explorer shows a table.
The scripts then take over and make them live.
"""

from __future__ import annotations

from render import attrs, esc, icon, inline


def terminal(
    *,
    ident: str,
    title: str,
    labels: dict,
    fixed: bool = True,
    with_input: bool = True,
    actions: str = "",
    hints: list[tuple[str, str]] | None = None,
    fallback: str = "",
) -> str:
    """The terminal shell: title bar, screen, and the prompt line."""
    classes = "term term--fixed" if fixed else "term"
    hint_html = ""
    if hints:
        items = "".join(f"<span><kbd>{esc(key)}</kbd> {esc(text)}</span>" for key, text in hints)
        hint_html = f'<div class="term__hint">{items}</div>'

    input_html = ""
    if with_input:
        input_html = f"""<div class="term__input-row">
<span class="term__prompt"><span data-term-prompt-live>~/work</span> $</span>
<label class="visually-hidden" for="{esc(ident)}-input">{esc(labels['input_label'])}</label>
<input class="term__input" id="{esc(ident)}-input" data-term-input type="text" autocomplete="off"
 autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="{esc(labels['input_placeholder'])}">
</div>"""

    return f"""<div class="{classes}" id="{esc(ident)}" data-terminal>
<div class="term__bar">
<span class="term__dots" aria-hidden="true"><i></i><i></i><i></i></span>
<span class="term__title">{esc(title)}</span>
<span class="term__bar-actions">
<button type="button" class="term__btn" data-term-stop hidden>{icon('stop')}{esc(labels['stop'])}</button>
{actions}
</span>
</div>
<div class="term__screen" data-term-screen role="log" aria-live="polite" aria-atomic="false"
 aria-label="{esc(labels['screen_label'])}" tabindex="0">{esc(fallback)}</div>
{input_html}
{hint_html}
</div>"""


def install_tabs(ident: str, items: list[dict], labels: dict) -> str:
    """One command per platform, as a tab group that works without scripts."""
    tabs = ""
    panels = ""
    for index, item in enumerate(items):
        tab_id = f"{ident}-tab-{index}"
        panel_id = f"{ident}-panel-{index}"
        selected = "true" if index == 0 else "false"
        tabs += (
            f'<button type="button" class="tab" role="tab" id="{tab_id}" aria-controls="{panel_id}" '
            f'aria-selected="{selected}" tabindex="{0 if index == 0 else -1}">{esc(item["label"])}</button>'
        )
        note = f'<p class="cmd__note">{inline(item["note"])}</p>' if item.get("note") else ""
        panels += (
            f'<div id="{panel_id}" role="tabpanel" aria-labelledby="{tab_id}"{" hidden" if index else ""}>'
            f'<div class="cmd cmd--lg" data-copy-source>'
            f'<code class="cmd__text" data-copy-text>{esc(item["command"])}</code>'
            f'<button type="button" class="cmd__copy" data-copy="{esc(item["command"])}">'
            f'{icon("copy")}<span data-copy-label>{esc(labels["copy"])}</span></button></div>{note}</div>'
        )
    return (
        f'<div data-tabs><div class="tabs" role="tablist" aria-label="{esc(labels["install_tablist"])}">{tabs}</div>'
        f"{panels}</div>"
    )


def depth_explorer(labels: dict) -> str:
    """A slider over --depth, answering the one question the flag raises."""
    return f"""<div class="panel" data-depth-explorer>
<div class="panel__head"><h3>{esc(labels['depth_title'])}</h3></div>
<div class="panel__body">
<div class="slider-row">
<label for="depth-range">{esc(labels['depth_label'])}</label>
<input type="range" id="depth-range" min="1" max="3" value="1" step="1" data-depth-range
 aria-describedby="depth-answer">
<output class="badge" data-depth-value>1</output>
<span id="depth-answer" class="small muted" data-depth-answer>{esc(labels['depth_found'].replace('{n}', '1'))}</span>
</div>
<div class="split split--2" style="margin-top:var(--s4)">
<div>
<h4 class="small muted">{esc(labels['depth_tree'])}</h4>
<pre class="block" data-depth-tree></pre>
</div>
<div>
<h4 class="small muted">{esc(labels['depth_output'])}</h4>
<pre class="block" data-depth-output></pre>
</div>
</div>
</div>
</div>"""


def stream_demo(labels: dict) -> str:
    """What lands in the file, and what stays on the screen."""
    return f"""<div class="panel" data-stream-demo>
<div class="panel__head"><h3>{esc(labels['stream_title'])}</h3></div>
<div class="panel__body">
<div class="chips" data-stream-commands></div>
<div class="split split--2" style="margin-top:var(--s4)">
<div>
<h4 class="small muted">{esc(labels['stream_file'])} <code>status.txt</code></h4>
<pre class="block" data-stream-file></pre>
</div>
<div>
<h4 class="small muted">{esc(labels['stream_screen'])}</h4>
<pre class="block" data-stream-screen></pre>
</div>
</div>
<p class="cmd__note" data-stream-note></p>
</div>
</div>"""


def playground_layout(labels: dict, scenarios: list[dict], targets: list[dict]) -> str:
    """The playground: workspace, terminal, inspector."""
    scenario_options = "".join(
        f'<option value="{esc(entry["id"])}">{esc(entry["name"])}</option>' for entry in scenarios
    )
    target_options = "".join(
        f'<option value="{esc(entry["id"])}">{esc(entry["name"])}</option>' for entry in targets
    )

    actions = (
        f'<button type="button" class="term__btn" data-copy-transcript>'
        f'{icon("copy")}<span data-copy-label>{esc(labels["copy_transcript"])}</span></button>'
        f'<button type="button" class="term__btn" data-reset>{icon("reset")}{esc(labels["reset"])}</button>'
    )

    hints = [
        ("Enter", labels["hint_run"]),
        ("Tab", labels["hint_complete"]),
        ("↑ ↓", labels["hint_history"]),
        ("Ctrl+C", labels["hint_interrupt"]),
        ("Ctrl+L", labels["hint_clear"]),
    ]

    term = terminal(
        ident="pg-terminal",
        title=labels["terminal_title"],
        labels=labels,
        fixed=True,
        with_input=True,
        actions=actions,
        hints=hints,
        fallback=labels["terminal_fallback"],
    )

    return f"""<div class="shell shell--wide">
<noscript><p class="noscript">{esc(labels['noscript'])}</p></noscript>
<div class="pg__toolbar">
<div class="field">
<label for="pg-scenario">{esc(labels['scenario'])}</label>
<select id="pg-scenario" data-scenario>{scenario_options}</select>
</div>
<div class="field">
<label for="pg-target">{esc(labels['target'])}</label>
<select id="pg-target" data-target>{target_options}</select>
</div>
<div class="field">
<span class="field__label">{esc(labels['simulate'])}</span>
<div class="chips">
<button type="button" class="btn btn--small" data-git-toggle aria-pressed="false">{esc(labels['no_git'])}</button>
<button type="button" class="btn btn--small" data-animate-toggle aria-pressed="true">{esc(labels['animate'])}</button>
<button type="button" class="btn btn--small" data-share>{icon('link')}<span data-copy-label>{esc(labels['share'])}</span></button>
</div>
</div>
<p class="small muted" data-scenario-note style="flex:1 1 260px;margin:0"></p>
</div>

<div class="pg" data-playground>
<section class="panel" data-workspace aria-labelledby="pg-workspace-title">
<div class="panel__head"><h2 id="pg-workspace-title">{esc(labels['workspace'])}</h2></div>
<div class="panel__body panel__body--flush">
<ul class="tree" data-workspace-list></ul>
</div>
<div class="panel__body">
<p class="small muted" data-workspace-summary></p>
<div class="field">
<label for="pg-new-repo">{esc(labels['add_repo'])}</label>
<div class="chips">
<input type="text" id="pg-new-repo" data-workspace-name placeholder="new-service" autocomplete="off" style="flex:1">
<button type="button" class="btn btn--small" data-workspace-add>{esc(labels['add'])}</button>
</div>
</div>
</div>
</section>

<section aria-labelledby="pg-terminal-title">
<h2 id="pg-terminal-title" class="visually-hidden">{esc(labels['terminal_title'])}</h2>
{term}
<div class="chips" data-quick-commands style="margin-top:var(--s4)"></div>
</section>

<section class="panel inspector" data-inspector aria-labelledby="pg-inspector-title">
<div class="panel__head"><h2 id="pg-inspector-title">{esc(labels['inspector'])}</h2></div>
<div class="panel__body">
<p class="small muted" data-inspector-empty>{esc(labels['inspector_empty'])}</p>
<div data-inspector-body></div>
</div>
</section>
</div>
</div>"""
