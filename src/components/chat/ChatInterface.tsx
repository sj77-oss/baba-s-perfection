import React, { useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

interface ChatInterfaceProps {
  botName?: string;
  botAvatar?: string;
  onSendMessage?: (message: string) => void;
  onSettingsClick?: () => void;
  onMenuClick?: () => void;
  isAdmin?: boolean;
}

const ChatInterface = ({
  botName = "AI Assistant",
  botAvatar = "https://api.dicebear.com/7.x/bottts/svg?seed=assistant",
  onSendMessage = () => {},
  onSettingsClick = () => {},
  onMenuClick = () => {},
  isAdmin = false,
}: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      content: string;
      isBot: boolean;
      avatar?: string;
      timestamp?: string;
      isLoading?: boolean;
    }>
  >([]);

  const handleSendMessage = (message: string) => {
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      content: message,
      isBot: false,
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=user",
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Call the parent handler
    onSendMessage(message);
  };

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
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatInterface;
