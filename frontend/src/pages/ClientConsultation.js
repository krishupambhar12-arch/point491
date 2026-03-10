import React, { useState, useEffect, useRef } from "react";
import { API } from "../config/api";
import "../styles/patientConsultation.css";
import ClientSidebar from "../components/ClientSidebar";

const ClientConsultation = () => {
  const [consultations, setConsultations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showDoctorList, setShowDoctorList] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showAIAdvisor, setShowAIAdvisor] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAdvice, setAiAdvice] = useState("");
  const [gettingAdvice, setGettingAdvice] = useState(false);
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchConsultations();
    fetchAttorneys();
  }, []);

  useEffect(() => {
    if (selectedConsultation) {
      fetchMessages(selectedConsultation.id);
      // Auto-refresh messages every 3 seconds
      const interval = setInterval(() => {
        fetchMessages(selectedConsultation.id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedConsultation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConsultations = async () => {
    try {
      const res = await fetch(API.CLIENT_CONSULTATIONS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setConsultations(data.consultations || []);
        if (data.consultations && data.consultations.length > 0 && !selectedConsultation) {
          setSelectedConsultation(data.consultations[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching consultations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttorneys = async () => {
    try {
      const res = await fetch(API.CONSULTATION_ATTORNEYS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setDoctors(data.attorneys || []);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const fetchMessages = async (consultationId) => {
    try {
      const res = await fetch(`${API.CONSULTATION_MESSAGES}/${consultationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const startConsultation = async (doctorId) => {
    try {
      const res = await fetch(API.CREATE_CONSULTATION, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ doctor_id: doctorId }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchConsultations();
        setShowDoctorList(false);
        setSelectedDoctor(null);
      } else {
        alert(data.message || "Failed to start consultation");
      }
    } catch (error) {
      console.error("Error starting consultation:", error);
      alert("Failed to start consultation");
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConsultation) return;

    setSending(true);
    try {
      const res = await fetch(
        `${API.SEND_CONSULTATION_MESSAGE}/${selectedConsultation.id}/message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: newMessage }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setNewMessage("");
        fetchMessages(selectedConsultation.id);
      } else {
        alert(data.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const getAIAdvice = async () => {
    if (!aiQuestion.trim()) {
      alert("Please enter your question");
      return;
    }

    setGettingAdvice(true);
    try {
      const res = await fetch(API.AI_ADVICE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: aiQuestion }),
      });
      const data = await res.json();
      if (res.ok) {
        setAiAdvice(data.advice || "No advice available");
      } else {
        alert(data.message || "Failed to get AI advice");
      }
    } catch (error) {
      console.error("Error getting AI advice:", error);
      alert("Failed to get AI advice");
    } finally {
      setGettingAdvice(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="dashboard-page">
      <ClientSidebar />
      <div className="consultation-container">
        <div className="consultation-sidebar">
          <div className="consultation-header">
            <h2>Consultations</h2>
            <div className="header-buttons">
              <button
                className="ai-advisor-btn"
                onClick={() => setShowAIAdvisor(!showAIAdvisor)}
                title="Get AI Health Advice"
              >
                🤖 AI Advisor
              </button>
              <button
                className="new-consultation-btn"
                onClick={() => setShowDoctorList(!showDoctorList)}
              >
                + New Consultation
              </button>
            </div>
          </div>

          {showAIAdvisor && (
            <div className="ai-advisor-panel">
              <h3>AI Health Advisor</h3>
              <p className="ai-description">Ask me about your health concerns for quick advice</p>
              <div className="ai-input-section">
                <textarea
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  placeholder="E.g., I have fever and headache, what should I do?"
                  rows="3"
                  className="ai-question-input"
                />
                <button
                  className="get-advice-btn"
                  onClick={getAIAdvice}
                  disabled={gettingAdvice || !aiQuestion.trim()}
                >
                  {gettingAdvice ? "Getting Advice..." : "Get Advice"}
                </button>
              </div>
              {aiAdvice && (
                <div className="ai-advice-display">
                  <h4>AI Advice:</h4>
                  <div className="advice-content">
                    {aiAdvice.split('\n').map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                  </div>
                  <button
                    className="clear-advice-btn"
                    onClick={() => {
                      setAiAdvice("");
                      setAiQuestion("");
                    }}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}

          {showDoctorList && (
            <div className="doctor-list">
              <h3>Select Attorney</h3>
              {doctors.length === 0 ? (
                <p>No attorneys available</p>
              ) : (
                <div className="doctor-items">
                  {doctors.map((attorney) => (
                    <div
                      key={attorney.id}
                      className={`doctor-item ${
                        selectedDoctor?.id === attorney.id ? "selected" : ""
                      }`}
                      onClick={() => setSelectedDoctor(attorney)}
                    >
                      <div className="doctor-info">
                        <strong>{attorney.name}</strong>
                        <small>{attorney.specialization}</small>
                      </div>
                      {selectedDoctor?.id === attorney.id && (
                        <button
                          className="start-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            startConsultation(attorney.id);
                          }}
                        >
                          Start Chat
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="consultations-list">
            {consultations.length === 0 ? (
              <p className="no-consultations">No consultations yet</p>
            ) : (
              consultations.map((consultation) => (
                <div
                  key={consultation.id}
                  className={`consultation-item ${
                    selectedConsultation?.id === consultation.id ? "active" : ""
                  }`}
                  onClick={() => setSelectedConsultation(consultation)}
                >
                  <div className="consultation-info">
                    <strong>Attorney {consultation.doctor_name}</strong>
                    <small>{consultation.specialization}</small>
                    <span className={`status ${consultation.status.toLowerCase()}`}>
                      {consultation.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="chat-container">
          {selectedConsultation ? (
            <>
              <div className="chat-header">
                <div>
                  <h3>Attorney {selectedConsultation.doctor_name}</h3>
                  <small>{selectedConsultation.specialization}</small>
                </div>
                <span className={`status ${selectedConsultation.status.toLowerCase()}`}>
                  {selectedConsultation.status}
                </span>
              </div>

              <div className="messages-area">
                {messages.length === 0 ? (
                  <div className="no-messages">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`message ${
                        (msg.sender_role === "Patient" || msg.sender_role === "Client") ? "sent" : "received"
                      }`}
                    >
                      <div className="message-content">
                        <p>{msg.message}</p>
                        <span className="message-time">{formatTime(msg.createdAt)}</span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="message-input-form" onSubmit={sendMessage}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  disabled={sending || selectedConsultation.status !== "Active"}
                />
                <button type="submit" disabled={sending || !newMessage.trim()}>
                  {sending ? "Sending..." : "Send"}
                </button>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <p>Select a consultation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientConsultation;
