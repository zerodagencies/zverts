import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/prism-async-light";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import js from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import ts from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import py from "react-syntax-highlighter/dist/esm/languages/prism/python";
import cpp from "react-syntax-highlighter/dist/esm/languages/prism/cpp";
import c from "react-syntax-highlighter/dist/esm/languages/prism/c";
import java from "react-syntax-highlighter/dist/esm/languages/prism/java";
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup";
import cssLang from "react-syntax-highlighter/dist/esm/languages/prism/css";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import { useTheme } from "next-themes";
import "katex/dist/katex.min.css";

SyntaxHighlighter.registerLanguage("javascript", js);
SyntaxHighlighter.registerLanguage("js", js);
SyntaxHighlighter.registerLanguage("typescript", ts);
SyntaxHighlighter.registerLanguage("ts", ts);
SyntaxHighlighter.registerLanguage("python", py);
SyntaxHighlighter.registerLanguage("py", py);
SyntaxHighlighter.registerLanguage("cpp", cpp);
SyntaxHighlighter.registerLanguage("c", c);
SyntaxHighlighter.registerLanguage("java", java);
SyntaxHighlighter.registerLanguage("html", markup);
SyntaxHighlighter.registerLanguage("css", cssLang);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("sh", bash);
SyntaxHighlighter.registerLanguage("sql", sql);

function normalize(text: string) {
    return text
        .replace(/\\\[([\s\S]+?)\\\]/g, (_, inner) => `\n$$${inner}$$\n`)
        .replace(/\\\(([\s\S]+?)\\\)/g, (_, inner) => `$${inner}$`);
}

interface Props {
    children: string;
    /** When true, wraps paragraph output in <span> — safe inside <button> elements */
    inline?: boolean;
}

function RichTextInner({ children, inline = false }: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme !== "light";
    const text = normalize(children);

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
                ...(inline ? { p: ({ children: c }) => <span>{c}</span> } : {}),
                code({ inline: isInline, className, children: c, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    const value = String(c).replace(/\n$/, "");
                    if (!isInline) {
                        return (
                            <SyntaxHighlighter
                                language={match ? match[1] : "text"}
                                style={isDark ? oneDark : oneLight}
                                PreTag="div"
                                customStyle={{
                                    margin: 0,
                                    padding: "10px 14px",
                                    borderRadius: "8px",
                                    fontSize: "12.5px",
                                }}
                                wrapLongLines={false}
                            >
                                {value}
                            </SyntaxHighlighter>
                        );
                    }
                    return (
                        <code
                            className="rounded bg-muted px-1.5 py-0.5 text-[0.85em] font-mono"
                            {...props}
                        >
                            {c}
                        </code>
                    );
                },
            }}
        >
            {text}
        </ReactMarkdown>
    );
}

export const RichText = memo(RichTextInner);
