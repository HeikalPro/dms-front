// src/AppContext.js
import React, { createContext, useState, useContext } from "react";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  // Add other state variables and setters here
  const value = {
    isSidebarOpen,
    toggleSidebar: () => setIsSidebarOpen((prev) => !prev),
    selectedFileIds,
    setSelectedFileIds,
    // Add other values and setters
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useAppContext = () => useContext(AppContext);