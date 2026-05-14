import BoardDetail from "./pages/BoardDetail";
import BoardList from "./pages/BoardList";
import Login from "./pages/Login";
import Register from "./pages/Register";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import CardDetails from "./pages/CardDetails";
import AppLayout from "./layouts/AppLayout";
import Landing from "./pages/Landing";
import UserActivityLogs from "./pages/userActivityLogs";
import Settings from "./pages/Settings";
import VerifyEmail from "./pages/VerifyEmail";
import ProtectedRoute from "./components/ProtectedRoute";
import EmailVerified from "./pages/EmailVerified";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/email-verified" element={<EmailVerified />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/boards" element={<BoardList />} />
              <Route path="/boards/:boardId" element={<BoardDetail />} />
              <Route path="/cards/:cardId" element={<CardDetails />} />

              <Route path="/activity" element={<UserActivityLogs />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
