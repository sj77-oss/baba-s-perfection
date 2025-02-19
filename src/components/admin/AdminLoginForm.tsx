import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminLoginForm() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { data: admin, error } = await supabase
        .from("admins")
        .select()
        .eq("username", username)
        .eq("password", password)
        .single();

      if (admin) {
        localStorage.setItem("adminSession", "true");
        navigate("/admin");
      } else {
        setError("Invalid credentials");
      }
    } catch (error) {
      setError("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-[350px] bg-white/10 border-white/20 backdrop-blur-sm">
      <CardHeader className="space-y-4 items-center text-center">
        <div className="bg-white/10 p-3 rounded-full w-fit">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <CardTitle className="text-2xl text-white">Admin Login</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
          </div>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Loading..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
