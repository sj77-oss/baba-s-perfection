import { useEffect, useState, useCallback, useRef } from "react";
import { debounce } from "lodash";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, Activity, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

type Stats = {
  totalUsers: number;
  totalChats: number;
  totalMessages: number;
  avgMessagesPerChat: number;
};

export default function DashboardStats() {
  const mounted = useRef(false);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalChats: 0,
    totalMessages: 0,
    avgMessagesPerChat: 0,
  });

  const fetchStats = useCallback(
    debounce(async () => {
      if (!mounted.current) return;
      try {
        // Get total users
        const { data: users, error: usersError } = await supabase
          .from("profiles")
          .select("*");

        if (usersError) {
          console.error("Error fetching users:", usersError);
          throw usersError;
        }

        const usersCount = users?.length || 0;

        // Get total chats
        const { data: chats, error: chatsError } = await supabase
          .from("chats")
          .select("*");

        if (chatsError) {
          console.error("Error fetching chats:", chatsError);
          throw chatsError;
        }

        const chatsCount = chats?.length || 0;

        // Get total messages
        const { data: messages, error: messagesError } = await supabase
          .from("messages")
          .select("*");

        if (messagesError) {
          console.error("Error fetching messages:", messagesError);
          throw messagesError;
        }

        const messagesCount = messages?.length || 0;

        // Calculate average messages per chat
        const avgMessages = chatsCount > 0 ? messagesCount / chatsCount : 0;

        setStats({
          totalUsers: usersCount || 0,
          totalChats: chatsCount || 0,
          totalMessages: messagesCount || 0,
          avgMessagesPerChat: Math.round(avgMessages * 10) / 10,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    }, 2000),
    [],
  );

  useEffect(() => {
    mounted.current = true;
    // Initial fetch
    fetchStats();

    // Set up realtime subscriptions
    const usersChannel = supabase
      .channel("users-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => fetchStats(),
      )
      .subscribe();

    const chatsChannel = supabase
      .channel("chats-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chats" },
        () => fetchStats(),
      )
      .subscribe();

    const messagesChannel = supabase
      .channel("messages-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => fetchStats(),
      )
      .subscribe();

    // Refresh stats every minute for active users
    const interval = setInterval(fetchStats, 60000);

    return () => {
      mounted.current = false;
      fetchStats.cancel();
      usersChannel.unsubscribe();
      chatsChannel.unsubscribe();
      messagesChannel.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[
        {
          title: "Total Users",
          value: stats.totalUsers,
          icon: Users,
          gradient: "from-blue-600 to-indigo-600",
          description: "Registered users",
        },
        {
          title: "Total Chats",
          value: stats.totalChats,
          icon: MessageSquare,
          gradient: "from-emerald-500 to-teal-500",
          description: "Active conversations",
        },
        {
          title: "Total Messages",
          value: stats.totalMessages,
          icon: Activity,
          gradient: "from-orange-500 to-amber-500",
          description: "Messages exchanged",
        },
        {
          title: "Avg Messages/Chat",
          value: stats.avgMessagesPerChat,
          icon: MessageSquare,
          gradient: "from-purple-600 to-indigo-600",
          description: "Average messages per chat",
        },
      ].map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
          className="transform-gpu"
        >
          <Card
            className={`bg-gradient-to-br ${stat.gradient} text-white shadow-xl hover:shadow-2xl transition-all relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-white/5 rounded-lg transform rotate-12 scale-150 translate-x-1/2 translate-y-[-10%] opacity-20"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/90">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-white/80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <p className="text-xs text-white/70">{stat.description}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
