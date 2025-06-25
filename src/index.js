import React from "react";
import ReactDOM from "react-dom/client";
import "./style.css"; // Import your global style
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";

import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import App from "./App";
import ProtectedRoute from "./ProtectedRoute";

const AppLayout = () => (
  <App>
    <Outlet /> {/* Render sub-routes here */}
  </App>
);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected route for the main app with sub-routes */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="files" element={<div>Files Section Content</div>} />
        <Route path="conversations" element={<div>Conversations Section Content</div>} />
        <Route path="prompts" element={<div>Prompts Section Content</div>} />
        <Route index element={<div>Home Content</div>} /> {/* Default content for /app */}
      </Route>
    </Routes>
  </BrowserRouter>
);