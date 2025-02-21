import { useEffect, useState, useCallback } from "react";
import { debounce } from "lodash";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, Activity, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Stats = {
  totalUsers: number;
  totalChats: number;
  totalMessages: number;
  activeUsers: number;
};

export default function DashboardStats() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalChats: 0,
    totalMessages: 0,
    activeUsers: 0,
  });

  const fetchStats = useCallback(
    debounce(async () => {
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

        // Get active users in last 24h
        const { data: activeUsers } = await supabase
          .from("messages")
          .select("user_id", { count: "exact", head: false })
          .gte(
            "created_at",
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          )
          .not("user_id", "is", null); // Get all non-null user_ids

        // Count unique users
        const uniqueActiveUsers = new Set(
          activeUsers?.map((msg) => msg.user_id) || [],
        );

        setStats({
          totalUsers: usersCount || 0,
          totalChats: chatsCount || 0,
          totalMessages: messagesCount || 0,
          activeUsers: uniqueActiveUsers.size || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    }, 2000),
    [],
  );

  useEffect(() => {
    // Initial fetch
    fetchStats();

    // Cleanup
    return () => {
      fetchStats.cancel();
    };

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
      usersChannel.unsubscribe();
      chatsChannel.unsubscribe();
      messagesChannel.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-white hover:bg-gray-50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
          <p className="text-xs text-muted-foreground">Registered users</p>
        </CardContent>
      </Card>

      <Card className="bg-white hover:bg-gray-50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalChats}</div>
          <p className="text-xs text-muted-foreground">Active conversations</p>
        </CardContent>
      </Card>

      <Card className="bg-white hover:bg-gray-50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalMessages}</div>
          <p className="text-xs text-muted-foreground">Messages exchanged</p>
        </CardContent>
      </Card>

      <Card className="bg-white hover:bg-gray-50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Active Users (24h)
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeUsers}</div>
          <p className="text-xs text-muted-foreground">
            Users active in last 24h
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
