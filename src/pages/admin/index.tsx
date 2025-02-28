import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, LayoutDashboard } from "lucide-react";
import DashboardStats from "@/components/admin/DashboardStats";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

type ChartData = {
  name: string;
  value: number;
}[];

export default function AdminPanel() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [messagesByDay, setMessagesByDay] = useState<ChartData>([]);
  const [usersByDay, setUsersByDay] = useState<ChartData>([]);
  const [chatsByHour, setChatsByHour] = useState<ChartData>([]);

  const processTimeData = useCallback((data: any[], type: "day" | "hour") => {
    const now = new Date();
    const counts: { [key: string]: number } = {};

    // Initialize all periods with 0
    if (type === "day") {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        counts[date.toLocaleDateString()] = 0;
      }
    } else {
      for (let i = 23; i >= 0; i--) {
        counts[`${i}:00`] = 0;
      }
    }

    data.forEach((item) => {
      const date = new Date(item.created_at);
      const key =
        type === "day" ? date.toLocaleDateString() : date.getHours() + ":00";
      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => {
        if (type === "day") {
          return new Date(a[0]).getTime() - new Date(b[0]).getTime();
        }
        return parseInt(a[0]) - parseInt(b[0]);
      })
      .map(([name, value]) => ({
        name:
          type === "day"
            ? new Date(name).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })
            : name,
        value,
      }));
  }, []);

  const fetchChartData = useCallback(async () => {
    try {
      // Fetch messages by day
      const { data: messagesData } = await supabase
        .from("messages")
        .select("created_at")
        .gte(
          "created_at",
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        );

      const messagesByDayData = processTimeData(messagesData || [], "day");
      setMessagesByDay(messagesByDayData);

      // Fetch users by day
      const { data: usersData } = await supabase
        .from("profiles")
        .select("created_at")
        .gte(
          "created_at",
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        );

      const usersByDayData = processTimeData(usersData || [], "day");
      setUsersByDay(usersByDayData);

      // Fetch chats by hour
      const { data: chatsData } = await supabase
        .from("chats")
        .select("created_at")
        .gte(
          "created_at",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        );

      const chatsByHourData = processTimeData(chatsData || [], "hour");
      setChatsByHour(chatsByHourData);
    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
  }, [processTimeData]);

  useEffect(() => {
    if (!localStorage.getItem("adminSession")) {
      navigate("/admin-login");
      return;
    }
    setIsAdmin(true);
    fetchChartData();

    // Set up realtime subscriptions
    const messagesChannel = supabase
      .channel("admin-messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => fetchChartData(),
      )
      .subscribe();

    const chatsChannel = supabase
      .channel("admin-chats")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chats" },
        () => fetchChartData(),
      )
      .subscribe();

    const usersChannel = supabase
      .channel("admin-users")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => fetchChartData(),
      )
      .subscribe();

    // Refresh data every minute
    const interval = setInterval(fetchChartData, 60000);

    return () => {
      messagesChannel.unsubscribe();
      chatsChannel.unsubscribe();
      usersChannel.unsubscribe();
      clearInterval(interval);
    };
  }, [navigate, fetchChartData]);

  const handleLogout = () => {
    localStorage.removeItem("adminSession");
    navigate("/admin-login");
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-white overflow-auto">
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm"
      >
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-gray-800" />
          <h1 className="text-xl font-semibold text-gray-800">
            Admin Dashboard
          </h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-gray-600 hover:text-gray-800"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </motion.nav>

      <div className="container mx-auto py-8 space-y-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <DashboardStats />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AnimatePresence>
            {[messagesByDay, usersByDay, chatsByHour].map((data, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={index === 2 ? "lg:col-span-2" : ""}
              >
                <Card className="border shadow-sm hover:shadow-md transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-gray-800">
                      {index === 0
                        ? "Messages Last 7 Days"
                        : index === 1
                          ? "New Users Last 7 Days"
                          : "Chats by Hour (Last 24h)"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      {index === 0 ? (
                        <AreaChart data={data}>
                          <defs>
                            <linearGradient
                              id={`colorMessages-${index}`}
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#60A5FA"
                                stopOpacity={0.8}
                              />
                              <stop
                                offset="95%"
                                stopColor="#60A5FA"
                                stopOpacity={0.1}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(0,0,0,0.1)"
                          />
                          <XAxis
                            dataKey="name"
                            stroke="#374151"
                            tick={{ fill: "#374151" }}
                            tickLine={{ stroke: "#374151" }}
                          />
                          <YAxis
                            stroke="#374151"
                            tick={{ fill: "#374151" }}
                            tickLine={{ stroke: "#374151" }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#fff",
                              border: "1px solid #e5e7eb",
                              borderRadius: "4px",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#60A5FA"
                            strokeWidth={2}
                            fill={`url(#colorMessages-${index})`}
                            animationDuration={1000}
                          />
                        </AreaChart>
                      ) : index === 1 ? (
                        <LineChart data={data}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(0,0,0,0.1)"
                          />
                          <XAxis
                            dataKey="name"
                            stroke="#374151"
                            tick={{ fill: "#374151" }}
                            tickLine={{ stroke: "#374151" }}
                          />
                          <YAxis
                            stroke="#374151"
                            tick={{ fill: "#374151" }}
                            tickLine={{ stroke: "#374151" }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#fff",
                              border: "1px solid #e5e7eb",
                              borderRadius: "4px",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#34D399"
                            strokeWidth={2}
                            dot={{
                              stroke: "#34D399",
                              strokeWidth: 2,
                              fill: "#34D399",
                            }}
                            activeDot={{
                              r: 6,
                              stroke: "#34D399",
                              strokeWidth: 2,
                              fill: "#fff",
                            }}
                            animationDuration={1000}
                          />
                        </LineChart>
                      ) : (
                        <BarChart data={data}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(0,0,0,0.1)"
                          />
                          <XAxis
                            dataKey="name"
                            stroke="#374151"
                            tick={{ fill: "#374151" }}
                            tickLine={{ stroke: "#374151" }}
                          />
                          <YAxis
                            stroke="#374151"
                            tick={{ fill: "#374151" }}
                            tickLine={{ stroke: "#374151" }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#fff",
                              border: "1px solid #e5e7eb",
                              borderRadius: "4px",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            }}
                          />
                          <Bar
                            dataKey="value"
                            fill="#8B5CF6"
                            radius={[4, 4, 0, 0]}
                            animationDuration={1000}
                          />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
