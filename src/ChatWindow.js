import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import {
  FiSend,
  FiPaperclip,
  FiMoreHorizontal,
  FiSearch,
  FiPlus,
  FiStopCircle,
} from "react-icons/fi";
import { marked } from "marked";
import DOMPurify from "dompurify";
import {
  sendMessage,
  fetchConversationById,
} from "./api";
import "./ChatWindow.css";
import { updatePartialResponse } from "./api";
 
/* -------------------------------------------------------------------------- */
/*                          Markdown Configuration                           */
/* -------------------------------------------------------------------------- */
 
marked.setOptions({
  gfm: true,
  breaks: true,
  smartypants: true,
  headerIds: false,
  mangle: false,
});
 
function parseMarkdown(mdText) {
  if (!mdText) return "";
 
  // Enhanced preprocessing for better formatting and text wrapping
  let processed = mdText
    .replace(/\r\n/g, "\n")
    // Handle very long words/URLs with word break opportunities
    .replace(/(\S{50,})/g, (match) => {
      // Add word break opportunities for very long strings
      return match.replace(/(.{30})/g, '$1<wbr>');
    })
    // Handle code blocks with language detection
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang || 'text';
      return `\n\n<pre class="code-block language-${language}" style="overflow-x: auto; word-wrap: break-word; white-space: pre-wrap; max-width: 100%;"><code class="language-${language}">${code.trim()}</code></pre>\n\n`;
    })
    // Handle inline code with better wrapping
    .replace(/`([^`]+)`/g, '<code class="inline-code" style="word-break: break-all; overflow-wrap: break-word;">$1</code>')
    // Handle bold text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    // Handle italic text
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    // Better line break handling
    .replace(/  \n/g, "<br>\n")
    // Improve list formatting
    .replace(/^(\d+\.\s)/gm, "\n$1")
    .replace(/^([-*+]\s)/gm, "\n$1");
 
  // Parse with marked
  const html = marked(processed);
 
  // Sanitize with DOMPurify and allow word break elements
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'hr', 'div', 'span', 'wbr'
    ],
    ALLOWED_ATTR: ['href', 'title', 'alt', 'src', 'class', 'id', 'target', 'rel', 'style'],
  });
 
  return sanitized;
}
 
/* -------------------------------------------------------------------------- */
/*                          Code Enhancement Function                        */
/* -------------------------------------------------------------------------- */
 
const enhanceCodeBlocks = () => {
  const codeBlocks = document.querySelectorAll('.markdown-output pre:not([data-enhanced])');
  
  codeBlocks.forEach((pre) => {
    // Mark as enhanced to prevent re-processing
    pre.setAttribute('data-enhanced', 'true');
    
    // Ensure proper styling for overflow handling
    pre.style.maxWidth = '100%';
    pre.style.overflowX = 'auto';
    pre.style.overflowWrap = 'break-word';
    pre.style.whiteSpace = 'pre-wrap';
    pre.style.boxSizing = 'border-box';
    
    const code = pre.querySelector('code');
    if (!code) return;
 
    // Ensure code element has proper styling
    code.style.maxWidth = '100%';
    code.style.overflowWrap = 'break-word';
    code.style.whiteSpace = 'pre-wrap';
 
    // Detect language from class or content
    let language = 'text';
    const classList = code.className || '';
    if (classList.includes('language-')) {
      language = classList.match(/language-(\w+)/)?.[1] || 'text';
    } else {
      // Auto-detect language based on content
      const content = code.textContent.toLowerCase();
      if (content.includes('def ') || content.includes('import ') || content.includes('print(')) {
        language = 'python';
        code.className = 'language-python';
        pre.className = 'code-block language-python';
      } else if (content.includes('function ') || content.includes('const ') || content.includes('let ')) {
        language = 'javascript';
        code.className = 'language-javascript';
        pre.className = 'code-block language-javascript';
      } else if (content.includes('{') && content.includes('}') && content.includes('"')) {
        language = 'json';
        code.className = 'language-json';
        pre.className = 'code-block language-json';
      } else if (content.includes('<!doctype') || content.includes('<html')) {
        language = 'html';
        code.className = 'language-html';
        pre.className = 'code-block language-html';
      } else if (content.includes('background:') || content.includes('color:')) {
        language = 'css';
        code.className = 'language-css';
        pre.className = 'code-block language-css';
      }
    }
 
    // Add language label
    if (language !== 'text' && !pre.querySelector('.language-label')) {
      const label = document.createElement('div');
      label.className = 'language-label';
      label.textContent = language.toUpperCase();
      label.style.cssText = `
        position: absolute;
        top: 8px;
        left: 12px;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        z-index: 5;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      `;
      pre.appendChild(label);
    }
 
    // Add copy button
    if (!pre.querySelector('.copy-btn')) {
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.innerHTML = 'Copy';
      copyBtn.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
        opacity: 0;
        transition: all 0.2s ease;
        z-index: 10;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        font-weight: 500;
      `;
 
      // Show/hide on hover
      pre.addEventListener('mouseenter', () => {
        copyBtn.style.opacity = '1';
      });
 
      pre.addEventListener('mouseleave', () => {
        copyBtn.style.opacity = '0';
      });
 
      // Copy functionality
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(code.textContent);
          const originalText = copyBtn.innerHTML;
          const originalBg = copyBtn.style.background;
          
          copyBtn.innerHTML = '✓ Copied!';
          copyBtn.style.background = 'rgba(40, 167, 69, 0.8)';
          
          setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.style.background = originalBg;
          }, 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
          copyBtn.innerHTML = '✗ Failed';
          setTimeout(() => {
            copyBtn.innerHTML = 'Copy';
          }, 2000);
        }
      });
 
      pre.appendChild(copyBtn);
    }
  });
};
 
/* -------------------------------------------------------------------------- */
/*                          Enhanced Layout Fix Function                     */
/* -------------------------------------------------------------------------- */
 
const fixMessageLayout = () => {
  // Wait a bit for DOM to update
  setTimeout(() => {
    const assistantMessages = document.querySelectorAll('.message.assistant');
    assistantMessages.forEach(message => {
      const bubble = message.querySelector('.message-bubble');
      const markdownOutput = message.querySelector('.markdown-output');
      
      if (bubble && markdownOutput) {
        // Force proper dimensions on the message container
        message.style.alignSelf = 'flex-start';
        message.style.marginLeft = '0';
        message.style.marginRight = 'auto';
        message.style.minWidth = '300px';
        message.style.maxWidth = '75%';
        message.style.width = 'auto';
        message.style.flexShrink = '0';
        
        // Force proper dimensions on the bubble
        bubble.style.width = '100%';
        bubble.style.minWidth = '300px';
        bubble.style.maxWidth = '100%';
        bubble.style.boxSizing = 'border-box';
        bubble.style.overflow = 'visible';
        bubble.style.whiteSpace = 'normal';
        bubble.style.display = 'block';
        bubble.style.wordWrap = 'break-word';
        bubble.style.overflowWrap = 'break-word';
        
        // Force proper dimensions on markdown output
        markdownOutput.style.width = '100%';
        markdownOutput.style.maxWidth = '100%';
        markdownOutput.style.wordWrap = 'break-word';
        markdownOutput.style.overflowWrap = 'break-word';
        markdownOutput.style.overflowX = 'visible';
        markdownOutput.style.overflowY = 'visible';
        markdownOutput.style.whiteSpace = 'normal';
        markdownOutput.style.display = 'block';
        markdownOutput.style.minHeight = 'auto';
        
        // Fix all paragraphs inside
        const paragraphs = markdownOutput.querySelectorAll('p');
        paragraphs.forEach(p => {
          p.style.display = 'block';
          p.style.width = '100%';
          p.style.maxWidth = '100%';
          p.style.whiteSpace = 'normal';
          p.style.wordWrap = 'break-word';
          p.style.overflowWrap = 'break-word';
          p.style.margin = '0 0 12px 0';
          p.style.lineHeight = '1.6';
        });
 
        // Fix all other elements
        const allElements = markdownOutput.querySelectorAll('*');
        allElements.forEach(el => {
          el.style.maxWidth = '100%';
          el.style.wordWrap = 'break-word';
          el.style.overflowWrap = 'break-word';
          el.style.boxSizing = 'border-box';
        });
      }
    });
    
    // Also fix user messages to ensure they don't interfere
    const userMessages = document.querySelectorAll('.message.user');
    userMessages.forEach(message => {
      const bubble = message.querySelector('.message-bubble');
      if (bubble) {
        message.style.alignSelf = 'flex-end';
        message.style.marginLeft = 'auto';
        message.style.marginRight = '0';
        message.style.maxWidth = '70%';
        bubble.style.width = 'fit-content';
        bubble.style.maxWidth = '100%';
        bubble.style.display = 'block';
        bubble.style.wordWrap = 'break-word';
        bubble.style.overflowWrap = 'break-word';
      }
    });
  }, 50);
};
 
/* -------------------------------------------------------------------------- */
/*                               Main Component                              */
/* -------------------------------------------------------------------------- */
 
const ChatWindow = ({
  selectedFileIds = [],
  selectedVideoIds = [],
  conversationId,
  selectedSystemMessage,
  setSelectedConversationId,
  refreshConversations,
  setSelectedCitation,
}) => {
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const messagesEndRef = useRef(null);
  const assistantIdxRef = useRef(null);
  const bufferRef = useRef("");
  const charQueueRef = useRef([]);
  const typingTimerRef = useRef(null);
  const readerRef = useRef(null);
  const textareaRef = useRef(null);
 
  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
 
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
 
  // Enhance code blocks and fix layout after messages update
  useEffect(() => {
    const timer = setTimeout(() => {
      enhanceCodeBlocks();
      fixMessageLayout(); // This will force proper AI message width
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);
 
  // Load conversation history
  useEffect(() => {
    if (isProcessing) return;
 
    if (!conversationId) {
      setMessages([
        
      ]);
      return;
    }
 
    const loadConversation = async () => {
      try {
        const conv = await fetchConversationById(conversationId);
        if (!conv?.history) {
          setMessages([{
            sender: "system",
            message: "⚠️ No conversation history available.",
            timestamp: new Date().toISOString(),
            id: `system-${Date.now()}`
          }]);
          return;
        }
 
        setMessages(
          conv.history.map((m, index) => ({
            sender: m.role === "assistant" ? "assistant" : m.role === "user" ? "user" : "system",
            message: m.content?.trim() || "(No content)",
            timestamp: new Date().toISOString(),
            id: `msg-${index}`
          }))
        );
      } catch (error) {
        console.error("Failed to load conversation:", error);
        setMessages([{
          sender: "system",
          message: "❌ Unable to load conversation history.",
          timestamp: new Date().toISOString(),
          id: `system-${Date.now()}`
        }]);
      }
    };
 
    loadConversation();
  }, [conversationId, isProcessing]);
 
 
 
  // Typing animation
  const feedChunk = (chunk) => {
    if (!chunk) return;
 
    charQueueRef.current.push(...chunk);
    if (!typingTimerRef.current) {
      typingTimerRef.current = setInterval(() => {
        if (!charQueueRef.current.length) {
          clearInterval(typingTimerRef.current);
          typingTimerRef.current = null;
          return;
        }
 
        // Add 1-2 characters at a time for smooth typing
        const charsToAdd = Math.min(2, charQueueRef.current.length);
        for (let i = 0; i < charsToAdd; i++) {
          bufferRef.current += charQueueRef.current.shift();
        }
 
        setMessages((prev) => {
          const copy = [...prev];
          const idx = assistantIdxRef.current;
          if (copy[idx]) {
            copy[idx].message = bufferRef.current;
          }
          return copy;
        });
      }, 25); // Typing speed
    }
  };
 
  // Send message handler
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;
 
    const currentQuery = query.trim();
    setQuery("");
 
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
 
    setIsProcessing(true);
    const controller = new AbortController();
    setAbortController(controller);
 
    // Add user message
    const userMessage = {
      sender: "user",
      message: currentQuery,
      timestamp: new Date().toISOString(),
      id: `user-${Date.now()}`
    };
 
    setMessages((prev) => [...prev, userMessage]);
 
    // Add assistant placeholder
    setMessages((prev) => {
      const assistantMessage = {
        sender: "assistant",
        message: "",
        timestamp: new Date().toISOString(),
        id: `assistant-${Date.now()}`,
        isTyping: true
      };
      const next = [...prev, assistantMessage];
      assistantIdxRef.current = next.length - 1;
      return next;
    });
 
    // Reset buffers
    bufferRef.current = "";
    charQueueRef.current = [];
    clearInterval(typingTimerRef.current);
    typingTimerRef.current = null;
 
    // Send message
    let reader, decoder, newConversationId;
    try {
      ({ reader, decoder, newConversationId } = await sendMessage({
        query: currentQuery,
        selectedFileIds,
        selectedVideoIds,
        conversationId,
        selectedSystemMessage,
        signal: controller.signal,
      }));
 
      readerRef.current = reader;
 
      if (!conversationId && newConversationId) {
        setSelectedConversationId(newConversationId);
      }
    } catch (err) {
      console.error("Send message failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "system",
          message: "❌ **Error**: Failed to send message. Please try again.",
          timestamp: new Date().toISOString(),
          id: `error-${Date.now()}`
        }
      ]);
      setIsProcessing(false);
      setAbortController(null);
      return;
    }
 
    // Consume stream
    (async () => {
      let fullText = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
 
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          feedChunk(chunk);
 
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
 
        const tail = decoder.decode();
        if (tail) {
          fullText += tail;
          feedChunk(tail);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Stream error:", err);
          setMessages((prev) => [
            ...prev,
            {
              sender: "system",
              message: "⚠️ **Connection Error**: Stream was interrupted.",
              timestamp: new Date().toISOString(),
              id: `stream-error-${Date.now()}`
            }
          ]);
        }
        return;
      } finally {
        // Wait for typing animation to complete
        await new Promise((res) => {
          const tick = () =>
            !charQueueRef.current.length && !typingTimerRef.current
              ? res()
              : setTimeout(tick, 20);
          tick();
        });
      }
 
      // Finalize message
      setMessages((prev) => {
        const copy = [...prev];
        const idx = assistantIdxRef.current;
        if (copy[idx]) {
          copy[idx].message = fullText;
          copy[idx].isTyping = false;
          copy[idx].isComplete = true;
        }
        return copy;
      });
 
      // Update conversation ID
      if (!conversationId && newConversationId) {
        setSelectedConversationId(newConversationId);
        refreshConversations();
      }
 
      setIsProcessing(false);
      setAbortController(null);
    })();
  };
 
  // Stop handler
  const handleStop = () => {
    if (abortController) {
      abortController.abort();
    }
    if (readerRef.current) {
      readerRef.current
        .cancel()
        .catch((e) =>
          e?.name === "AbortError"
            ? console.debug("Reader cancel expected")
            : console.error("Reader cancel failed:", e)
        )
        .finally(() => {
          readerRef.current = null;
        });
    }
 
    // Clear typing animation
    charQueueRef.current = [];
    clearInterval(typingTimerRef.current);
    typingTimerRef.current = null;
 
    // Finalize current message
    setMessages((prev) => {
      const copy = [...prev];
      const idx = assistantIdxRef.current;
      if (copy[idx]) {
        copy[idx].message = bufferRef.current || "⏹️ *Response stopped by user*";
        copy[idx].isTyping = false;
        copy[idx].isStopped = true;
      }
      return copy;
    });
 
    bufferRef.current = "";
    setIsProcessing(false);
    setAbortController(null);
 
    // Save partial response
    const assistantMessage = messages[messages.length - 1]?.message || "";
    const userMessage = messages[messages.length - 2]?.message || "";
 
    if (assistantMessage && userMessage) {
      updatePartialResponse({ conversationId, userMessage, assistantMessage })
        .catch((e) => console.error("Partial save failed:", e));
    }
  };
 
  // New chat handler
  const handleNewChat = () => {
    setMessages([
      {
        sender: "system",
        message: "🤖 **AI-Buddy** developed by GOAI247.\n\nHello! How can I help you today?",
        timestamp: new Date().toISOString(),
        id: `system-${Date.now()}`
      },
    ]);
    setSelectedConversationId(null);
    refreshConversations();
  };
 
  // Auto-resize textarea
  const handleTextareaChange = (e) => {
    setQuery(e.target.value);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };
 
  // Enhanced message renderer with fixed typing indicator
  const renderMessage = (m, idx) => {
    const messageTime = m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    }) : '';
 
    if (m.sender === "assistant") {
      return (
        <div key={m.id || idx} className="message assistant" style={{
          alignSelf: 'flex-start',
          marginLeft: 0,
          marginRight: 'auto',
          maxWidth: '75%',
          minWidth: '300px',
          width: 'auto',
          flexShrink: 0
        }}>
          <div className="ai-badge">
            {m.message === "" ? "🤖 Thinking..." : m.isTyping ? "🤖 Writing..." : "🤖 AI Response"}
          </div>
          <div className="message-bubble" style={{
            width: '100%',
            minWidth: '300px',
            maxWidth: '100%',
            boxSizing: 'border-box',
            overflow: 'visible',
            whiteSpace: 'normal',
            display: 'block',
            wordWrap: 'break-word',
            overflowWrap: 'break-word'
          }}>
            {/* Show typing indicator inside the message bubble when message is empty */}
            {m.message === "" ? (
              <div className="typing-indicator">
                <span>AI is processing your request</span>
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            ) : (
              <div
                className="markdown-output"
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  overflowX: 'visible',
                  overflowY: 'visible',
                  whiteSpace: 'normal',
                  display: 'block',
                  minHeight: 'auto'
                }}
                dangerouslySetInnerHTML={{ __html: parseMarkdown(m.message) }}
              />
            )}
            {messageTime && !m.isTyping && m.message !== "" && (
              <div className="message-time">{messageTime}</div>
            )}
          </div>
        </div>
      );
    }
 
    if (m.sender === "user") {
      return (
        <div key={m.id || idx} className="message user" style={{
          alignSelf: 'flex-end',
          marginLeft: 'auto',
          marginRight: 0,
          maxWidth: '70%'
        }}>
          <div className="message-bubble" style={{
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            width: 'fit-content',
            maxWidth: '100%',
            boxSizing: 'border-box',
            display: 'block'
          }}>
            <div
              className="markdown-output"
              style={{
                width: '100%',
                maxWidth: '100%',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                overflowX: 'visible',
                whiteSpace: 'normal',
                display: 'block'
              }}
              dangerouslySetInnerHTML={{ __html: parseMarkdown(m.message) }}
            />
            {messageTime && (
              <div className="message-time">{messageTime}</div>
            )}
          </div>
        </div>
      );
    }
 
    // System messages
    return (
      <div key={m.id || idx} className="message system">
        <div className="message-bubble" style={{
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}>
          <div
            className="markdown-output"
            style={{
              width: '100%',
              maxWidth: '100%',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              whiteSpace: 'normal'
            }}
            dangerouslySetInnerHTML={{ __html: parseMarkdown(m.message) }}
          />
        </div>
      </div>
    );
  };
 
  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-title">
        
        {/* <button className="new-chat-btn" onClick={handleNewChat}>
          <FiPlus className="new-chat-icon" />
          New Chat
        </button> */}
        <div className="chat-info">
          {conversationId && (
            <span className="conversation-id">ID: {conversationId}</span>
          )}
          {selectedFileIds.length > 0 && (
            <span className="files-selected">
              📎 {selectedFileIds.length} file{selectedFileIds.length > 1 ? 's' : ''}
            </span>
          )}
          {selectedVideoIds.length > 0 && (
            <span className="videos-selected">
              🎥 {selectedVideoIds.length} video{selectedVideoIds.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      </div>
      {/* Messages */}
      <div className="messages">
        {messages.map((m, idx) => renderMessage(m, idx))}
        <div ref={messagesEndRef} />
      </div>
 
      {/* Input Area */}
      <form className="chat-input-area" onSubmit={handleSendMessage}>
        {/* <div className="input-buttons">
          <button
            type="button"
            title="Attach file"
            className="input-btn"
          >
            <FiPaperclip />
          </button>
          <button
            type="button"
            title="Search"
            className="input-btn"
          >
            <FiSearch />
          </button>
          <button
            type="button"
            title="More options"
            className="input-btn"
          >
            <FiMoreHorizontal />
          </button>
        </div> */}
 
        <div className="textarea-container">
          <textarea
            ref={textareaRef}
            value={query}
            onChange={handleTextareaChange}
            placeholder="Type your message..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            disabled={isProcessing}
            rows="1"
          />
          {query.length > 0 && (
            <div className="character-count">
              {query.length} characters
            </div>
          )}
        </div>
 
        <div className="right-buttons">
          {isProcessing ? (
            <button
              type="button"
              className="stop-btn"
              onClick={handleStop}
              title="Stop generation"
            >
              <FiStopCircle />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="submit"
              className="send-button"
              disabled={!query.trim()}
              title="Send message"
            >
              <FiSend />
            </button>
          )}
        </div>
      </form>
 
      {/* Connection Status */}
      {/* {isProcessing && (
        <div className="connection-status">
          <div className="status-indicator">
            <div className="pulse"></div>
            Connected to AI
          </div>
        </div>
      )} */}
    </div>
  );
};
 
ChatWindow.propTypes = {
  selectedFileIds: PropTypes.array,
  selectedVideoIds: PropTypes.array,
  conversationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  selectedSystemMessage: PropTypes.string.isRequired,
  setSelectedConversationId: PropTypes.func.isRequired,
  refreshConversations: PropTypes.func.isRequired,
  setSelectedCitation: PropTypes.func,
};
 
ChatWindow.defaultProps = {
  selectedFileIds: [],
  selectedVideoIds: [],
  conversationId: null,
  setSelectedCitation: () => {},
};
 
export default ChatWindow;
 