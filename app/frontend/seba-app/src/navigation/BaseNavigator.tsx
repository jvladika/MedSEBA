import React from "react";
import { Routes, Route, Navigate, Router, useLocation } from "react-router-dom";
import { ResultPage, Landing, Faq } from "../ui/pages";
import { AppRoutes } from "./constants/Routes";
import { SideBar } from "../ui/components/sideBar/SideBar";
import { Box } from "@mui/material";
import Navbar from "../ui/components/navbar/navbar";
import Login from "../ui/pages/auth/Login";
import Register from "../ui/pages/auth/Register";
import NotFound from "../ui/pages/auth/NotFound";
import ProfilePage from "../ui/pages/profile/ProfilePage";
import ProtectedRoute from "../ui/components/ProtectedRoute";
import Home from "../ui/pages/Home";
import DocumentPage from "../ui/pages/document/DocumentPage";
import { useAuth } from "../context/AuthContext";

function Logout() {
  localStorage.clear();
  return <Navigate to="/login" />;
}

function RegisterAndLogout() {
  localStorage.clear();
  return <Register />;
}

//BaseNavigator that contains the roots to the main pages of the app
export const BaseNavigator = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === AppRoutes.landing;
  const { sidebarOpen } = useAuth();

  return (
    <>
      <SideBar />
      <Navbar />
      <Box display="flex"
        sx={{
          paddingLeft: sidebarOpen ? "280px" : "60px",
          transition: theme => theme.transitions.create('padding', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Box flexGrow={1}>
          <Routes>
            <Route path={AppRoutes.landing} element={<Landing />} />
            <Route path={AppRoutes.faq} element={<Faq />} />
            <Route
              path={`${AppRoutes.results}/:id?`}
              element={<ResultPage />}
            />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            <Route path="/login" element={<Login />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/register" element={<RegisterAndLogout />} />
            <Route path="/documents/:pmid" element={<DocumentPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Box>
      </Box>
    </>
  );
};
