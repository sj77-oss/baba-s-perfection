import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type Chat = Database["public"]["Tables"]["chats"]["Row"];

interface ChatSidebarProps {
  onChatSelect: (chatId: string) => void;
  selectedChatId?: string;
}

export default function ChatSidebar({
  onChatSelect,
  selectedChatId,
}: ChatSidebarProps) {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    // Initial fetch
    const fetchChats = async () => {
      const { data } = await supabase
        .from("chats")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) setChats(data);
    };

    fetchChats();

    // Subscribe to changes
    const channel = supabase
      .channel("chats")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chats",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setChats((prev) => [payload.new as Chat, ...prev]);
          } else if (payload.eventType === "DELETE") {
            setChats((prev) =>
              prev.filter((chat) => chat.id !== payload.old.id),
            );
          } else if (payload.eventType === "UPDATE") {
            setChats((prev) =>
              prev.map((chat) =>
                chat.id === payload.new.id ? (payload.new as Chat) : chat,
              ),
            );
          }
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  const createNewChat = async () => {
    if (!user) return;

    const { data: chat } = await supabase
      .from("chats")
      .insert([
        {
          user_id: user.id,
          title: "New Chat",
        },
      ])
      .select()
      .single();

    if (chat) {
      onChatSelect(chat.id);
    }
  };

  const deleteChat = async (chatId: string) => {
    await supabase.from("chats").delete().eq("id", chatId);
  };

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      <div className="p-4">
        <Button
          onClick={createNewChat}
          className="w-full justify-start"
          variant="outline"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {chats.map((chat) => (
            <Button
              key={chat.id}
              variant={selectedChatId === chat.id ? "secondary" : "ghost"}
              className="w-full justify-between group"
              onClick={() => onChatSelect(chat.id)}
            >
              <span className="truncate">{chat.title}</span>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
              >
                ×
              </Button>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
