import React, { useState } from "react";
import PropTypes from "prop-types";
import "./YouTubeModal.css"; // Ensure this file contains your modal styles

const YouTubeModal = ({ isOpen, onClose, onUpload }) => {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;
    setIsUploading(true);
    setError(null);
    try {
      // Wait for the onUpload promise to resolve
      await onUpload(youtubeUrl.trim());
      setYoutubeUrl("");
      onClose();
    } catch (err) {
      setError("Upload failed. Please try again.");
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null; // Don't render if modal is not open

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Add YouTube Video</h2>
        <form onSubmit={handleSubmit} className="youtube-upload-form">
          <label htmlFor="youtube-url">YouTube URL:</label>
          <input
            id="youtube-url"
            type="text"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            disabled={isUploading}
          />
          {error && <div className="error-message">{error}</div>}
          {isUploading ? (
            <div className="uploading-message">Uploading... Please wait.</div>
          ) : (
            <div className="modal-actions">
              <button type="submit" className="btn btn-primary">
                Upload
              </button>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

YouTubeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
};

export default YouTubeModal;
