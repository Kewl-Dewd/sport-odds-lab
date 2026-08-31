// Minimal markdown renderer for lesson bodies (headings, lists, tables,
// bold/inline code, blockquotes). Intentionally tiny — no external deps.
import { Fragment } from "react";

function inline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-semibold text-foreground">
          {p.slice(2, -2)}
        </strong>
      );
    }
    if (p.startsWith("`") && p.endsWith("`")) {
      return (
        <code key={`${keyPrefix}-${i}`} className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
          {p.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={`${keyPrefix}-${i}`}>{p}</Fragment>;
  });
}

export function LessonMarkdown({ body }: { body: string }) {
  const lines = body.split("\n");
  const blocks: JSX.Element[] = [];
  let list: string[] = [];
  let table: string[] = [];

  const flushList = () => {
    if (!list.length) return;
    const items = [...list];
    list = [];
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="ml-5 list-disc space-y-1 text-sm text-muted-foreground">
        {items.map((it, i) => (
          <li key={i}>{inline(it, `li-${blocks.length}-${i}`)}</li>
        ))}
      </ul>,
    );
  };

  const flushTable = () => {
    if (!table.length) return;
    const rows = table
      .filter((r) => !/^\|[\s|:-]+\|$/.test(r.trim()))
      .map((r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
    table = [];
    if (!rows.length) return;
    const [head, ...body_] = rows;
    blocks.push(
      <div key={`tbl-${blocks.length}`} className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              {head.map((c, i) => (
                <th key={i} className="py-1.5 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body_.map((r, ri) => (
              <tr key={ri} className="border-b border-border/50 last:border-0">
                {r.map((c, ci) => (
                  <td key={ci} className="py-1.5 pr-4 font-mono text-xs text-muted-foreground">{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
    );
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    if (line.trim().startsWith("|")) {
      flushList();
      table.push(line);
      return;
    }
    flushTable();

    if (/^\s*[-*]\s+/.test(line)) {
      list.push(line.replace(/^\s*[-*]\s+/, ""));
      return;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      list.push(line.replace(/^\s*\d+\.\s+/, ""));
      return;
    }
    flushList();

    if (!line.trim()) return;

    if (line.startsWith("### ")) {
      blocks.push(
        <h4 key={idx} className="pt-1 text-sm font-semibold text-foreground">{inline(line.slice(4), `h4-${idx}`)}</h4>,
      );
    } else if (line.startsWith("## ")) {
      blocks.push(
        <h3 key={idx} className="pt-1 text-base font-semibold text-foreground">{inline(line.slice(3), `h3-${idx}`)}</h3>,
      );
    } else if (line.startsWith("# ")) {
      blocks.push(
        <h3 key={idx} className="text-lg font-semibold text-foreground">{inline(line.slice(2), `h2-${idx}`)}</h3>,
      );
    } else if (line.startsWith("> ")) {
      blocks.push(
        <blockquote key={idx} className="border-l-2 border-primary/50 pl-3 text-sm italic text-muted-foreground">
          {inline(line.slice(2), `bq-${idx}`)}
        </blockquote>,
      );
    } else {
      blocks.push(
        <p key={idx} className="text-sm leading-relaxed text-muted-foreground">{inline(line, `p-${idx}`)}</p>,
      );
    }
  });

  flushList();
  flushTable();

  return <div className="space-y-2.5">{blocks}</div>;
}
