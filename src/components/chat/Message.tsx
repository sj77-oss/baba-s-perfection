import React from "react";
import CodeBlock from "./CodeBlock";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg max-w-[80%] mb-4",
        isBot
          ? "bg-[#E3F2FD] mr-auto"
          : "bg-[#F5F5F5] ml-auto flex-row-reverse",
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
            </div>
            <span className="text-xs text-gray-500 mt-1">{timestamp}</span>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default Message;
