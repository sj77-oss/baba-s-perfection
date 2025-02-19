import LoginForm from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function LoginPage() {
  const { session } = useAuth();

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-gray-400">
          Sign in to continue or create a new account
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
