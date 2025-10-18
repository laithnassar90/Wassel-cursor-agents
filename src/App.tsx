import { useState, useEffect, Suspense, lazy } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/sonner";
import { PageLoadingFallback, ComponentLoadingFallback } from "./components/LoadingSpinner";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Lazy load all major components with more specific chunks
const LandingPage = lazy(() => import("./components/LandingPage").then(module => ({ default: module.LandingPage })));
const AuthPage = lazy(() => import("./components/AuthPage").then(module => ({ default: module.AuthPage })));
const Sidebar = lazy(() => import("./components/Sidebar").then(module => ({ default: module.Sidebar })));
const Header = lazy(() => import("./components/Header").then(module => ({ default: module.Header })));
const Dashboard = lazy(() => import("./components/Dashboard").then(module => ({ default: module.Dashboard })));
const FindRide = lazy(() => import("./components/FindRide").then(module => ({ default: module.FindRide })));
const OfferRide = lazy(() => import("./components/OfferRide").then(module => ({ default: module.OfferRide })));
const MyTrips = lazy(() => import("./components/MyTrips").then(module => ({ default: module.MyTrips })));
const Messages = lazy(() => import("./components/Messages").then(module => ({ default: module.Messages })));
const Payments = lazy(() => import("./components/Payments").then(module => ({ default: module.Payments })));
const Settings = lazy(() => import("./components/Settings").then(module => ({ default: module.Settings })));
const UserProfile = lazy(() => import("./components/UserProfile").then(module => ({ default: module.UserProfile })));
const NotificationCenter = lazy(() => import("./components/NotificationCenter").then(module => ({ default: module.NotificationCenter })));
const SafetyCenter = lazy(() => import("./components/SafetyCenter").then(module => ({ default: module.SafetyCenter })));
const TripAnalytics = lazy(() => import("./components/TripAnalytics").then(module => ({ default: module.TripAnalytics })));
const RecurringTrips = lazy(() => import("./components/RecurringTrips").then(module => ({ default: module.RecurringTrips })));
const VerificationCenter = lazy(() => import("./components/VerificationCenter").then(module => ({ default: module.VerificationCenter })));
const PerformanceDashboard = lazy(() => import("./components/PerformanceDashboard").then(module => ({ default: module.PerformanceDashboard })));

type AppFlow = "landing" | "auth" | "app";
type Page =
  | "dashboard"
  | "find-ride"
  | "offer-ride"
  | "my-trips"
  | "messages"
  | "payments"
  | "settings"
  | "profile"
  | "notifications"
  | "safety"
  | "analytics"
  | "recurring"
  | "verification"
  | "performance";

function AppContent() {
  const { user, loading, isBackendConnected } = useAuth();
  const [appFlow, setAppFlow] = useState<AppFlow>("landing");
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Show backend status banner (development only)
  useEffect(() => {
    if (!loading && !isBackendConnected && import.meta.env.DEV) {
      console.info(
        "%c✨ Demo Mode Active",
        "color: #008080; font-size: 12px; font-weight: bold",
        "\n📝 Using mock data. To enable real backend, see /GET_STARTED.md"
      );
    }
  }, [loading, isBackendConnected]);

  // Auto-navigate based on auth state
  useEffect(() => {
    if (!loading) {
      if (user && appFlow !== "app") {
        setAppFlow("app");
      } else if (!user && appFlow === "app") {
        setAppFlow("landing");
      }
    }
  }, [user, loading]);

  // Show loading state first
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Wassel...</p>
        </div>
      </div>
    );
  }

  // Landing Page Flow
  if (appFlow === "landing") {
    return (
      <Suspense fallback={<PageLoadingFallback />}>
        <LandingPage
          onGetStarted={() => {
            setAuthMode("signup");
            setAppFlow("auth");
          }}
          onLogin={() => {
            setAuthMode("login");
            setAppFlow("auth");
          }}
        />
      </Suspense>
    );
  }

  // Authentication Flow
  if (appFlow === "auth") {
    return (
      <Suspense fallback={<PageLoadingFallback />}>
        <AuthPage
          initialTab={authMode}
          onSuccess={() => setAppFlow("app")}
          onBack={() => setAppFlow("landing")}
        />
      </Suspense>
    );
  }

  // Main Application
  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <Suspense fallback={<ComponentLoadingFallback />}>
            <Dashboard onNavigate={setCurrentPage} />
          </Suspense>
        );
      case "find-ride":
        return (
          <Suspense fallback={<ComponentLoadingFallback />}>
            <FindRide />
          </Suspense>
        );
      case "offer-ride":
        return (
          <Suspense fallback={<ComponentLoadingFallback />}>
            <OfferRide />
          </Suspense>
        );
      case "my-trips":
        return (
          <Suspense fallback={<ComponentLoadingFallback />}>
            <MyTrips />
          </Suspense>
        );
      case "messages":
        return (
          <Suspense fallback={<ComponentLoadingFallback />}>
            <Messages />
          </Suspense>
        );
      case "payments":
        return (
          <Suspense fallback={<ComponentLoadingFallback />}>
            <Payments />
          </Suspense>
        );
      case "settings":
        return (
          <Suspense fallback={<ComponentLoadingFallback />}>
            <Settings />
          </Suspense>
        );
      case "profile":
        return (
          <Suspense fallback={<ComponentLoadingFallback />}>
            <UserProfile />
          </Suspense>
        );
      case "notifications":
        return (
          <Suspense fallback={<ComponentLoadingFallback />}>
            <NotificationCenter />
          </Suspense>
        );
      case "safety":
        return (
          <Suspense fallback={<ComponentLoadingFallback />}>
            <SafetyCenter />
          </Suspense>
        );
      case "analytics":
        return (
          <Suspense fallback={<ComponentLoadingFallback />}>
            <TripAnalytics />
          </Suspense>
        );
      case "recurring":
        return (
          <Suspense fallback={<ComponentLoadingFallback />}>
            <RecurringTrips />
          </Suspense>
        );
      case "verification":
        return (
          <Suspense fallback={<ComponentLoadingFallback />}>
            <VerificationCenter />
          </Suspense>
        );
      case "performance":
        return (
          <Suspense fallback={<ComponentLoadingFallback />}>
            <PerformanceDashboard />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<ComponentLoadingFallback />}>
            <Dashboard onNavigate={setCurrentPage} />
          </Suspense>
        );
    }
  };

  return (
    <>
      <div className="h-screen flex bg-gray-50">
        <Suspense fallback={<div className="w-64 bg-gray-100 animate-pulse" />}>
          <Sidebar
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        </Suspense>
        <div className="flex-1 flex flex-col min-w-0">
          <Suspense fallback={<div className="h-16 bg-gray-100 animate-pulse" />}>
            <Header
              onMenuClick={() => setIsSidebarOpen(true)}
              onNavigate={setCurrentPage}
            />
          </Suspense>
          <main className="flex-1 overflow-auto p-6 lg:p-8">{renderPage()}</main>
        </div>
      </div>
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary level="critical" onError={(error, errorInfo) => {
      console.error('Critical app error:', error, errorInfo);
    }}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
