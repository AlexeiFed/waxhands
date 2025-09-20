import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";
import { AboutContentProvider } from "./contexts/AboutContentContext";

// Pages
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AdminLogin from "./pages/auth/AdminLogin";
import ChildDashboard from "./pages/child/Dashboard";
import ChildProfile from "./pages/child/Profile";
import AboutChild from "./pages/child/About";
import ParentDashboard from "./pages/parent/Dashboard";
import ParentProfile from "./pages/parent/Profile";
import ParentOffer from "./pages/parent/Offer";
import ParentPrivacyPolicy from "./pages/parent/PrivacyPolicy";
import ParentContacts from "./pages/parent/Contacts";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminServicePage from "./pages/admin/ServicePage.tsx";
import About from "./pages/AboutNew"; // Страница "О нас" с загрузкой из БД
import PaymentSuccess from "./pages/PaymentSuccess"; // Страница успешной оплаты
import PolicyPage from "./pages/PolicyPage"; // Страница политики конфиденциальности
import PaymentSuccessPage from "./pages/payment/SuccessPage"; // Страница успешной оплаты Robokassa
import PaymentFailPage from "./pages/payment/FailPage"; // Страница неуспешной оплаты Robokassa
import NotFound from "./pages/NotFound";

// Components
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AuthGuard } from "./components/auth/AuthGuard";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { PWAForceUpdate } from "./components/PWAForceUpdate";
import { PWAVersionCheck } from "./components/PWAVersionCheck";
import PrivacyConsentBanner from "./components/ui/privacy-consent-banner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 минут
    },
    mutations: {
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Экспоненциальная задержка
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
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/policy" element={<PolicyPage />} />
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
                <Route path="/offer" element={<ParentOffer />} />
                <Route
                  path="/parent/offer"
                  element={
                    <ProtectedRoute allowedRoles={["parent"]}>
                      <ParentOffer />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/parent/privacy-policy"
                  element={
                    <ProtectedRoute allowedRoles={["parent"]}>
                      <ParentPrivacyPolicy />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/parent/contacts"
                  element={
                    <ProtectedRoute allowedRoles={["parent"]}>
                      <ParentContacts />
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
                  path="/admin/service"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <AdminServicePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/about"
                  element={
                    <ProtectedRoute allowedRoles={["parent", "child", "admin"]}>
                      <About />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payment/success"
                  element={
                    <ProtectedRoute allowedRoles={["parent"]}>
                      <PaymentSuccess />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payment/robokassa/success"
                  element={<PaymentSuccessPage />}
                />
                <Route
                  path="/payment/robokassa/fail"
                  element={<PaymentFailPage />}
                />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            <PWAInstallPrompt />
            <PWAForceUpdate />
            <PrivacyConsentBanner />
            <Toaster />
          </AboutContentProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;