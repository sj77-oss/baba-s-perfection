import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";

type Chat = {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  user_email?: string;
  messages?: Array<{
    id: string;
    content: string;
    is_ai: boolean;
    created_at: string;
  }>;
};

export default function ChatsTab() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

  useEffect(() => {
    const fetchChats = async () => {
      const { data: chatsData } = await supabase.from("chats").select(`
          *,
          profiles!chats_user_id_fkey(email, full_name),
          messages(count)
        `);

      if (chatsData) {
        const formattedChats = chatsData.map((chat: any) => ({
          ...chat,
          user_email: chat.profiles?.email,
          user_name: chat.profiles?.full_name,
          message_count: chat.messages[0]?.count || 0,
        }));
        setChats(formattedChats);
      }
    };

    fetchChats();

    const channel = supabase
      .channel("admin-chats")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chats" },
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
  }, []);

  const deleteChat = async (chatId: string) => {
    await supabase.from("chats").delete().eq("id", chatId);
  };

  const viewChatMessages = async (chat: Chat) => {
    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chat.id)
      .order("created_at", { ascending: true });

    setSelectedChat({ ...chat, messages: messages || [] });
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Messages Count</TableHead>
              <TableHead>View</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chats.map((chat) => (
              <TableRow key={chat.id}>
                <TableCell>{chat.title || "Untitled Chat"}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {chat.user_name || "Unknown"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {chat.user_email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(chat.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>{chat.message_count} messages</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    onClick={() => viewChatMessages(chat)}
                  >
                    View Chat
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    onClick={() => deleteChat(chat.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedChat} onOpenChange={() => setSelectedChat(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Chat Messages</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[500px] w-full pr-4 bg-gray-50">
            <div className="space-y-4 p-4">
              {selectedChat?.messages?.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg ${message.is_ai ? "bg-blue-50" : "bg-gray-100"} max-w-[80%] ${message.is_ai ? "ml-0" : "ml-auto"}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${message.is_ai ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-700"}`}
                    >
                      {message.is_ai ? "AI" : "User"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
