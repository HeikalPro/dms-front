// src/PromptsSection.js
 
import React, { useState, useCallback, useEffect } from "react";

import PropTypes from "prop-types";

import { deletePrompt, updatePrompt, addPrompt } from "./api";

import { PlusCircle, Edit2 } from "lucide-react";

import "./sidebar.css";

import { createPortal } from "react-dom";

import Modal from "./Modal";
 
const PromptsSection = ({

  prompts,

  selectedSystemMessage,

  setSelectedSystemMessage,

  refreshPrompts,

  isModalOpen,

  setIsModalOpen,

  navigate,

}) => {

  const [editingPromptId, setEditingPromptId] = useState(null);

  const [editedPrompt, setEditedPrompt] = useState({ name: "", content: "" });

  const [newPrompt, setNewPrompt] = useState({ name: "", content: "" });
 
  useEffect(() => {

    console.log("Modal State Changed:", isModalOpen);

  }, [isModalOpen]);
 
  const handleDelete = useCallback(

    async (e, promptId) => {

      e.stopPropagation();

      if (!window.confirm("Are you sure you want to delete this prompt?")) return;
 
      try {

        await deletePrompt(promptId);

        if (editingPromptId === promptId) {

          setIsModalOpen(false);

          setEditingPromptId(null);

        }

        refreshPrompts();

      } catch (error) {

        console.error("Error deleting prompt:", error);

        alert("Failed to delete prompt. Please try again.");

      }

    },

    [refreshPrompts, editingPromptId, setIsModalOpen]

  );
 
  const handleEdit = (e, prompt) => {

    e.stopPropagation();

    setEditingPromptId(prompt.id);

    setEditedPrompt({ name: prompt.name, content: prompt.content });

    setIsModalOpen(true);

  };
 
  const handleEditChange = (e) => {

    const { name, value } = e.target;

    setEditedPrompt((prev) => ({ ...prev, [name]: value }));

  };
 
  const handleEditSave = async () => {

    if (!editedPrompt.name.trim() || !editedPrompt.content.trim()) {

      alert("Both fields are required.");

      return;

    }

    try {

      await updatePrompt(editingPromptId, editedPrompt);

      refreshPrompts();

      setIsModalOpen(false);

    } catch (error) {

      console.error("Error updating prompt:", error);

      alert("Failed to update prompt. Please try again.");

    }

  };
 
  const handleNewPromptChange = (e) => {

    const { name, value } = e.target;

    setNewPrompt((prev) => ({ ...prev, [name]: value }));

  };
 
  const handleNewPromptSave = async () => {

    if (!newPrompt.name.trim() || !newPrompt.content.trim()) {

      alert("Both fields are required.");

      return;

    }

    try {

      await addPrompt(newPrompt);

      refreshPrompts();

      setIsModalOpen(false);

      setNewPrompt({ name: "", content: "" });

    } catch (error) {

      console.error("Error adding new prompt:", error);

      alert("Failed to add new prompt. Please try again.");

    }

  };
 
  const renderModal = () => {

    if (!isModalOpen) return null;
 
    return createPortal(

      editingPromptId ? (
<Modal

          isOpen={isModalOpen}

          title="Edit Prompt"

          onClose={() => {

            setIsModalOpen(false);

            setEditingPromptId(null);

          }}

          onConfirm={handleEditSave}

          confirmText="✔ Save"

          cancelText="✖ Cancel"
>
<input

            type="text"

            name="name"

            className="edit-input"

            value={editedPrompt.name}

            onChange={handleEditChange}

            placeholder="Edit prompt name..."

            autoFocus

          />
<textarea

            name="content"

            className="edit-textarea"

            value={editedPrompt.content}

            onChange={handleEditChange}

            placeholder="Edit prompt content..."

          />
</Modal>

      ) : (
<Modal

          isOpen={isModalOpen}

          title="Add Prompt"

          onClose={() => {

            setIsModalOpen(false);

            setNewPrompt({ name: "", content: "" });

          }}

          onConfirm={handleNewPromptSave}

          confirmText="✔ Add"

          cancelText="✖ Cancel"
>
<input

            type="text"

            name="name"

            className="edit-input"

            value={newPrompt.name}

            onChange={handleNewPromptChange}

            placeholder="Enter prompt name..."

            autoFocus

          />
<textarea

            name="content"

            className="edit-textarea"

            value={newPrompt.content}

            onChange={handleNewPromptChange}

            placeholder="Enter prompt content..."

          />
</Modal>

      ),

      document.body

    );

  };
 
  return (
<>

      {prompts.length === 0 ? (
<p className="no-prompts">No prompts available.</p>

      ) : (
<ul className="section-list">

          {prompts.map((prompt) => (
<li

              key={prompt.id}

              className={`item prompt-item ${

                selectedSystemMessage === prompt.content ? "selected" : ""

              }`}

              onClick={(e) => {

                e.stopPropagation();

                setSelectedSystemMessage(

                  selectedSystemMessage === prompt.content ? null : prompt.content

                );

              }}
>
<span className="item-content">{prompt.name}</span>
<div className="item-actions">
<button

                  className="edit-button"

                  onClick={(e) => handleEdit(e, prompt)}

                  aria-label={`Edit prompt: ${prompt.name}`}
>
<Edit2 size={16} />
</button>
<button

                  className="delete-button"

                  onClick={(e) => handleDelete(e, prompt.id)}

                  aria-label={`Delete prompt: ${prompt.name}`}
>

                  ✕
</button>
</div>
</li>

          ))}
</ul>

      )}

      {renderModal()}
</>

  );

};
 
PromptsSection.propTypes = {

  prompts: PropTypes.arrayOf(

    PropTypes.shape({

      id: PropTypes.string.isRequired,

      name: PropTypes.string.isRequired,

      content: PropTypes.string.isRequired,

    })

  ).isRequired,

  selectedSystemMessage: PropTypes.string.isRequired,

  setSelectedSystemMessage: PropTypes.func.isRequired,

  refreshPrompts: PropTypes.func.isRequired,

  isModalOpen: PropTypes.bool.isRequired,

  setIsModalOpen: PropTypes.func.isRequired,

  navigate: PropTypes.func.isRequired,

};
 
export default PromptsSection;
 