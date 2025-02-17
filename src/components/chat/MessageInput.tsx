import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface MessageInputProps {
  onSendMessage?: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const MessageInput = ({
  onSendMessage = () => {},
  placeholder = "Type your message here...",
  disabled = false,
}: MessageInputProps) => {
  const [message, setMessage] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border-t p-4 flex gap-2 items-center sticky bottom-0 w-full"
    >
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1"
      />
      <Button
        type="submit"
        disabled={!message.trim() || disabled}
        size="icon"
        className="h-10 w-10"
      >
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
};

export default MessageInput;
