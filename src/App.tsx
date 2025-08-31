import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";
import { AppInitializer } from "./components/AppInitializer";

// Pages
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AdminLogin from "./pages/auth/AdminLogin";
import ChildDashboard from "./pages/child/Dashboard";
import ChildProfile from "./pages/child/Profile";
import AboutChild from "./pages/child/About";
import ParentDashboard from "./pages/parent/Dashboard";
import ParentProfile from "./pages/parent/Profile";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminServicePage from "./pages/admin/ServicePage.tsx";
import About from "./pages/AboutNew"; // Страница "О нас" с загрузкой из БД
import PaymentSuccess from "./pages/PaymentSuccess"; // Страница успешной оплаты
import NotFound from "./pages/NotFound";
import { AboutContentProvider } from "./contexts/AboutContentContext";

// Components
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AboutContentProvider>
            <BrowserRouter>
              <AppInitializer />
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/landing" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin/login" element={<AdminLogin />} />

                {/* Protected routes */}
                <Route
                  path="/child"
                  element={
                    <ProtectedRoute allowedRoles={["child"]}>
                      <ChildDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/child/profile"
                  element={
                    <ProtectedRoute allowedRoles={["child"]}>
                      <ChildProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/child/about"
                  element={
                    <ProtectedRoute allowedRoles={["child"]}>
                      <AboutChild />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/parent"
                  element={
                    <ProtectedRoute allowedRoles={["parent"]}>
                      <ParentDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/parent/profile"
                  element={
                    <ProtectedRoute allowedRoles={["parent"]}>
                      <ParentProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/about"
                  element={
                    <ProtectedRoute allowedRoles={["parent"]}>
                      <About />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/services/:id"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <AdminServicePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payment-success"
                  element={
                    <ProtectedRoute allowedRoles={["parent"]}>
                      <PaymentSuccess />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            <PWAInstallPrompt />
            <Toaster />
          </AboutContentProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
