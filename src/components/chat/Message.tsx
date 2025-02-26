import React from "react";
import CodeBlock from "./CodeBlock";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileText, Image as ImageIcon, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MessageProps {
  content: string;
  isBot?: boolean;
  avatar?: string;
  timestamp?: string;
  isLoading?: boolean;
  attachments?: Array<{
    type: string;
    url: string;
  }>;
}

const Message = ({
  content = "Hello! This is a sample message.",
  isBot = false,
  avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=default",
  timestamp = new Date().toLocaleTimeString(),
  isLoading = false,
  attachments = [],
}: MessageProps) => {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg max-w-[80%] mb-4 shadow-sm transition-all duration-200 hover:shadow-md",
        isBot
          ? "bg-gradient-to-br from-blue-50 to-blue-100/50 mr-auto"
          : "bg-gradient-to-br from-gray-50 to-gray-100/50 ml-auto flex-row-reverse",
      )}
    >
      <Avatar className="w-10 h-10">
        <AvatarImage src={avatar} alt={isBot ? "Bot" : "User"} />
        <AvatarFallback>{isBot ? "B" : "U"}</AvatarFallback>
      </Avatar>

      <div className={cn("flex flex-col", isBot ? "items-start" : "items-end")}>
        {isLoading ? (
          <div className="flex items-center space-x-2 p-2">
            <div className="flex space-x-1">
              <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce"></div>
            </div>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-800 whitespace-pre-wrap space-y-4">
              {content.split("```").map((part, index) => {
                if (index % 2 === 1) {
                  // This is a code block
                  const [lang, ...code] = part.trim().split("\n");
                  return (
                    <CodeBlock
                      key={index}
                      content={code.join("\n")}
                      language={lang || "typescript"}
                    />
                  );
                }
                // This is regular text
                return <div key={index}>{part}</div>;
              })}
              {attachments.map((attachment, index) => (
                <div
                  key={`attachment-${index}`}
                  className="mt-2 p-3 bg-white/50 rounded-lg border flex items-center gap-3 hover:bg-white/80 transition-colors"
                >
                  {attachment.type === "document" ? (
                    <FileText className="h-5 w-5 text-blue-500" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-green-500" />
                  )}
                  {attachment.type === "image" && (
                    <img
                      src={attachment.url}
                      alt="Uploaded"
                      className="max-w-[200px] rounded-lg"
                    />
                  )}
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-700 transition-colors"
                  >
                    {attachment.type === "document"
                      ? "View Document"
                      : "View Full Size"}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
            <span className="text-xs text-gray-500 mt-1">{timestamp}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default Message;
