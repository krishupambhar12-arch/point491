import React, { useState, useRef, useEffect } from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import { API } from "../config/api";
import "../styles/aiAdvisor.css";

const AIAdvisor = () => {
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [gettingAdvice, setGettingAdvice] = useState(false);
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getAIAdvice = async (e) => {
    e.preventDefault();
    if (!question.trim()) {
      alert("Please enter your question");
      return;
    }

    const userQuestion = question.trim();
    setQuestion("");
    
    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      type: "user",
      message: userQuestion,
      timestamp: new Date()
    };
    setChatHistory(prev => [...prev, userMessage]);

    setGettingAdvice(true);
    try {
      const res = await fetch(API.AI_ADVICE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ message: userQuestion }),
      });
      const data = await res.json();
      if (res.ok) {
        // Add AI response to chat
        const aiMessage = {
          id: Date.now() + 1,
          type: "ai",
          message: data.advice || "No advice available",
          timestamp: new Date()
        };
        setChatHistory(prev => [...prev, aiMessage]);
      } else {
        const errorMessage = {
          id: Date.now() + 1,
          type: "ai",
          message: data.message || "Failed to get AI advice. Please try again.",
          timestamp: new Date()
        };
        setChatHistory(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Error getting AI advice:", error);
      const errorMessage = {
        id: Date.now() + 1,
        type: "ai",
        message: "Failed to get AI advice. Please try again.",
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setGettingAdvice(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const clearChat = () => {
    if (window.confirm("Are you sure you want to clear the chat history?")) {
      setChatHistory([]);
    }
  };

  return (
    <>
      <Header />
      <div className="ai-advisor-page">
        <div className="ai-advisor-container">
          <div className="ai-header">
            <div className="ai-title">
              <span className="ai-icon-large">🤖</span>
              <h1>AI Health Advisor</h1>
            </div>
            <p className="ai-subtitle">Ask me about your health concerns for quick advice</p>
            {chatHistory.length > 0 && (
              <button className="clear-chat-btn" onClick={clearChat}>
                Clear Chat
              </button>
            )}
          </div>

          <div className="chat-messages-area">
            {chatHistory.length === 0 ? (
              <div className="welcome-message">
                <div className="welcome-icon">👋</div>
                <h2>Welcome to AI Health Advisor</h2>
                <p>I can help you with:</p>
                <ul>
                  <li>General health advice</li>
                  <li>Common symptoms guidance</li>
                  <li>Diet and nutrition tips</li>
                  <li>Exercise recommendations</li>
                  <li>Stress and sleep management</li>
                </ul>
                <p className="disclaimer">
                  <strong>Note:</strong> This is general advice only. For serious medical concerns, please consult a qualified healthcare professional.
                </p>
              </div>
            ) : (
              chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-message ${msg.type === "user" ? "user-message" : "ai-message"}`}
                >
                  <div className="message-bubble">
                    {msg.type === "ai" && <span className="ai-badge">AI</span>}
                    <p>{msg.message}</p>
                    <span className="message-timestamp">{formatTime(msg.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
            {gettingAdvice && (
              <div className="chat-message ai-message">
                <div className="message-bubble">
                  <span className="ai-badge">AI</span>
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="ai-input-form" onSubmit={getAIAdvice}>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask me anything about your health... (e.g., I have fever and headache)"
              disabled={gettingAdvice}
            />
            <button type="submit" disabled={gettingAdvice || !question.trim()}>
              {gettingAdvice ? "Thinking..." : "Send"}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AIAdvisor;
