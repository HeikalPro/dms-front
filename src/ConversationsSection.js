// src/ConversationsSection.js
 
import React, { useState, useEffect } from "react";

import PropTypes from "prop-types";

import { deleteConversation } from "./api";

import "./sidebar.css";
 
const ConversationItem = ({

  conv,

  isSelected,

  onSelect,

  onDelete,

  isDeleting,

}) => {

  // Extract the first user message as the title, fallback to "Untitled" if none

  const title = conv.history?.find((msg) => msg.role === "user")?.content || "Untitled";

  const formattedDate = new Date(conv.created_at).toLocaleDateString("en-US", {

    year: "numeric",

    month: "short",

    day: "numeric",

  });
 
  return (
<li

      className={`item conversation-item ${isSelected ? "selected" : ""}`}

      onClick={(e) => {

        e.stopPropagation();

        onSelect(isSelected ? null : conv.conversation_id);

      }}
>
<span className="item-content">

        {title.length > 50 ? `${title.slice(0, 50)}...` : title} {/* Truncate if too long */}
<span className="conversation-date">{formattedDate}</span>
</span>
<div className="item-actions">
<button

          className="delete-button"

          onClick={(e) => onDelete(e, conv.conversation_id)}

          disabled={isDeleting}

          title="Delete conversation"

          aria-label="Delete conversation"
>

          {isDeleting ? "..." : "✕"}
</button>
</div>
</li>

  );

};
 
ConversationItem.propTypes = {

  conv: PropTypes.shape({

    conversation_id: PropTypes.string.isRequired,

    created_at: PropTypes.string.isRequired,

    history: PropTypes.arrayOf(

      PropTypes.shape({

        role: PropTypes.string,

        content: PropTypes.string,

      })

    ),

  }).isRequired,

  isSelected: PropTypes.bool.isRequired,

  onSelect: PropTypes.func.isRequired,

  onDelete: PropTypes.func.isRequired,

  isDeleting: PropTypes.bool.isRequired,

};
 
const ConversationsSection = ({

  conversations,

  selectedConversationId,

  setSelectedConversationId,

  refreshConversations,

  setMessages,

}) => {

  const [deletingId, setDeletingId] = useState(null);
 
  useEffect(() => {

    console.log("Raw conversation details:", conversations);

  }, [conversations]);
 
  const handleDelete = async (e, conversationId) => {

    e.stopPropagation();

    if (!window.confirm("Are you sure you want to delete this conversation?")) return;

    setDeletingId(conversationId);

    try {

      await deleteConversation(conversationId);

      if (selectedConversationId === conversationId) {

        setSelectedConversationId(null);

        setMessages([]); // Clear chat if the active conversation is deleted

      }

      refreshConversations();

    } catch (error) {

      alert("Failed to delete the conversation. Please try again.");

      console.error("Deletion error:", error);

    } finally {

      setDeletingId(null);

    }

  };
 
  return (
<ul className="section-list">

      {conversations.map((conv) => (
<ConversationItem

          key={conv.conversation_id}

          conv={conv}

          isSelected={selectedConversationId === conv.conversation_id}

          onSelect={setSelectedConversationId}

          onDelete={handleDelete}

          isDeleting={deletingId === conv.conversation_id}

        />

      ))}
</ul>

  );

};
 
ConversationsSection.propTypes = {

  conversations: PropTypes.arrayOf(

    PropTypes.shape({

      conversation_id: PropTypes.string.isRequired,

      created_at: PropTypes.string.isRequired,

      history: PropTypes.arrayOf(

        PropTypes.shape({

          role: PropTypes.string,

          content: PropTypes.string,

        })

      ),

    })

  ).isRequired,

  selectedConversationId: PropTypes.string,

  setSelectedConversationId: PropTypes.func.isRequired,

  refreshConversations: PropTypes.func.isRequired,

  setMessages: PropTypes.func.isRequired,

};
 
export default ConversationsSection;
 