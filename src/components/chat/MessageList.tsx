import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import Message from "./Message";

interface MessageData {
  id: string;
  content: string;
  isBot: boolean;
  avatar?: string;
  timestamp?: string;
  isLoading?: boolean;
}

interface MessageListProps {
  messages?: MessageData[];
}

const MessageList = ({
  messages = [
    {
      id: "1",
      content: "Hello! How can I help you today?",
      isBot: true,
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=assistant",
      timestamp: "10:00 AM",
    },
    {
      id: "2",
      content: "I have a question about the service.",
      isBot: false,
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=user",
      timestamp: "10:01 AM",
    },
    {
      id: "3",
      content: "I'd be happy to help! What would you like to know?",
      isBot: true,
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=assistant",
      timestamp: "10:02 AM",
    },
  ],
}: MessageListProps) => {
  return (
    <div className="h-full w-full bg-white p-4">
      <ScrollArea className="h-full w-full pr-4">
        <div className="flex flex-col max-w-full">
          {messages.map((message) => (
            <Message
              key={message.id}
              content={message.content}
              isBot={message.isBot}
              avatar={message.avatar}
              timestamp={message.timestamp}
              isLoading={message.isLoading}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MessageList;
