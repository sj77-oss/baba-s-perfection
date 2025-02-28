import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Copy, Check } from "lucide-react";

interface ChatExportProps {
  chatId?: string;
  chatTitle?: string;
  messages?: Array<{
    content: string;
    isBot: boolean;
    timestamp?: string;
  }>;
}

const ChatExport = ({
  chatId = "sample-chat-id",
  chatTitle = "Sample Chat",
  messages = [
    {
      content: "Hello! How can I help you today?",
      isBot: true,
      timestamp: "10:00 AM",
    },
    {
      content: "I have a question about the service.",
      isBot: false,
      timestamp: "10:01 AM",
    },
    {
      content: "I'd be happy to help! What would you like to know?",
      isBot: true,
      timestamp: "10:02 AM",
    },
  ],
}: ChatExportProps) => {
  const [copied, setCopied] = useState(false);

  const formatChatForExport = () => {
    let exportText = `Chat: ${chatTitle}\nDate: ${new Date().toLocaleDateString()}\n\n`;

    messages.forEach((message) => {
      exportText += `[${message.timestamp || new Date().toLocaleTimeString()}] ${message.isBot ? "AI" : "User"}: ${message.content}\n\n`;
    });

    return exportText;
  };

  const handleCopy = async () => {
    const text = formatChatForExport();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = formatChatForExport();
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${chatTitle.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full max-w-md mx-auto border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Export Chat</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-md">
          <h3 className="font-medium mb-2">{chatTitle}</h3>
          <p className="text-sm text-gray-500">
            {messages.length} messages · {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" className="flex-1" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" /> Copied
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" /> Copy to Clipboard
              </>
            )}
          </Button>
          <Button variant="default" className="flex-1" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" /> Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatExport;
