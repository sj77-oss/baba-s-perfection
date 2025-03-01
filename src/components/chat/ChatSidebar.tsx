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
        // Add animation by manually adding the chat first
        setChats((prev) => [chat, ...prev]);
        onChatSelect(chat.id);
      }
    } catch (error) {
      console.error("Error creating chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      // First delete from database to avoid race conditions
      const { error } = await supabase.from("chats").delete().eq("id", chatId);
      if (error) {
        throw error;
      }

      // Then update UI with animation
      setChats((prev) => prev.filter((chat) => chat.id !== chatId));

      // Only clear selection if the deleted chat was selected
      if (selectedChatId === chatId) {
        // If there are other chats, select the first one
        const remainingChats = chats.filter((chat) => chat.id !== chatId);
        if (remainingChats.length > 0) {
          onChatSelect(remainingChats[0].id);
        } else {
          onChatSelect(undefined);
        }
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      // Revert optimistic update on error
      fetchChats();
    }
  };

  return (
    <div className="w-64 md:w-72 lg:w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-full overflow-hidden transition-all duration-300 max-w-[90vw] min-w-[200px]">
      <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={createNewChat}
            className="w-full justify-start font-medium"
            size="lg"
            disabled={isLoading}
          >
            <Plus className="mr-2 h-5 w-5" />
            <span className="truncate">
              {isLoading ? "Creating..." : "New Chat"}
            </span>
          </Button>
        </motion.div>
      </div>

      <ScrollArea className="flex-1 px-2 py-4 h-[calc(100vh-120px)]">
        <AnimatePresence initial={false}>
          {chats.map((chat) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 4 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
              className={`group relative flex px-3 py-2 rounded-lg transition-colors cursor-pointer w-full ${selectedChatId === chat.id ? "bg-gray-200" : "hover:bg-gray-100"}`}
              onClick={() => onChatSelect(chat.id)}
            >
              <div className="grid grid-cols-[1fr,24px] items-center w-full gap-1">
                <div className="overflow-hidden">
                  <span
                    className="block truncate text-sm"
                    title={chat.title || "New Chat"}
                  >
                    {chat.title || "New Chat"}
                  </span>
                </div>
                <div className="justify-self-end">
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
            </motion.div>
          ))}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
}
