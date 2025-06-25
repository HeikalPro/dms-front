import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';

// Updated to use the Modal component for consistent styling and behavior
const AddPromptModal = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');

  const handleSave = () => {
    if (!name.trim() || !content.trim()) {
      alert('Both name and content are required.');
      return;
    }
    onSave({ name, content });
    setName('');
    setContent('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      title="Add New Prompt"
      onClose={onClose}
      onConfirm={handleSave}
      confirmText="Save"
      cancelText="Cancel"
    >
      <input
        type="text"
        placeholder="Prompt Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="edit-input"
      />
      <textarea
        placeholder="Prompt Content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="edit-textarea"
      />
    </Modal>
  );
};

AddPromptModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default AddPromptModal;