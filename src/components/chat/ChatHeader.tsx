import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, Menu, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ChatHeaderProps {
  botName?: string;
  botAvatar?: string;
  onSettingsClick?: () => void;
  onMenuClick?: () => void;
}

const ChatHeader = ({
  botName = "AI Assistant",
  botAvatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=bot",
  onSettingsClick = () => {},
  onMenuClick = () => {},
}: ChatHeaderProps) => {
  const { signOut } = useAuth();

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 h-16">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Avatar className="h-10 w-10">
          <AvatarImage src={botAvatar} alt={botName} />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
        <h1 className="text-lg font-semibold text-gray-900">{botName}</h1>
      </div>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onSettingsClick}
          className="text-gray-500 hover:text-gray-700"
        >
          <Settings className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={signOut}
          className="text-gray-500 hover:text-gray-700"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default ChatHeader;
