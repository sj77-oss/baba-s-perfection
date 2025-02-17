import { Suspense } from "react";
import { useRoutes, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/home";
import LoginPage from "./pages/login";
import routes from "tempo-routes";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  return session ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<p>Loading...</p>}>
        <>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              }
            />
          </Routes>
          {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
        </>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
