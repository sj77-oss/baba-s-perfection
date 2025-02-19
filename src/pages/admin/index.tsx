import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, LayoutDashboard } from "lucide-react";
import DashboardStats from "@/components/admin/DashboardStats";
import { motion } from "framer-motion";
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

  useEffect(() => {
    if (!localStorage.getItem("adminSession")) {
      navigate("/admin-login");
      return;
    }
    setIsAdmin(true);
    fetchChartData();
  }, [navigate]);

  const fetchChartData = async () => {
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
  };

  const processTimeData = (data: any[], type: "day" | "hour") => {
    const counts: { [key: string]: number } = {};

    data.forEach((item) => {
      const date = new Date(item.created_at);
      const key =
        type === "day" ? date.toLocaleDateString() : date.getHours() + ":00";
      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const handleLogout = () => {
    localStorage.removeItem("adminSession");
    navigate("/admin-login");
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold text-gray-800">
            Admin Dashboard
          </h1>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
        </Button>
      </nav>

      <div className="container mx-auto py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <DashboardStats />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Messages Last 7 Days</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={messagesByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#8884d8"
                      fill="#8884d8"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>New Users Last 7 Days</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={usersByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="md:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle>Chats by Hour (Last 24h)</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chatsByHour}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#413ea0" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
