import React from "react";
import "./Modal.css"; // Ensure consistent styling for all modals

const Modal = ({ isOpen, title, children, onClose, onConfirm, confirmText = "Save", cancelText = "Cancel", showConfirm = true }) => {
  if (!isOpen) return null; // Don't render if modal is closed

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{title}</h2>
        <div className="modal-body">{children}</div>
        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>{cancelText}</button>
          {showConfirm && <button className="confirm-btn" onClick={onConfirm}>{confirmText}</button>}
        </div>
      </div>
    </div>
  );
};

export default Modal;
