import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import ChecklistPage from "@/pages/ChecklistPage";
import ReworkPage from "@/pages/ReworkPage";
import RecordsPage from "@/pages/RecordsPage";
import { useEffect } from "react";

function AppContent() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  return (
    <div className="min-h-full bg-site-bg">
      <main className="mx-auto max-w-2xl">
        <Routes>
          <Route path="/" element={<Navigate to="/checklist" replace />} />
          <Route path="/checklist" element={<ChecklistPage />} />
          <Route path="/rework" element={<ReworkPage />} />
          <Route path="/records" element={<RecordsPage />} />
          <Route path="*" element={<Navigate to="/checklist" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
