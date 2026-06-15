import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ProjectDetails from "./pages/ProjectDetails";
import ProjectsExplore from "./pages/ProjectsExplore";
import AdminDashboard from "./pages/AdminDashboard";
import BlockedAccount from "./pages/BlockedAccount";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />

            <Route path="/projects" element={
              <ProtectedRoute><ProjectsExplore /></ProtectedRoute>
            } />

            <Route path="/project/:id" element={
              <ProtectedRoute><ProjectDetails /></ProtectedRoute>
            } />

            <Route path="/profile/:username" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />

            <Route path="/blocked" element={<BlockedAccount />} />

            <Route path="/admin/user/:userId" element={
              <ProtectedRoute role="admin"><Profile /></ProtectedRoute>
            } />

            <Route path="/admin" element={
              <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
            } />

         

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Footer />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
