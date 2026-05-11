import { useState, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

type MCQ = { q: string; options: { letter: string; text: string }[]; answer: string; explanation: string };

// Parse blocks like:
// **Q1.** What is X?
// - A) ...
// - B) ...
// **Answer:** B — explanation
function parseMCQs(text: string): { mcqs: MCQ[]; rest: string } | null {
  const re = /\*\*Q\d+\.\*\*\s*([\s\S]*?)\n((?:\s*[-*]\s*[A-D]\)[^\n]*\n?){2,5})\s*\*\*Answer:\*\*\s*([A-D])\s*[—\-:]?\s*([^\n]*)/g;
  const mcqs: MCQ[] = [];
  let m: RegExpExecArray | null;
  let last = 0;
  let consumedAll = true;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last && text.slice(last, m.index).trim().length > 0) consumedAll = false;
    const optLines = m[2].split("\n").map((l) => l.trim()).filter(Boolean);
    const options = optLines.map((l) => {
      const mm = l.match(/^[-*]\s*([A-D])\)\s*(.+)$/);
      return mm ? { letter: mm[1], text: mm[2].trim() } : null;
    }).filter(Boolean) as MCQ["options"];
    mcqs.push({ q: m[1].trim(), options, answer: m[3], explanation: (m[4] || "").trim() });
    last = m.index + m[0].length;
  }
  if (mcqs.length === 0) return null;
  if (text.slice(last).trim().length > 0) consumedAll = false;
  return { mcqs, rest: consumedAll ? "" : text };
}

const CodeBlock = ({ language, value, isDark }: { language: string; value: string; isDark: boolean }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="my-3 rounded-xl overflow-hidden border border-border/60 bg-[hsl(var(--muted))]">
      <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider bg-muted/60 border-b border-border/60 text-muted-foreground">
        <span>{language || "text"}</span>
        <button onClick={copy} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={isDark ? oneDark : oneLight}
        PreTag="div"
        customStyle={{ margin: 0, padding: "12px 14px", background: "transparent", fontSize: "12.5px" }}
        wrapLongLines={false}
      >
        {value.replace(/\n$/, "")}
      </SyntaxHighlighter>
    </div>
  );
};

const McqCard = ({ mcq, idx }: { mcq: MCQ; idx: number }) => (
  <div className="my-4 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4 space-y-3">
    <div className="flex items-start gap-2">
      <span className="shrink-0 inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-md bg-primary/15 text-primary text-xs font-mono font-semibold">Q{idx + 1}</span>
      <p className="font-medium text-sm leading-relaxed">{mcq.q}</p>
    </div>
    <ul className="space-y-1.5">
      {mcq.options.map((o) => {
        const correct = o.letter === mcq.answer;
        return (
          <li key={o.letter} className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
            correct
              ? "border-primary/60 bg-primary/10 text-foreground"
              : "border-border/50 bg-background/40"
          )}>
            <span className={cn(
              "h-6 w-6 shrink-0 rounded-md grid place-items-center text-xs font-semibold",
              correct ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>{o.letter}</span>
            <span>{o.text}</span>
            {correct && <Check className="ml-auto h-4 w-4 text-primary" />}
          </li>
        );
      })}
    </ul>
    {mcq.explanation && (
      <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground leading-relaxed">
        <span className="font-semibold text-foreground">Explanation: </span>{mcq.explanation}
      </div>
    )}
  </div>
);

function MessageContentInner({ content }: { content: string }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  // Normalize \[ ... \] and \( ... \) to $$/$ for remark-math
  const normalized = content
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, inner) => `\n$$${inner}$$\n`)
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, inner) => `$${inner}$`);

  const mcqResult = parseMCQs(normalized);

  return (
    <div className="space-y-2">
      {mcqResult && mcqResult.mcqs.map((mcq, i) => <McqCard key={i} mcq={mcq} idx={i} />)}
      {(!mcqResult || mcqResult.rest) && (
        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-headings:mt-3 prose-headings:mb-2 prose-pre:p-0 prose-pre:bg-transparent prose-code:before:content-none prose-code:after:content-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              code({ inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || "");
                const value = String(children).replace(/\n$/, "");
                if (!inline && match) {
                  return <CodeBlock language={match[1]} value={value} isDark={isDark} />;
                }
                if (!inline) {
                  return <CodeBlock language="text" value={value} isDark={isDark} />;
                }
                return (
                  <code className="rounded bg-muted px-1.5 py-0.5 text-[0.85em] font-mono" {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {mcqResult ? mcqResult.rest : normalized}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export const MessageContent = memo(MessageContentInner);