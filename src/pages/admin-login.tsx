import AdminLoginForm from "@/components/admin/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
      <div className="absolute inset-0 flex items-center justify-center -z-10 opacity-20">
        <div className="w-[800px] h-[800px] bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-3xl" />
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Portal</h1>
        <p className="text-gray-500">Access the admin dashboard</p>
      </div>
      <AdminLoginForm />
    </div>
  );
}
