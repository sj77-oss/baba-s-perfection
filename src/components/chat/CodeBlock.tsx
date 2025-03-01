import React, { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Highlight, themes } from "prism-react-renderer";

interface CodeBlockProps {
  content: string;
  language?: string;
}

const CodeBlock = ({ content, language = "typescript" }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState(language);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${codeLanguage}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Map common language names to prism-supported languages
  const normalizeLanguage = (lang: string): string => {
    const languageMap: Record<string, string> = {
      py: "python",
      js: "javascript",
      ts: "typescript",
      jsx: "jsx",
      tsx: "tsx",
      html: "html",
      css: "css",
      json: "json",
      bash: "bash",
      sh: "bash",
      shell: "bash",
      c: "c",
      cpp: "cpp",
      java: "java",
      php: "php",
      ruby: "ruby",
      rust: "rust",
      go: "go",
      sql: "sql",
    };

    return languageMap[lang.toLowerCase()] || lang;
  };

  // Normalize the language for syntax highlighting
  const normalizedLanguage = normalizeLanguage(codeLanguage);

  // Force a specific theme with better contrast
  const codeTheme = {
    ...themes.nightOwl,
    plain: { ...themes.nightOwl.plain, backgroundColor: "#011627" },
    styles: [
      ...themes.nightOwl.styles,
      {
        types: ["comment", "prolog", "doctype", "cdata"],
        style: { color: "#809393", fontStyle: "italic" },
      },
      { types: ["namespace"], style: { opacity: 0.8 } },
      { types: ["string", "attr-value"], style: { color: "#addb67" } },
      { types: ["punctuation", "operator"], style: { color: "#c792ea" } },
      {
        types: [
          "entity",
          "url",
          "symbol",
          "number",
          "boolean",
          "variable",
          "constant",
          "property",
          "regex",
          "inserted",
        ],
        style: { color: "#f78c6c" },
      },
      {
        types: ["atrule", "keyword", "attr-name", "selector"],
        style: { color: "#c792ea" },
      },
      { types: ["function", "deleted", "tag"], style: { color: "#f07178" } },
      { types: ["function-variable"], style: { color: "#82AAFF" } },
      { types: ["tag", "selector", "keyword"], style: { color: "#ff5874" } },
    ],
  };

  return (
    <div className="relative group rounded-lg bg-gray-900 text-gray-50">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 rounded-t-lg">
        <div className="text-sm font-mono text-gray-400">{codeLanguage}</div>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-gray-300"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-gray-300"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <Highlight
        theme={codeTheme}
        code={content.trim()}
        language={normalizedLanguage}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className="p-4 overflow-x-auto rounded-b-lg max-w-full"
            style={{ ...style, overflowX: "auto", maxWidth: "100%" }}
          >
            {tokens.map((line, i) => (
              <div
                key={i}
                {...getLineProps({ line })}
                className="whitespace-pre"
              >
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
};

export default CodeBlock;
