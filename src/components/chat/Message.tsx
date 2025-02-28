import React, { useState } from "react";
import CodeBlock from "./CodeBlock";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { Copy, Check } from "lucide-react";

interface MessageProps {
  content: string;
  isBot?: boolean;
  avatar?: string;
  timestamp?: string;
  isLoading?: boolean;
}

const Message = ({
  content = "Hello! This is a sample message.",
  isBot = false,
  avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=default",
  timestamp = new Date().toLocaleTimeString(),
  isLoading = false,
}: MessageProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg max-w-[80%] mb-4 relative group",
        isBot
          ? "bg-[#E3F2FD] mr-auto"
          : "bg-[#F5F5F5] ml-auto flex-row-reverse",
      )}
    >
      {isBot && !isLoading && (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          aria-label="Copy message"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      )}

      <Avatar className="w-10 h-10">
        <AvatarImage src={avatar} alt={isBot ? "Bot" : "User"} />
        <AvatarFallback>{isBot ? "B" : "U"}</AvatarFallback>
      </Avatar>

      <div className={cn("flex flex-col", isBot ? "items-start" : "items-end")}>
        {isLoading ? (
          <div className="w-full max-w-[300px]">
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex space-x-1">
                <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce"></div>
              </div>
              <span className="text-xs text-gray-500">AI is thinking...</span>
            </div>
            <div className="space-y-2">
              <div className="bg-gray-200 h-4 w-3/4 rounded animate-pulse"></div>
              <div className="bg-gray-200 h-4 w-full rounded animate-pulse"></div>
              <div className="bg-gray-200 h-4 w-5/6 rounded animate-pulse"></div>
              <div className="bg-gray-200 h-4 w-2/3 rounded animate-pulse"></div>
            </div>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-800 whitespace-pre-wrap space-y-4">
              {content.split("```").map((part, index) => {
                if (index % 2 === 1) {
                  // This is a code block
                  // Handle both formats: ```language\ncode or ```language code
                  let lang = "";
                  let code = [];

                  const trimmedPart = part.trim();
                  if (trimmedPart.includes("\n")) {
                    // Format: ```language\ncode
                    const lines = trimmedPart.split("\n");
                    lang = lines[0].trim();
                    code = lines.slice(1);
                  } else {
                    // If no newline, assume the whole part is code with no language
                    lang = "";
                    code = [trimmedPart];
                  }

                  return (
                    <div key={index} className="relative">
                      <CodeBlock
                        key={index}
                        content={code.join("\n")}
                        language={lang || "typescript"}
                      />
                    </div>
                  );
                }
                // This is regular text
                return <div key={index}>{part}</div>;
              })}
            </div>
            <span className="text-xs text-gray-500 mt-1">{timestamp}</span>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default Message;
