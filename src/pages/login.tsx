import LoginForm from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function LoginPage() {
  const { session } = useAuth();

  if (session) {
    return <Navigate to="/" replace />;
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoginForm />
    </div>
  );
}
