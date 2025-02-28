import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";
import { motion, AnimatePresence } from "framer-motion";

type Chat = Database["public"]["Tables"]["chats"]["Row"];

interface ChatSidebarProps {
  onChatSelect: (chatId: string | undefined) => void;
  selectedChatId?: string;
}

export default function ChatSidebar({
  onChatSelect,
  selectedChatId,
}: ChatSidebarProps) {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchChats = async () => {
    if (!user?.id) return;

    try {
      const { data } = await supabase
        .from("chats")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) setChats(data);
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    fetchChats();

    // Subscribe to ALL chat changes for this user
    const channel = supabase
      .channel(`chats-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chats",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            // Fetch the new chat to ensure we have all fields
            const { data } = await supabase
              .from("chats")
              .select("*")
              .eq("id", payload.new.id)
              .single();

            if (data) {
              setChats((prev) => [data, ...prev]);
            }
          } else if (payload.eventType === "DELETE") {
            setChats((prev) =>
              prev.filter((chat) => chat.id !== payload.old.id),
            );
            if (selectedChatId === payload.old.id) {
              onChatSelect(undefined);
            }
          } else if (payload.eventType === "UPDATE") {
            setChats((prev) =>
              prev.map((chat) =>
                chat.id === payload.new.id ? { ...chat, ...payload.new } : chat,
              ),
            );
          }
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, selectedChatId]);

  const createNewChat = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data: chat, error } = await supabase
        .from("chats")
        .insert([{ user_id: user.id, title: "New Chat" }])
        .select()
        .single();

      if (error) throw error;
      if (chat) {
        onChatSelect(chat.id);
        // No need to manually update chats array - the subscription will handle it
      }
    } catch (error) {
      console.error("Error creating chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      // Optimistically update UI
      setChats((prev) => prev.filter((chat) => chat.id !== chatId));
      if (selectedChatId === chatId) {
        onChatSelect(undefined);
      }

      // Then delete from database
      const { error } = await supabase.from("chats").delete().eq("id", chatId);
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      // Revert optimistic update on error
      fetchChats();
    }
  };

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-white">
        <Button
          onClick={createNewChat}
          className="w-full justify-start font-medium"
          size="lg"
          disabled={isLoading}
        >
          <Plus className="mr-2 h-5 w-5" />
          {isLoading ? "Creating..." : "New Chat"}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2 py-4">
        <AnimatePresence>
          {chats.map((chat) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className={`group relative flex px-3 py-2 rounded-lg transition-colors cursor-pointer w-full ${selectedChatId === chat.id ? "bg-gray-200" : "hover:bg-gray-100"}`}
              onClick={() => onChatSelect(chat.id)}
            >
              <div className="flex items-center w-full gap-2">
                <div className="flex-1 min-w-0">
                  <div className="relative w-full pr-8">
                    <span
                      className="block truncate text-sm"
                      title={chat.title || "New Chat"}
                    >
                      {chat.title || "New Chat"}
                    </span>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 transition-opacity hover:bg-gray-200/50"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          deleteChat(chat.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
}
