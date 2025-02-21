import React, { useState, useEffect } from "react";
import ChatWindow from "@/components/chat/ChatWindow";
import { getGeminiResponse } from "@/lib/gemini";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import ChatSidebar from "./chat/ChatSidebar";

const Home = () => {
  const { user } = useAuth();
  const [selectedChatId, setSelectedChatId] = useState<string>();
  const [currentChat, setCurrentChat] = useState<{
    id: string;
    title: string;
  }>();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();
      setIsAdmin(!!profile?.is_admin);
    };
    checkAdmin();
  }, [user]);

  // Reset messages when no chat is selected
  useEffect(() => {
    if (!selectedChatId) {
      setMessages([
        {
          id: "welcome",
          content: "Welcome! How can I assist you today?",
          isBot: true,
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bot",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setCurrentChat(undefined);
    }
  }, [selectedChatId]);

  const [messages, setMessages] = useState<
    Array<{
      id: string;
      content: string;
      isBot: boolean;
      avatar?: string;
      timestamp?: string;
    }>
  >([]);

  useEffect(() => {
    if (!selectedChatId || !user) return;

    const fetchMessages = async () => {
      const { data: chat } = await supabase
        .from("chats")
        .select("*")
        .eq("id", selectedChatId)
        .single();

      if (chat) setCurrentChat(chat);

      const { data: messages } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", selectedChatId)
        .order("created_at", { ascending: true });

      if (messages) {
        setMessages(
          messages.map((msg) => ({
            id: msg.id,
            content: msg.content || "",
            isBot: msg.is_ai || false,
            avatar: msg.is_ai
              ? "https://api.dicebear.com/7.x/avataaars/svg?seed=bot"
              : "https://api.dicebear.com/7.x/avataaars/svg?seed=user",
            timestamp: new Date(msg.created_at).toLocaleTimeString(),
          })),
        );
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${selectedChatId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const msg = payload.new;
            setMessages((prev) => [
              ...prev,
              {
                id: msg.id,
                content: msg.content || "",
                isBot: msg.is_ai || false,
                avatar: msg.is_ai
                  ? "https://api.dicebear.com/7.x/avataaars/svg?seed=bot"
                  : "https://api.dicebear.com/7.x/avataaars/svg?seed=user",
                timestamp: new Date(msg.created_at).toLocaleTimeString(),
              },
            ]);
          }
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [selectedChatId, user]);

  // Load messages when a chat is selected
  useEffect(() => {
    if (!selectedChatId || !user) return;

    const loadChat = async () => {
      try {
        // Get chat details
        const { data: chat } = await supabase
          .from("chats")
          .select()
          .eq("id", selectedChatId)
          .single();

        if (chat) setCurrentChat(chat);

        // Get messages
        const { data: messages } = await supabase
          .from("messages")
          .select()
          .eq("chat_id", selectedChatId)
          .order("created_at", { ascending: true });

        if (messages) {
          setMessages(
            messages.map((msg) => ({
              id: msg.id,
              content: msg.content || "",
              isBot: msg.is_ai || false,
              avatar: msg.is_ai
                ? "https://api.dicebear.com/7.x/avataaars/svg?seed=bot"
                : "https://api.dicebear.com/7.x/avataaars/svg?seed=user",
              timestamp: new Date(msg.created_at).toLocaleTimeString(),
            })),
          );
        }
      } catch (error) {
        console.error("Error loading chat:", error);
      }
    };

    loadChat();
  }, [selectedChatId, user]);

  // Subscribe to message updates
  useEffect(() => {
    if (!selectedChatId) return;

    const channel = supabase
      .channel(`messages-${selectedChatId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${selectedChatId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const msg = payload.new;
            setMessages((prev) => [
              ...prev,
              {
                id: msg.id,
                content: msg.content || "",
                isBot: msg.is_ai || false,
                avatar: msg.is_ai
                  ? "https://api.dicebear.com/7.x/avataaars/svg?seed=bot"
                  : "https://api.dicebear.com/7.x/avataaars/svg?seed=user",
                timestamp: new Date(msg.created_at).toLocaleTimeString(),
              },
            ]);
          }
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [selectedChatId]);

  // Welcome message when no chat is selected
  useEffect(() => {
    if (!selectedChatId) {
      setMessages([
        {
          id: "1",
          content: "Welcome! How can I assist you today?",
          isBot: true,
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bot",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  }, [selectedChatId]);

  const handleSendMessage = async (message: string) => {
    if (!selectedChatId || !user) return;

    try {
      // Add user message to UI immediately
      const userMessageTemp = {
        id: Date.now().toString(),
        content: message,
        isBot: false,
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, userMessageTemp]);

      // Save user message to database
      const { data: userMessage } = await supabase
        .from("messages")
        .insert([
          {
            chat_id: selectedChatId,
            content: message,
            is_ai: false,
            user_id: user.id, // Add user_id to track who sent the message
          },
        ])
        .select()
        .single();

      // Update chat title with first message
      if (messages.length === 0) {
        await supabase
          .from("chats")
          .update({ title: message })
          .eq("id", selectedChatId);
      }

      // Add a loading message for the bot
      const loadingMessageId = Date.now().toString();
      setMessages((prev) => [
        ...prev,
        {
          id: loadingMessageId,
          content: "",
          isBot: true,
          isLoading: true,
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bot",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      // Get bot response
      const response = await getGeminiResponse(message);

      // Remove loading message and add actual response
      setMessages((prev) => prev.filter((msg) => msg.id !== loadingMessageId));

      // Add bot response to UI immediately
      const botMessageTemp = {
        id: (Date.now() + 1).toString(),
        content: response,
        isBot: true,
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bot",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, botMessageTemp]);

      // Save bot response to database
      await supabase.from("messages").insert([
        {
          chat_id: selectedChatId,
          content: response,
          is_ai: true,
        },
      ]);
    } catch (error) {
      console.error("Error getting response:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ChatSidebar
        selectedChatId={selectedChatId}
        onChatSelect={setSelectedChatId}
      />
      <div className="container mx-auto px-4 h-screen">
        <div className="h-full py-4">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full">
            <ChatWindow
              botName="AI Assistant"
              botAvatar="https://api.dicebear.com/7.x/avataaars/svg?seed=bot"
              messages={messages}
              onSendMessage={handleSendMessage}
              isAdmin={isAdmin}
              onSettingsClick={() => {
                console.log("Settings clicked");
              }}
              onMenuClick={() => {
                console.log("Menu clicked");
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
