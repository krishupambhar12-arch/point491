import React, { useState, useEffect, useRef } from "react";
import { API } from "../config/api";
import "../styles/doctorConsultation.css";
import Sidebar from "../components/AttorneySidebar";

const AttorneyConsultation = () => {
  const [consultations, setConsultations] = useState([]);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchConsultations();
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
      const res = await fetch(API.ATTORNEY_CONSULTATIONS, {
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

  const fetchMessages = async (consultationId) => {
    try {
      const res = await fetch(`${API.ATTORNEY_CONSULTATION_MESSAGES}/${consultationId}/messages`, {
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

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConsultation) return;

    setSending(true);
    try {
      const res = await fetch(
        `${API.ATTORNEY_SEND_CONSULTATION_MESSAGE}/${selectedConsultation.id}/message`,
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

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="dashboard-page">
      <Sidebar />
      <div className="consultation-container">
        <div className="consultation-sidebar">
          <div className="consultation-header">
            <h2>Consultations</h2>
          </div>

          <div className="consultations-list">
            {loading ? (
              <p>Loading consultations...</p>
            ) : consultations.length === 0 ? (
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
                    <strong>{consultation.patient_name}</strong>
                    <small>{consultation.patient_email}</small>
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
                  <h3>{selectedConsultation.patient_name}</h3>
                  <small>{selectedConsultation.patient_email}</small>
                </div>
                <span className={`status ${selectedConsultation.status.toLowerCase()}`}>
                  {selectedConsultation.status}
                </span>
              </div>

              <div className="messages-area">
                {messages.length === 0 ? (
                  <div className="no-messages">
                    <p>No messages yet.</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`message ${
                        (msg.sender_role === "Doctor" || msg.sender_role === "Attorney") ? "sent" : "received"
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
                  placeholder="Type your response..."
                  disabled={sending || selectedConsultation.status !== "Active"}
                />
                <button type="submit" disabled={sending || !newMessage.trim()}>
                  {sending ? "Sending..." : "Send"}
                </button>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <p>Select a consultation to view messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttorneyConsultation;
