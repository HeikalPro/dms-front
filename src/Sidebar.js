import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import { FiChevronLeft, FiChevronRight, FiX, FiPlus, FiLogOut } from "react-icons/fi";
import { FaAngleDoubleRight, FaAngleDoubleLeft } from "react-icons/fa";
import ConversationsSection from "./ConversationsSection";
import FilesSection from "./FilesSection";
import PromptsSection from "./PromptsSection";
import sidebarPhoto from "./assets/brand360.svg";
import { fetchFiles, fetchPrompts, addPrompt, uploadFile } from "./api";
import AddPromptModal from "./AddPromptModal";
import { useNavigate } from "react-router-dom";
import { Paperclip, PlusCircle } from "lucide-react"; // Import PlusCircle
import "./sidebar.css";
 
const Sidebar = ({
  isSidebarOpen,
  toggleSidebar,
  conversations,
  refreshConversations,
  selectedFileIds,
  setSelectedFileIds,
  selectedConversationId,
  setSelectedConversationId,
  selectedSystemMessage,
  setSelectedSystemMessage,
  setMessages,
  username,
}) => {
  const [files, setFiles] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [collapsedSections, setCollapsedSections] = useState({
    files: false,
    conversations: false,
    prompts: false,
  });
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  
 
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [filesData, promptsData] = await Promise.all([fetchFiles(), fetchPrompts()]);
      setFiles(filesData.files || []);
      setPrompts((promptsData.prompts || []).map((p) => ({ ...p, id: String(p.id) })));
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);
 
  useEffect(() => {
    loadData();
  }, [loadData]);
 
  const handleAddPrompt = async (newPrompt) => {
    try {
      await addPrompt(newPrompt);
      await loadData();
      setIsModalOpen(false);
    } catch (err) {
      alert(`Error adding prompt: ${err.message}`);
    }
  };
 
  const handleClearSearch = () => {
    setSearchTerm("");
  };
 
  const filteredConversations = useMemo(() => {
    if (!searchTerm) return conversations || [];
    const lowerSearch = searchTerm.toLowerCase();
    return (conversations || []).filter((conversation) =>
      Array.isArray(conversation.history)
        ? conversation.history.some((message) =>
            (message.content || "").toLowerCase().includes(lowerSearch)
          )
        : false
    );
  }, [conversations, searchTerm]);
 
  const filteredFiles = useMemo(() => {
    if (!searchTerm) return files;
    const lowerSearch = searchTerm.toLowerCase();
    return files.filter((file) =>
      (file.filename && file.filename.toLowerCase().includes(lowerSearch)) ||
      (file.content && file.content.toLowerCase().includes(lowerSearch))
    );
  }, [files, searchTerm]);
 
  const filteredPrompts = useMemo(() => {
    if (!searchTerm) return prompts;
    const lowerSearch = searchTerm.toLowerCase();
    return prompts.filter((prompt) =>
      prompt.content.toLowerCase().includes(lowerSearch) ||
      prompt.name.toLowerCase().includes(lowerSearch)
    );
  }, [prompts, searchTerm]);
 
  if (loading) return <div className="sidebar">Loading...</div>;
  if (error)
    return (
      <div className="sidebar error">
        {error}
        <button onClick={loadData}>Retry</button>
      </div>
    );
 
  const handleLogout = () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("jwt_token");
    navigate("/");
  };
  const handleNewChat = async () => {
    const defaultTitle = "New Conversation";
    setSelectedConversationId(null);
    setMessages([{ role: "user", content: "" }]); // Start with an empty user message
    //await createConversations({ title: defaultTitle, history: [{ role: "user", content: "" }] });
    refreshConversations();
    navigate("/app/conversations");
    console.log("New chat created with title:", defaultTitle);
  };
 
  const toggleSection = (section) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };
 
  const handleUploadClick = () => {
    if (!isUploading) fileInputRef.current.click();
  };
 
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsUploading(true);
      try {
        await uploadFile(file);
        await new Promise((resolve) => setTimeout(resolve, 10000));
        await loadData();
      } catch (error) {
        alert(`Upload error: ${error.message}`);
      }
      setIsUploading(false);
      event.target.value = "";
    }
  };
 
  return (
    <div className={`sidebar ${isSidebarOpen ? "open" : "collapsed"}`}>
      <button className="toggle-button" onClick={toggleSidebar}>
        {isSidebarOpen ? <FaAngleDoubleLeft /> : <FaAngleDoubleRight />}
      </button>
      {isSidebarOpen && (
        <>
          <div className="sidebar-photo">
            <img src={sidebarPhoto} alt="Sidebar Header" className="logo" />
          </div>
          <div className="sidebar-header">
            <div className="chat-options">
              <h2>Chat Options</h2>
              <div className="new-chat-container">
                <button className="new-chat-btn" onClick={handleNewChat}>
                  <FiPlus /> New Chat
                </button>
              </div>
              <div className="sidebar-search">
                <div className="search-input-wrapper">
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Search conversations"
                    aria-controls="sidebar-sections"
                    role="searchbox"
                  />
                  {searchTerm && (
                    <button
                      className="clear-button"
                      onClick={handleClearSearch}
                      aria-label="Clear search"
                    >
                      <FiX />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="sidebar-scrollable" id="sidebar-sections">
            <div className="sidebar-section" onClick={() => toggleSection("files")}>
              <div className="files-section-header">
                <h3>Files</h3>
                <div style={{ position: "relative" }}>
                  <Paperclip
                    size={20}
                    className={`add-icon ${isUploading ? "disabled" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUploadClick();
                    }}
                    style={{ cursor: isUploading ? "not-allowed" : "pointer" }}
                    title="Attach file"
                    aria-label="Attach file"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                  {isUploading && <span className="loading-spinner"></span>}
                </div>
              </div>
              <div className={`section-content ${collapsedSections.files ? "collapsed" : ""}`}>
                <FilesSection
                  files={filteredFiles}
                  selectedFileIds={selectedFileIds}
                  setSelectedFileIds={setSelectedFileIds}
                  refreshFiles={loadData}
                  navigate={navigate}
                />
               </div>
            </div>
            <div className="sidebar-section" onClick={() => toggleSection("conversations")}>
              <h3>Conversations</h3>
              <div className={`section-content ${collapsedSections.conversations ? "collapsed" : ""}`}>
                <ConversationsSection
                  conversations={filteredConversations}
                  selectedConversationId={selectedConversationId}
                  setSelectedConversationId={setSelectedConversationId}
                  refreshConversations={refreshConversations}
                  setMessages={setMessages}
                />
              </div>
            </div>
            <div className="sidebar-section" onClick={() => toggleSection("prompts")}>
              <div className="prompts-section-header">
                <h3>Prompts</h3>
                <PlusCircle
                  size={20}
                  className="add-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsModalOpen(true);
                  }}
                  style={{ cursor: "pointer" }}
                  title="Add new prompt"
                  aria-label="Add new prompt"
                />
              </div>
              <div className={`section-content ${collapsedSections.prompts ? "collapsed" : ""}`}>
                <PromptsSection
                  prompts={filteredPrompts}
                  selectedSystemMessage={selectedSystemMessage}
                  setSelectedSystemMessage={setSelectedSystemMessage}
                  refreshPrompts={loadData}
                  isModalOpen={isModalOpen}
                  setIsModalOpen={setIsModalOpen}
                  navigate={navigate}
                />
              </div>
            </div>
          </div>
          <div className="sidebar-footer">
            <div className="user-info">
              <div className="avatar">{username?.[0]?.toUpperCase() || "U"}</div>
              <div className="user-details">
                <div className="username">{username || "Unknown User"}</div>
                <div className="status">Active</div>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Logout">
              <FiLogOut />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
 
Sidebar.propTypes = {
  isSidebarOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
  conversations: PropTypes.array.isRequired,
  refreshConversations: PropTypes.func.isRequired,
  selectedConversationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  setSelectedConversationId: PropTypes.func.isRequired,
  selectedSystemMessage: PropTypes.string.isRequired,
  setSelectedSystemMessage: PropTypes.func.isRequired,
  setMessages: PropTypes.func.isRequired,
  selectedFileIds: PropTypes.array.isRequired,
  setSelectedFileIds: PropTypes.func.isRequired,
  username: PropTypes.string,
};
 
export default Sidebar;
 