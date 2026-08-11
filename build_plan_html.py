"""Render DIAL_Consolidated_Plan_v4.md to a self-contained, printable HTML file.

Deliberately minimal: handles only the markdown constructs actually used in the
plan (headings, pipe tables, fenced code, lists, blockquotes, rules, inline
emphasis/code/links). No external dependencies, no network fonts.
"""

import html
import re
import sys
from pathlib import Path

SRC = Path("DIAL_Consolidated_Plan_v4.md")
OUT = Path("DIAL_Consolidated_Plan_v4.html")

CSS = """
:root {
  --ink: #16181d;
  --muted: #5b6470;
  --rule: #e2e5ea;
  --accent: #1f5f8b;
  --new: #0a6a4a;
  --changed: #8a5a00;
  --blocker: #a3221f;
  --code-bg: #f5f6f8;
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  font: 16px/1.65 "Segoe UI", -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif;
  color: var(--ink);
  background: #fbfbfc;
}
#page { max-width: 62rem; margin: 0 auto; padding: 4rem 3rem 6rem; background: #fff;
        box-shadow: 0 0 0 1px var(--rule); }
h1 { font-size: 2.1rem; line-height: 1.2; letter-spacing: -.015em; margin: 0 0 .5rem; }
h2 { font-size: 1.5rem; line-height: 1.25; margin: 3.2rem 0 1rem; padding-top: 1.4rem;
     border-top: 2px solid var(--ink); letter-spacing: -.01em; }
h3 { font-size: 1.16rem; margin: 2.2rem 0 .7rem; color: var(--accent); }
h4 { font-size: 1.02rem; margin: 1.8rem 0 .6rem; text-transform: uppercase;
     letter-spacing: .06em; color: var(--muted); }
p, li { margin: 0 0 .85rem; }
ul, ol { margin: 0 0 1rem; padding-left: 1.5rem; }
li > ul, li > ol { margin-top: .4rem; }
strong { font-weight: 650; }
a { color: var(--accent); }
code { font: .875em/1.5 "Cascadia Mono", Consolas, "SF Mono", monospace;
       background: var(--code-bg); padding: .12em .35em; border-radius: 3px; }
pre { background: var(--code-bg); border: 1px solid var(--rule); border-radius: 5px;
      padding: .9rem 1.1rem; overflow-x: auto; margin: 0 0 1.2rem; }
pre code { background: none; padding: 0; font-size: .82rem; line-height: 1.55; }
blockquote { margin: 0 0 1.2rem; padding: .1rem 0 .1rem 1.1rem;
             border-left: 3px solid var(--accent); color: var(--muted); }
hr { border: 0; border-top: 1px solid var(--rule); margin: 2.5rem 0; }
table { border-collapse: collapse; width: 100%; margin: 0 0 1.4rem; font-size: .9rem;
        display: block; overflow-x: auto; }
th, td { border: 1px solid var(--rule); padding: .5rem .7rem; text-align: left;
         vertical-align: top; }
th { background: #f0f2f5; font-weight: 650; }
tbody tr:nth-child(even) { background: #fafbfc; }
.tag { display: inline-block; font-size: .68rem; font-weight: 700; letter-spacing: .07em;
       text-transform: uppercase; padding: .12em .45em; border-radius: 3px; vertical-align: .12em;
       white-space: nowrap; }
.tag-new { background: #e3f4ed; color: var(--new); }
.tag-changed { background: #fdf1dc; color: var(--changed); }
.tag-blocker { background: #fbe6e5; color: var(--blocker); }
.tag-verified { background: #eef1f5; color: var(--muted); }
#toc { background: #f7f8fa; border: 1px solid var(--rule); border-radius: 6px;
       padding: 1.4rem 1.8rem; margin: 2.5rem 0 3rem; font-size: .92rem; }
#toc h2 { margin: 0 0 .8rem; border: 0; padding: 0; font-size: 1rem; text-transform: uppercase;
          letter-spacing: .08em; color: var(--muted); }
#toc ol { list-style: none; padding: 0; margin: 0; columns: 2; column-gap: 2.5rem; }
#toc li { margin: 0 0 .3rem; break-inside: avoid; }
#toc .lv3 { padding-left: 1.1rem; font-size: .87rem; }
#toc .lv3 a { color: var(--muted); }
.meta { color: var(--muted); font-size: .92rem; margin-bottom: 2rem; }
@media print {
  body { background: #fff; font-size: 10.5pt; }
  #page { max-width: none; padding: 0; box-shadow: none; }
  h2 { page-break-before: always; page-break-after: avoid; }
  h2:first-of-type { page-break-before: avoid; }
  h3, h4 { page-break-after: avoid; }
  table, pre, blockquote { page-break-inside: avoid; }
  #toc { page-break-after: always; }
  a { color: inherit; text-decoration: none; }
}
@media (max-width: 48rem) {
  #page { padding: 2rem 1.2rem 4rem; }
  #toc ol { columns: 1; }
}
"""

TAGS = {
    "[NEW]": ("tag-new", "New"),
    "[CHANGED]": ("tag-changed", "Changed"),
    "BLOCKER": ("tag-blocker", "Blocker"),
    "[Verified]": ("tag-verified", "Verified"),
    "[Reported]": ("tag-verified", "Reported"),
    "[Unverified]": ("tag-verified", "Unverified"),
}


def slug(text):
    s = re.sub(r"<[^>]+>", "", text).lower()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    return re.sub(r"\s+", "-", s.strip())[:70]


def inline(text):
    """Inline markdown -> HTML. Code spans are extracted first so their contents
    are never re-processed for emphasis."""
    spans = []

    def stash(m):
        spans.append(m.group(1))
        return f"\x00{len(spans) - 1}\x00"

    text = re.sub(r"`([^`]+)`", stash, text)
    text = html.escape(text, quote=False)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<![\w*])\*([^*\n]+)\*(?![\w*])", r"<em>\1</em>", text)

    def unstash(m):
        return f"<code>{html.escape(spans[int(m.group(1))], quote=False)}</code>"

    text = re.sub(r"\x00(\d+)\x00", unstash, text)

    for literal, (cls, label) in TAGS.items():
        needle = f"<code>{html.escape(literal, quote=False)}</code>"
        text = text.replace(needle, f'<span class="tag {cls}">{label}</span>')
        if literal.startswith("["):
            text = text.replace(
                html.escape(literal, quote=False), f'<span class="tag {cls}">{label}</span>'
            )
    return text


def render(md):
    lines = md.split("\n")
    out, toc = [], []
    i, n = 0, len(lines)
    list_stack = []  # open list tags, innermost last

    def close_lists(depth=0):
        while len(list_stack) > depth:
            out.append(f"</{list_stack.pop()}>")

    while i < n:
        line = lines[i]
        stripped = line.strip()

        if stripped.startswith("```"):
            close_lists()
            i += 1
            buf = []
            while i < n and not lines[i].strip().startswith("```"):
                buf.append(lines[i])
                i += 1
            i += 1
            body = html.escape("\n".join(buf), quote=False)
            out.append(f"<pre><code>{body}</code></pre>")
            continue

        if not stripped:
            close_lists()
            i += 1
            continue

        if re.fullmatch(r"(---+|\*\*\*+)", stripped):
            close_lists()
            out.append("<hr>")
            i += 1
            continue

        m = re.match(r"(#{1,6})\s+(.*)", stripped)
        if m:
            close_lists()
            level, text = len(m.group(1)), inline(m.group(2))
            anchor = slug(m.group(2))
            if level in (2, 3):
                toc.append((level, anchor, text))
            out.append(f'<h{level} id="{anchor}">{text}</h{level}>')
            i += 1
            continue

        # Pipe table: header row followed by a delimiter row.
        if stripped.startswith("|") and i + 1 < n and re.fullmatch(
            r"\|[\s:|-]+\|", lines[i + 1].strip()
        ):
            close_lists()

            def cells(row):
                return [c.strip() for c in row.strip().strip("|").split("|")]

            head = cells(lines[i])
            i += 2
            rows = []
            while i < n and lines[i].strip().startswith("|"):
                rows.append(cells(lines[i]))
                i += 1
            out.append("<table><thead><tr>")
            out.extend(f"<th>{inline(c)}</th>" for c in head)
            out.append("</tr></thead><tbody>")
            for row in rows:
                out.append("<tr>")
                out.extend(f"<td>{inline(c)}</td>" for c in row)
                out.append("</tr>")
            out.append("</tbody></table>")
            continue

        if stripped.startswith(">"):
            close_lists()
            buf = []
            while i < n and lines[i].strip().startswith(">"):
                buf.append(lines[i].strip().lstrip(">").strip())
                i += 1
            out.append(f"<blockquote><p>{inline(' '.join(buf))}</p></blockquote>")
            continue

        m = re.match(r"( *)([-*]|\d+\.)\s+(.*)", line)
        if m:
            indent, marker, text = len(m.group(1)), m.group(2), m.group(3)
            tag = "ul" if marker in "-*" else "ol"
            depth = indent // 2 + 1
            if depth > len(list_stack):
                out.append(f"<{tag}>")
                list_stack.append(tag)
            else:
                close_lists(depth)
                if not list_stack:
                    out.append(f"<{tag}>")
                    list_stack.append(tag)
            out.append(f"<li>{inline(text)}</li>")
            i += 1
            continue

        close_lists()
        buf = [stripped]
        i += 1
        while i < n:
            nxt = lines[i].strip()
            if not nxt or re.match(r"(#{1,6}\s|```|\||>|---)", nxt) or re.match(
                r" *([-*]|\d+\.)\s", lines[i]
            ):
                break
            buf.append(nxt)
            i += 1
        out.append(f"<p>{inline(' '.join(buf))}</p>")

    close_lists()

    toc_html = ["<nav id=\"toc\"><h2>Contents</h2><ol>"]
    for level, anchor, text in toc:
        cls = ' class="lv3"' if level == 3 else ""
        toc_html.append(f'<li{cls}><a href="#{anchor}">{text}</a></li>')
    toc_html.append("</ol></nav>")

    return "\n".join(out), "\n".join(toc_html)


def main():
    if not SRC.exists():
        sys.exit(f"Source not found: {SRC}")
    md = SRC.read_text(encoding="utf-8")

    # The first H1 becomes the document title; the TOC is inserted after it.
    body, toc = render(md)
    first_h2 = body.find("<h2")
    body = body[:first_h2] + toc + body[first_h2:] if first_h2 > 0 else toc + body

    words = len(re.findall(r"\S+", re.sub(r"<[^>]+>", " ", body)))
    doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>DIAL Ecosystem - Consolidated Plan v4</title>
<style>{CSS}</style>
</head>
<body>
<main id="page">
<p class="meta">Approximately {words:,} words &middot; print or &ldquo;Save as PDF&rdquo; from your browser</p>
{body}
</main>
</body>
</html>
"""
    OUT.write_text(doc, encoding="utf-8")
    print(f"Wrote {OUT} ({OUT.stat().st_size / 1024:.0f} KB, ~{words:,} words)")


if __name__ == "__main__":
    main()
