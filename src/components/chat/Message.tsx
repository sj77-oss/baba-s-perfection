import React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

interface MessageProps {
  content: string;
  isBot?: boolean;
  avatar?: string;
  timestamp?: string;
}

const Message = ({
  content = "Hello! This is a sample message.",
  isBot = false,
  avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=default",
  timestamp = new Date().toLocaleTimeString(),
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
        <div className="text-sm text-gray-800">{content}</div>
        <span className="text-xs text-gray-500 mt-1">{timestamp}</span>
      </div>
    </motion.div>
  );
};

export default Message;
