// src/FilesSection.js
 
import React from "react";

import PropTypes from "prop-types";

import { deleteFile } from "./api";

import { Paperclip } from "lucide-react";

import "./sidebar.css";
 
const FilesSection = ({ files, selectedFileIds, setSelectedFileIds, refreshFiles, navigate }) => {

  const handleDelete = async (e, fileId) => {

    e.stopPropagation(); // Prevent item selection click

    if (window.confirm("Delete this file?")) {

      try {

        await deleteFile(fileId);

        console.log("File deleted successfully");

        refreshFiles();

      } catch (error) {

        console.error("Error deleting file:", error);

        alert(`Delete error: ${error.message}`);

      }

    }

  };
 
  const handleFileClick = (fileId, e) => {

    e.stopPropagation(); // Prevent collapse toggle

    if (selectedFileIds.includes(fileId)) {

      setSelectedFileIds(selectedFileIds.filter((id) => id !== fileId));

    } else {

      if (selectedFileIds.length < 5) {

        setSelectedFileIds([...selectedFileIds, fileId]);

      } else {

        alert("You can only select up to 5 files.");

      }

    }

  };
 
  return (
<ul className="section-list">

      {files.map((file) => (
<li

          key={file.file_id}

          className={`item file-item ${selectedFileIds.includes(file.file_id) ? "selected" : ""}`}

          onClick={(e) => handleFileClick(file.file_id, e)}
>
<div className="item-content">
<span>{file.filename}</span>

            {file.upload_type && (
<span className="upload-type" >

                {/* [{" "}{file.upload_type}] */}
</span>

            )}

            {file.source && file.upload_type === "youtube" && (
<a

                href={file.source}

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

              onClick={(e) => handleDelete(e, file.file_id)}

              aria-label={`Delete file: ${file.filename}`}
>

              ✕
</button>
</div>
</li>

      ))}
</ul>

  );

};
 
FilesSection.propTypes = {

  files: PropTypes.array.isRequired,

  selectedFileIds: PropTypes.array,

  setSelectedFileIds: PropTypes.func.isRequired,

  refreshFiles: PropTypes.func.isRequired,

  navigate: PropTypes.func.isRequired,

};
 
FilesSection.defaultProps = {

  selectedFileIds: [],

};
 
export default FilesSection;
 