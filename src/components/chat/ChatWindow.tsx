import React from "react";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

interface ChatWindowProps {
  botName?: string;
  botAvatar?: string;
  messages?: Array<{
    id: string;
    content: string;
    isBot: boolean;
    avatar?: string;
    timestamp?: string;
  }>;
  onSendMessage?: (message: string) => void;
  onSettingsClick?: () => void;
  onMenuClick?: () => void;
  isAdmin?: boolean;
}

const ChatWindow = ({
  botName = "AI Assistant",
  botAvatar = "https://api.dicebear.com/7.x/bottts/svg?seed=assistant",
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
  ],
  onSendMessage = (message: string) => {
    console.log("Message sent:", message);
  },
  onSettingsClick = () => {
    console.log("Settings clicked");
  },
  onMenuClick = () => {
    console.log("Menu clicked");
  },
  isAdmin = false,
}: ChatWindowProps) => {
  return (
    <div className="flex flex-col h-screen bg-white">
      <ChatHeader
        botName={botName}
        botAvatar={botAvatar}
        onSettingsClick={onSettingsClick}
        onMenuClick={onMenuClick}
        isAdmin={isAdmin}
      />
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} />
      </div>
      <MessageInput onSendMessage={onSendMessage} />
    </div>
  );
};

export default ChatWindow;
