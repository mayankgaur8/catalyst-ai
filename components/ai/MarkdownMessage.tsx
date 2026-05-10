"use client";

import React, { memo, useState, useMemo } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Code Block ────────────────────────────────────────────────────────────────

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-white/10 text-sm">
      <div className="flex items-center justify-between px-4 py-1.5 bg-white/5 border-b border-white/8">
        <span className="text-xs text-white/35 font-mono">{lang || "code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-all"
        >
          {copied
            ? <Check size={11} className="text-green-400" />
            : <Copy size={11} />
          }
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
      </div>
      <pre className="px-4 py-3 overflow-x-auto bg-black/40 font-mono leading-relaxed text-white/80 whitespace-pre text-[0.82rem]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ── Inline parser: **bold**, `code` ───────────────────────────────────────────

type InlineNode =
  | { t: "text"; v: string }
  | { t: "bold"; v: string }
  | { t: "code"; v: string };

function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  const re = /(\*\*[^*\n]+\*\*|`[^`\n]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push({ t: "text", v: text.slice(last, m.index) });
    const raw = m[0];
    if (raw.startsWith("**")) nodes.push({ t: "bold", v: raw.slice(2, -2) });
    else nodes.push({ t: "code", v: raw.slice(1, -1) });
    last = m.index + raw.length;
  }

  if (last < text.length) nodes.push({ t: "text", v: text.slice(last) });
  return nodes;
}

function InlineContent({ text }: { text: string }) {
  const nodes = useMemo(() => parseInline(text), [text]);
  return (
    <>
      {nodes.map((n, i) =>
        n.t === "bold" ? (
          <strong key={i} className="font-semibold text-white">{n.v}</strong>
        ) : n.t === "code" ? (
          <code
            key={i}
            className="px-1.5 py-0.5 rounded-md bg-neon-blue/15 text-neon-blue font-mono text-[0.82em] border border-neon-blue/20"
          >
            {n.v}
          </code>
        ) : (
          <React.Fragment key={i}>{n.v}</React.Fragment>
        )
      )}
    </>
  );
}

// ── Block renderer (headings, lists, paragraphs) ──────────────────────────────

interface Block {
  type: "h1" | "h2" | "h3" | "ul" | "ol" | "p" | "blank" | "tip";
  content: string;
  items?: string[];
}

function parseBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let ulItems: string[] = [];
  let olItems: string[] = [];

  const flush = () => {
    if (ulItems.length) { blocks.push({ type: "ul", content: "", items: [...ulItems] }); ulItems = []; }
    if (olItems.length) { blocks.push({ type: "ol", content: "", items: [...olItems] }); olItems = []; }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (!line.trim()) { flush(); blocks.push({ type: "blank", content: "" }); continue; }

    if (line.startsWith("### ")) { flush(); blocks.push({ type: "h3", content: line.slice(4) }); continue; }
    if (line.startsWith("## "))  { flush(); blocks.push({ type: "h2", content: line.slice(3) }); continue; }
    if (line.startsWith("# "))   { flush(); blocks.push({ type: "h1", content: line.slice(2) }); continue; }

    // CAT Tip callout
    if (/^[*\-]?\s*\*?\*?CAT Tip[:\*\*]*/i.test(line)) {
      flush();
      blocks.push({ type: "tip", content: line.replace(/^[-*\s]*\*{0,2}CAT Tip[:\*\*\s]*/i, "") });
      continue;
    }

    const bulletMatch = /^[-*•]\s+(.+)/.exec(line);
    if (bulletMatch) { if (olItems.length) flush(); ulItems.push(bulletMatch[1]); continue; }

    const numberedMatch = /^\d+[.)]\s+(.+)/.exec(line);
    if (numberedMatch) { if (ulItems.length) flush(); olItems.push(numberedMatch[1]); continue; }

    flush();
    blocks.push({ type: "p", content: line });
  }

  flush();
  return blocks;
}

function renderBlocks(blocks: Block[]): React.ReactNode {
  return blocks.map((block, i) => {
    switch (block.type) {
      case "blank": return <div key={i} className="h-2" />;
      case "h1":    return <h2 key={i} className="text-base font-bold text-white mt-4 mb-1"><InlineContent text={block.content} /></h2>;
      case "h2":    return <h3 key={i} className="text-sm font-semibold text-white/90 mt-3 mb-1"><InlineContent text={block.content} /></h3>;
      case "h3":    return <h4 key={i} className="text-sm font-semibold text-white/80 mt-2 mb-0.5"><InlineContent text={block.content} /></h4>;
      case "tip":
        return (
          <div key={i} className="mt-3 px-3 py-2.5 rounded-xl bg-neon-blue/8 border border-neon-blue/20 text-sm">
            <span className="font-semibold text-neon-blue">CAT Tip: </span>
            <span className="text-white/75"><InlineContent text={block.content} /></span>
          </div>
        );
      case "ul":
        return (
          <ul key={i} className="my-2 space-y-1">
            {block.items?.map((item, j) => (
              <li key={j} className="flex gap-2 text-white/80">
                <span className="text-neon-blue mt-[3px] flex-shrink-0">•</span>
                <span><InlineContent text={item} /></span>
              </li>
            ))}
          </ul>
        );
      case "ol":
        return (
          <ol key={i} className="my-2 space-y-1 ml-1">
            {block.items?.map((item, j) => (
              <li key={j} className="flex gap-2 text-white/80">
                <span className="text-neon-blue/70 font-mono text-xs mt-[3px] w-4 flex-shrink-0">{j + 1}.</span>
                <span><InlineContent text={item} /></span>
              </li>
            ))}
          </ol>
        );
      default:
        return (
          <p key={i} className="text-white/80 leading-relaxed">
            <InlineContent text={block.content} />
          </p>
        );
    }
  });
}

// ── Segment splitter: extract code fences first ───────────────────────────────

type Segment =
  | { type: "code"; lang: string; code: string }
  | { type: "text"; content: string };

function splitSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  const re = /```(\w*)\n?([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      segments.push({ type: "text", content: text.slice(last, m.index) });
    }
    segments.push({ type: "code", lang: m[1] || "text", code: m[2].trimEnd() });
    last = m.index + m[0].length;
  }

  if (last < text.length) {
    segments.push({ type: "text", content: text.slice(last) });
  }

  return segments.length ? segments : [{ type: "text", content: text }];
}

// ── Main Component ────────────────────────────────────────────────────────────

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export const MarkdownMessage = memo(function MarkdownMessage({
  content,
  className,
}: MarkdownMessageProps) {
  const segments = useMemo(() => splitSegments(content), [content]);

  return (
    <div className={cn("space-y-0.5 text-sm", className)}>
      {segments.map((seg, i) =>
        seg.type === "code" ? (
          <CodeBlock key={i} lang={seg.lang} code={seg.code} />
        ) : (
          <div key={i}>{renderBlocks(parseBlocks(seg.content.split("\n")))}</div>
        )
      )}
    </div>
  );
});
