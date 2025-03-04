import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, LayoutDashboard, Users, Database } from "lucide-react";
import DashboardStats from "@/components/admin/DashboardStats";
import UsersTab from "@/components/admin/UsersTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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
  const [activeTab, setActiveTab] = useState("dashboard");
  const [modelUsage, setModelUsage] = useState<ChartData>([]);

  // User creation state
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [isNewUserAdmin, setIsNewUserAdmin] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userCreationError, setUserCreationError] = useState("");

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

      // Fetch model usage data (simulated for now)
      // In a real implementation, you would track model usage in the database
      setModelUsage([
        { name: "Mixtral 8x7B", value: 45 },
        { name: "Llama 3 70B", value: 30 },
        { name: "Llama 3 8B", value: 15 },
        { name: "Gemma 7B", value: 10 },
      ]);
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

  const handleAddUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserName) {
      setUserCreationError("Please fill in all fields");
      return;
    }

    setIsCreatingUser(true);
    setUserCreationError("");

    try {
      // Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: {
          data: {
            full_name: newUserName,
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Failed to create user");
      }

      // Create profile record
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: authData.user.id,
          email: newUserEmail,
          full_name: newUserName,
          is_admin: isNewUserAdmin,
          avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${authData.user.id}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (profileError) {
        console.error("Profile creation error:", profileError);
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }

      // Reset form and close dialog
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserName("");
      setIsNewUserAdmin(false);
      setShowAddUserDialog(false);
    } catch (error) {
      console.error("User creation error:", error);
      setUserCreationError(
        error instanceof Error
          ? error.message
          : "Failed to create user. Please try again.",
      );
    } finally {
      setIsCreatingUser(false);
    }
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8">
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

            {/* Model Usage Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="border shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-gray-800 flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Model Usage Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={modelUsage} layout="vertical">
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={true}
                        vertical={false}
                      />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "4px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        }}
                        formatter={(value) => [`${value}%`, "Usage"]}
                      />
                      <Bar
                        dataKey="value"
                        fill="#4F46E5"
                        radius={[0, 4, 4, 0]}
                        animationDuration={1000}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <UsersTab />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="admin-role"
                checked={isNewUserAdmin}
                onCheckedChange={setIsNewUserAdmin}
              />
              <Label htmlFor="admin-role">Admin privileges</Label>
            </div>
            {userCreationError && (
              <p className="text-sm text-red-500">{userCreationError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddUserDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={isCreatingUser}>
              {isCreatingUser ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
