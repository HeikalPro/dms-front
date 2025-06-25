// src/api.js
/* eslint-disable no-console */

// Base URL for the FastAPI backend – falls back to localhost when the env var
// is not present (useful for local development).
const apiUrl = "http://localhost:5005";
const user_id = localStorage.getItem("user_id");

/* -------------------------------------------------------------------------- */
/*                               File handling                                */
/* -------------------------------------------------------------------------- */

export const fetchFiles = async () => {
  try {
    const res = await fetch(`${apiUrl}/files/user/${user_id}`);
    if (!res.ok) throw new Error("Failed to fetch files");
    return await res.json();
  } catch (err) {
    console.error("Error fetching files:", err);
    return { files: [] };
  }
};

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${apiUrl}/files/upload?user_id=${user_id}`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const detail = await res.json();
      throw new Error(`Upload failed: ${detail.detail || res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Error uploading file:", err);
    throw err;
  }
};

export const deleteFile = async (fileId) => {
  const res = await fetch(`${apiUrl}/files/delete/${fileId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete file with ID: ${fileId}`);
  return res.json();
};

/* -------------------------------------------------------------------------- */
/*                            Conversation helpers                            */
/* -------------------------------------------------------------------------- */

export const fetchConversations = async () => {
  try {
    const res = await fetch(`${apiUrl}/conversations/user/${user_id}`);
    if (!res.ok) throw new Error("Failed to fetch conversations");
    const data = await res.json();
    return data.conversations || [];
  } catch (err) {
    console.error("Error fetching conversations:", err);
    return [];
  }
};

export const fetchConversationById = async (conversationId) => {
  try {
    const res = await fetch(`${apiUrl}/conversations/${conversationId}?user_id=${user_id}`);
    if (!res.ok) {
      throw new Error(`Error fetching conversation: ${res.status} ${res.statusText}`);
    }

    const cType = res.headers.get("content-type");
    if (!cType?.includes("application/json")) {
      throw new Error("Invalid JSON response from API");
    }

    return await res.json();
  } catch (err) {
    console.error("Fetch error:", err.message);
    return null;
  }
};

export const deleteConversation = async (conversationId) => {
  try {
    const res = await fetch(`${apiUrl}/conversations/${conversationId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Error deleting conversation");
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const resetConversation = async () => {
  try {
    const res = await fetch(`${apiUrl}/reset`, { method: "GET" });
    if (!res.ok) throw new Error("Failed to reset conversation");
    return await res.json();
  } catch (err) {
    console.error("Error resetting conversation:", err);
    return null;
  }
};

/* -------------------------------------------------------------------------- */
/*                                 Prompts                                    */
/* -------------------------------------------------------------------------- */

export const fetchPrompts = async () => {
  try {
    const res = await fetch(`${apiUrl}/prompts/user/${user_id}`);
    return await res.json();
  } catch (err) {
    console.error("Error fetching prompts:", err);
    return [];
  }
};

export const addPrompt = async (prompt) => {
  try {
    const res = await fetch(`${apiUrl}/prompts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...prompt,
        user_id: user_id,  
      }),
    });

    if (!res.ok) {
      const detail = await res.json();
      throw new Error(detail.detail || "Failed to add prompt");
    }

    return await res.json();
  } catch (err) {
    console.error("Error adding prompt:", err);
    throw err;
  }
};

export const updatePrompt = async (promptId, updatedData) => {
  try {
    const res = await fetch(`${apiUrl}/prompts/${promptId}?user_id=${user_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    });

    if (!res.ok) throw new Error(`Error updating prompt: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to update prompt:", err);
    throw err;
  }
};

export const deletePrompt = async (promptId) => {
  try {
    const res = await fetch(`${apiUrl}/prompts/${promptId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Error deleting prompt");
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
};

/* -------------------------------------------------------------------------- */
/*                             YouTube endpoints                              */
/* -------------------------------------------------------------------------- */

export const uploadYoutubeAudio = async (youtubeUrl) => {
  try {
    const res = await fetch(`${apiUrl}/youtube/upload_youtube_audio`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: youtubeUrl, user_id: user_id }),
    });

    if (!res.ok) {
      const detail = await res.json();
      throw new Error(`Upload failed: ${detail.detail || res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Error uploading YouTube audio:", err);
    throw err;
  }
};

export const fetchYoutubeRecords = async () => {
  try {
    const res = await fetch(`${apiUrl}/youtube/user/${user_id}`);
    if (!res.ok) throw new Error("Failed to fetch YouTube records");
    const data = await res.json();
    return data.youtube || [];
  } catch (err) {
    console.error("Error fetching YouTube records:", err);
    return [];
  }
};

export const deleteVideo = async (videoId) => {
  const res = await fetch(`${apiUrl}/youtube/delete_video/${videoId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete video with ID: ${videoId}`);
  return res.json();
};

/* -------------------------------------------------------------------------- */
/*                          Miscellaneous helpers                             */
/* -------------------------------------------------------------------------- */

export const updateSelectedFiles = async (selectedFileIds) => {
  const res = await fetch(`${apiUrl}/api/update-selected-files`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ selectedFileIds }),
  });
  if (!res.ok) throw new Error("Failed to update selected files");
  return res.json();
};

/* -------------------------------------------------------------------------- */
/*                          Chat � streaming endpoint                         */
/* -------------------------------------------------------------------------- */

/**
 * Opens a chat request and returns a stream reader so the caller can handle
 * chunks as they arrive.  This function **does not** block on the whole
 * response � that responsibility is moved to the UI layer.
 */

export const sendMessage = async ({
  query,
  selectedFileIds,
  selectedVideoIds,
  conversationId,
  selectedSystemMessage,
  signal,
}) => {
  const res = await fetch(`${apiUrl}/chat/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversation_id: conversationId,
      user_message: query,
      selected_file_ids: selectedFileIds || [],
      selected_video_ids: selectedVideoIds ? [selectedVideoIds] : [],
      system_message: selectedSystemMessage,
      user_id: user_id 
    }),
    signal,
  });

  return {
    newConversationId: res.headers.get("x-conversation-id"),
    reader:  res.body.getReader(),
    decoder: new TextDecoder(),
  };
};
export const updatePartialResponse = async ({ conversationId, userMessage, assistantMessage }) => {
  try {
    const res = await fetch(`${apiUrl}/chat/update-partial`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        userMessage,
        assistantMessage,
        userId: user_id,
      }),
    });

    if (!res.ok) {
      const detail = await res.json();
      throw new Error(detail.detail || "Failed to update partial response.");
    }

    return await res.json();
  } catch (err) {
    console.error("Error updating partial response:", err);
    throw err;
  }
};

export { apiUrl };

