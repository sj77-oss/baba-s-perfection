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
        theme={themes.nightOwl}
        code={content.trim()}
        language={normalizedLanguage}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className="p-4 overflow-x-auto rounded-b-lg" style={style}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
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
