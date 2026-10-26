import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "../globals.css";
import { AuthProvider, useAuth } from "./lib/auth.jsx";
import { Shell } from "./components/Shell.jsx";
import { Spinner } from "./components/ui.jsx";
import { Landing } from "./pages/Landing.jsx";
import { Home } from "./pages/Home.jsx";
import { Forgot, Join, Login, Reset } from "./pages/Auth.jsx";
import { Onboarding } from "./pages/Onboarding.jsx";
import { NotFoundPage, ProfilePage } from "./pages/Profile.jsx";
import { EditProfile } from "./pages/EditProfile.jsx";
import { Explore } from "./pages/Explore.jsx";
import { Admin, Family, Privacy, Safety, Settings, Studio } from "./pages/Account.jsx";

// Signed in but not onboarded → /welcome. Signed out → /login.
function RequireProfile({ children, role, admin }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile) return <Navigate to="/welcome" replace />;
  if (role && profile.role !== role && !profile.is_admin) return <Navigate to="/" replace />;
  if (admin && !profile.is_admin) return <Navigate to="/" replace />;
  return children;
}

function Index() {
  const { user, profile, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user && !profile) return <Navigate to="/welcome" replace />;
  return profile ? <Home /> : <Landing />;
}

function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Index />} />
        <Route path="join" element={<Join />} />
        <Route path="login" element={<Login />} />
        <Route path="forgot" element={<Forgot />} />
        <Route path="reset" element={<Reset />} />
        <Route path="welcome" element={<Onboarding />} />
        <Route path="explore" element={<Explore />} />
        <Route path="safety" element={<Safety />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="me/edit" element={<RequireProfile><EditProfile /></RequireProfile>} />
        <Route path="edit/:id" element={<RequireProfile><EditProfile /></RequireProfile>} />
        <Route path="family" element={<RequireProfile role="guardian"><Family /></RequireProfile>} />
        <Route path="studio" element={<RequireProfile role="director"><Studio /></RequireProfile>} />
        <Route path="settings" element={<RequireProfile><Settings /></RequireProfile>} />
        <Route path="admin" element={<RequireProfile admin><Admin /></RequireProfile>} />
        <Route path=":slug" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
