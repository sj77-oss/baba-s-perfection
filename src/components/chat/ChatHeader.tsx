import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, Menu, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ChatHeaderProps {
  botName?: string;
  botAvatar?: string;
  onSettingsClick?: () => void;
  onMenuClick?: () => void;
  isAdmin?: boolean;
}

const ChatHeader = ({
  botName = "AI Assistant",
  botAvatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=bot",
  onSettingsClick = () => {},
  onMenuClick = () => {},
  isAdmin = false,
}: ChatHeaderProps) => {
  const { signOut } = useAuth();

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm backdrop-blur-sm bg-white/90 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-primary/10">
            <AvatarImage src={botAvatar} alt={botName} />
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{botName}</h1>
            <p className="text-sm text-gray-500">Always ready to help</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (window.location.href = "/admin")}
            className="text-gray-500 hover:text-gray-700"
          >
            <Shield className="h-5 w-5" />
          </Button>
        )}
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
