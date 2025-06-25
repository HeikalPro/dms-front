import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { fetchYoutubeRecords, uploadYoutubeAudio, deleteVideo } from "./api";
import { VideoIcon, Youtube } from "lucide-react";
import YouTubeModal from "./YouTubeModal";
import "./sidebar.css";

const YoutubeSections = ({ selectedVideoIds, setSelectedVideoIds }) => {
  const [youtubeRecords, setYoutubeRecords] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true); // Track loading state for fetching

  // Load YouTube records
  const loadYoutubeRecords = async () => {
    setIsFetching(true);
    try {
      const records = await fetchYoutubeRecords();
      setYoutubeRecords(records);
    } catch (error) {
      console.error("Error fetching YouTube records:", error);
    }
    setIsFetching(false);
  };

  useEffect(() => {
    loadYoutubeRecords();
  }, []);

  // Upload a YouTube video
  const handleUploadYoutube = async (youtubeUrl) => {
    setLoading(true);
    try {
      await uploadYoutubeAudio(youtubeUrl);
      setIsModalOpen(false);
      await loadYoutubeRecords();
    } catch (error) {
      console.error("Error uploading YouTube audio:", error);
    } finally {
      setLoading(false);
    }
  };

  // Delete a YouTube record
  const handleDelete = async (e, fileId) => {
    e.stopPropagation();
    if (window.confirm("Delete this YouTube record?")) {
      try {
        await deleteVideo(fileId);
        await loadYoutubeRecords();
      } catch (error) {
        console.error("Error deleting YouTube record:", error);
      }
    }
  };

  // Select/deselect a video
  const handleVideoSelect = (videoId) => {
    setSelectedVideoIds((prevIds) => {
      let newIds;
      if (prevIds.includes(videoId)) {
        newIds = prevIds.filter((id) => id !== videoId);
      } else if (prevIds.length < 5) {
        newIds = [...prevIds, videoId];
      } else {
        alert("You can only select up to 5 videos.");
        newIds = prevIds;
      }
      console.log("Selected Video IDs updated:", newIds);
      return newIds;
    });
  };

  return (
    <div className="sidebar-section">
      <div className="files-section-header">
        <h3>
          <VideoIcon size={20} style={{ marginRight: "5px" }} />
          YouTube
        </h3>

        <button
          className="icon-button"
          onClick={() => setIsModalOpen(true)}
          disabled={loading}
          title="Add YouTube"
          style={{ position: "relative" }}
        >
          <Youtube size={18} style={{ color: "red" }} />
          {loading && <span className="loading-spinner"></span>}
        </button>
      </div>

      <ul className="section-list">
        {isFetching ? (
          <li className="loading-message">Loading YouTube videos...</li>
        ) : youtubeRecords.length === 0 ? (
          <li className="no-files-message">No YouTube records found.</li>
        ) : (
          youtubeRecords.map((record) => (
            <li
              key={record.file_id}
              className={`item file-item ${
                selectedVideoIds.includes(record.file_id) ? "selected" : ""
              }`}
              onClick={() => handleVideoSelect(record.file_id)}
            >
              <div className="item-content">
                <span>{record.video_title}</span>
                {record.source && (
                  <a
                    href={record.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-link"
                    title="View on YouTube"
                  >
                    (View)
                  </a>
                )}
              </div>
              <div className="item-actions">
                <button
                  className="delete-button"
                  onClick={(e) => handleDelete(e, record.file_id)}
                  aria-label={`Delete YouTube record: ${record.video_title}`}
                >
                  ✕
                </button>
              </div>
            </li>
          ))
        )}
      </ul>

      {/* YouTube Modal for uploading */}
      <YouTubeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpload={handleUploadYoutube}
      />
    </div>
  );
};

YoutubeSections.propTypes = {
  selectedVideoIds: PropTypes.array.isRequired,
  setSelectedVideoIds: PropTypes.func.isRequired,
};

export default YoutubeSections;
