import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { renderAsync } from "docx-preview";
import { FaAngleDoubleLeft, FaAngleDoubleRight } from "react-icons/fa"; // Matching left sidebar icons
import "./sidebar.css";
import { Radius } from "lucide-react";

const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5005";

const DocxViewer = ({ docUrl }) => {
  const containerRef = React.useRef(null);
  const styleRef = React.useRef(document.createElement("div"));

  useEffect(() => {
    const loadDoc = async () => {
      const res = await fetch(docUrl);
      const buffer = await res.arrayBuffer();

      // Clear previous render content if any
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }

      await renderAsync(buffer, containerRef.current);
    };
    loadDoc();
  }, [docUrl]);

  return (
    <div
      ref={containerRef}
      style={{
        border: "1px solid #ccc",
        padding: "1rem",
        height: "100%", // Use 100% to fill available space
        overflowY: "auto",
        fontSize: "14px",
        lineHeight: 1.6,
      }}
    >
      <p>Loading DOCX preview...</p>
    </div>
  );
};

const PreviewSidebar = ({ fileId, filename, previewPages, fileMeta, files }) => {
  const [localFileId, setLocalFileId] = useState(fileId);
  const [showText, setShowText] = useState(false);
  const [isOpen, setIsOpen] = useState(true); // State to toggle visibility

  useEffect(() => {
    setLocalFileId(fileId);
  }, [fileId]);

  const selectedFile = files.find((f) => f.file_id === localFileId);
  if (!selectedFile) return null;

  const isPdf = selectedFile.filename.toLowerCase().endsWith(".pdf");
  const isDocx = selectedFile.filename.toLowerCase().endsWith(".docx");
  const iframeUrl = `${apiUrl}/files/preview/${selectedFile.file_id}`;
  const pageCount = previewPages?.length || 0;

  return (
    <div className={`preview-sidebar ${isOpen ? "open" : "collapsed"}`}>
      <button
        className="toggle-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Collapse preview" : "Expand preview"}
      >
        {isOpen ? <FaAngleDoubleLeft /> : <FaAngleDoubleRight />}
      </button>
      {isOpen && (
        <>
          <div className="file-info">
            <div className="file-preview">
            <h3>📝 File Preview</h3>
            </div>
            {files.length > 1 && (
              <>
                <label style={{ fontSize: "13px", fontWeight: "bold" }}>
                  Preview another file
                </label>
                <select
                  value={localFileId}
                  onChange={(e) => setLocalFileId(e.target.value)}
                  style={{ width: "100%", marginBottom: "0.5rem", padding: "12px", borderRadius: "15px" }}
                >
                  {files.map((file) => (
                    <option key={file.file_id} value={file.file_id}>
                      {file.filename}
                    </option>
                  ))}
                </select>
              </>
            )}
            <p>
              <strong>File:</strong> {selectedFile.filename}
            </p>
            

            
          </div>

          <div className="preview-content">
            {isPdf && !showText ? (
              <iframe
                src={iframeUrl}
                width="100%"
                height="100%" // Use 100% to fill available space
                title="PDF Preview"
                style={{ border: "1px solid #ccc", borderRadius: "8px" }}
              ></iframe>
            ) : isDocx && !showText ? (
              <DocxViewer docUrl={iframeUrl} />
            ) : previewPages.length === 0 ? (
              <p className="preview-placeholder">Loading text preview...</p>
            ) : (
              previewPages.map((page) => (
                <div key={page.page_number} className="preview-page">
                  <strong>Page {page.page_number}</strong>
                  <p style={{ whiteSpace: "pre-wrap" }}>{page.content}</p>
                  <small>{page.citation}</small>
                  <hr />
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

PreviewSidebar.propTypes = {
  fileId: PropTypes.string.isRequired,
  filename: PropTypes.string.isRequired,
  previewPages: PropTypes.arrayOf(
    PropTypes.shape({
      page_number: PropTypes.number,
      content: PropTypes.string,
      citation: PropTypes.string,
    })
  ).isRequired,
  fileMeta: PropTypes.object,
  files: PropTypes.arrayOf(
    PropTypes.shape({
      file_id: PropTypes.string.isRequired,
      filename: PropTypes.string.isRequired,
      upload_type: PropTypes.string,
    })
  ).isRequired,
};

PreviewSidebar.defaultProps = {
  previewPages: [],
  fileMeta: null,
};

export default PreviewSidebar;