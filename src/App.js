import React, { useState, Suspense, lazy, useEffect } from "react";
import "./App.css";
import "./style.css";
import { fetchConversations } from "./api";
import { apiUrl } from "./api"; // Import apiUrl
import PreviewSidebar from "./PreviewSidebar";

// Lazy-load main panels
const Sidebar = lazy(() => import("./Sidebar"));
const ChatWindow = lazy(() => import("./ChatWindow"));

// Loading component for better UX
const LoadingSpinner = ({ message = "Loading..." }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#6c757d',
    fontSize: '14px',
    gap: '12px'
  }}>
    <div style={{
      width: '32px',
      height: '32px',
      border: '3px solid #f3f3f3',
      borderTop: '3px solid #007bff',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
    <span>{message}</span>
    <style jsx>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  const [selectedVideoIds, setSelectedVideoIds] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [selectedSystemMessage, setSelectedSystemMessage] = useState("General Assistant");
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]); // Added
  const [searchTerm, setSearchTerm] = useState("");
  const [username, setUsername] = useState(""); // Added
  const [previewPages, setPreviewPages] = useState([]);
  const [previewFilename, setPreviewFilename] = useState("");
  const [files, setFiles] = useState([]); // Added
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);


  // Enhanced conversation fetching with error handling
  const refreshConversations = async () => {
    try {
      const conversationsData = await fetchConversations();
      setConversations(conversationsData);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
      setError("Failed to load conversations");
    }
  };

  // Fetch conversations on load
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        await refreshConversations();
      } catch (err) {
        console.error("Failed to load initial data:", err);
        setError("Failed to load application data");
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Fetch user info with enhanced error handling
  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = localStorage.getItem("jwt_token");
      const userID = localStorage.getItem("user_id");

      if (!token || !userID) {
        setUsername("Guest User");
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/users/${userID}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUsername(data.username || "Unknown User");
        } else {
          console.warn("Failed to fetch user info:", res.status);
          setUsername("Unknown User");
        }
      } catch (err) {
        console.error("User info fetch failed:", err);
        setUsername("Unknown User");
      }
    };

    fetchUserInfo();
  }, []);

  // Fetch user-uploaded files with enhanced error handling
  useEffect(() => {
    const fetchUserFiles = async () => {
      const userID = localStorage.getItem("user_id");
      if (!userID) return;

      try {
        const res = await fetch(`${apiUrl}/files/user/${userID}`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (res.ok) {
          const data = await res.json();
          setFiles(data.files || []);
        } else {
          console.warn("Failed to fetch files:", res.status);
        }
      } catch (err) {
        console.error("Failed to fetch files:", err);
      }
    };

    fetchUserFiles();
  }, []);

  // Load preview when selected file changes
  useEffect(() => {
    const fileId = selectedFileIds[0];
    if (!fileId) {
      setPreviewPages([]);
      setPreviewFilename("");
      return;
    }

    const fetchPreview = async () => {
      try {
        const res = await fetch(`${apiUrl}/files/preview/${fileId}`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (res.ok) {
          const data = await res.json();
          setPreviewPages(data.pages || []);
          setPreviewFilename(
            data.pages?.[0]?.citation?.split("Source: ")[1]?.split(",")[0] || ""
          );
        } else {
          console.warn("Failed to fetch preview:", res.status);
          setPreviewPages([]);
          setPreviewFilename("");
        }
      } catch (err) {
        console.error("Preview fetch failed:", err);
        setPreviewPages([]);
        setPreviewFilename("");
      }
    };

    fetchPreview();
  }, [selectedFileIds]);

  // Handle citation clicks
  const handleCitationClick = (citation) => {
    setSelectedCitation(citation);
  };

  // Clear error after some time
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Error display component
  const ErrorBanner = ({ message, onDismiss }) => (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: '#f8d7da',
      color: '#721c24',
      padding: '12px 16px',
      borderRadius: '8px',
      border: '1px solid #f5c6cb',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      maxWidth: '400px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <span>⚠️ {message}</span>
      <button
        onClick={onDismiss}
        style={{
          background: 'none',
          border: 'none',
          color: '#721c24',
          cursor: 'pointer',
          fontSize: '16px',
          padding: '0 4px'
        }}
        title="Dismiss"
      >
        ×
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="app-container">
        <LoadingSpinner message="Loading AI-Buddy..." />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Error Banner */}
      {error && (
        <ErrorBanner
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      <div className="main-content" style={{ display: "flex", height: "100vh" }}>
        {/* Sidebar */}
        <div className={`sidebar-wrapper ${isSidebarOpen ? "open" : "collapsed"}`}>
          <Suspense fallback={<LoadingSpinner message="Loading sidebar..." />}>
            <Sidebar
              conversations={conversations}
              refreshConversations={refreshConversations}
              selectedFileIds={selectedFileIds}
              setSelectedFileIds={setSelectedFileIds}
              selectedVideoIds={selectedVideoIds}
              setSelectedVideoIds={setSelectedVideoIds}
              selectedConversationId={selectedConversationId}
              setSelectedConversationId={setSelectedConversationId}
              selectedSystemMessage={selectedSystemMessage}
              setSelectedSystemMessage={setSelectedSystemMessage}
              setMessages={setMessages}
              isSidebarOpen={isSidebarOpen}
              
              toggleSidebar={toggleSidebar}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              username={username}
            />
          </Suspense>
        </div>

        {/* Center + Right Panels */}
        <div style={{ display: "flex", flex: 1 }}>
          {/* Chat */}
          <div className="chat-container" style={{ flex: 1 }}>
            <Suspense fallback={<LoadingSpinner message="Loading chat..." />}>
              <ChatWindow
                selectedFileIds={selectedFileIds}
                selectedVideoIds={selectedVideoIds}
                conversationId={selectedConversationId}
                selectedSystemMessage={selectedSystemMessage}
                setSelectedConversationId={setSelectedConversationId}
                refreshConversations={refreshConversations}
                messages={messages}
                setMessages={setMessages}
                setSelectedCitation={handleCitationClick}
              />
            </Suspense>
          </div>

          {/* Preview Sidebar */}
          {selectedFileIds[0] && (
            <Suspense fallback={<LoadingSpinner message="Loading preview..." />}>
              <PreviewSidebar
                fileId={selectedFileIds[0]}
                filename={previewFilename}
                previewPages={previewPages}
                fileMeta={files.find((f) => f.file_id === selectedFileIds[0])}
                files={files}
                selectedCitation={selectedCitation}
                onFileSelect={(fileId) => setSelectedFileIds([fileId])}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;