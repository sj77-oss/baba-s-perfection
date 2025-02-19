import AdminLoginForm from "@/components/admin/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
        <p className="text-gray-400">Access the admin dashboard</p>
      </div>
      <AdminLoginForm />
    </div>
  );
}
