import React, { useState, useEffect, useRef } from "react";
import ChatBubble, { TypingIndicator } from "./components/ChatBubble";
import Navbar from "./components/Navbar";
import "./App.css";
import {
  fetchAgents,
  setActiveAgent,
  fetchAllSessions as apiFetchAllSessions,
  createSession,
  deleteSession as apiDeleteSession,
  fetchChatHistory,
  sendMessage,
  fetchPreferences,
  addPreference,
  deletePreference,
  fetchUserProfile,
  updateUserProfile,
} from "./utils/api";

type ChatSession = {
  session_id: string;
  session_title: string;
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<
    Array<{ sender: "ai" | "human"; text: string; documents?: any[] }>
  >([]);
  const [input, setInput] = useState("");
  const [userQuery, setUserQuery] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [agents, setAgents] = useState<string[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [userId, setUserId] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("general_assistant");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userProfile, setUserProfile] = useState("");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [newPreference, setNewPreference] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPreferencesOpen && userId) {
      fetchPreferences(userId)
        .then((data) => setPreferences(data))
        .catch((err) => console.error("Error fetching preferences:", err));
    }
  }, [isPreferencesOpen, userId]);

  useEffect(() => {
    if (isProfileOpen && userId) {
      fetchUserProfile(userId)
        .then((data) => setUserProfile(data))
        .catch((err) => console.error("Error fetching profile:", err));
    }
  }, [isProfileOpen, userId]);

  const handleAddPreference = async () => {
    if (!newPreference.trim()) return;
    const updated = await addPreference(userId, newPreference);
    setPreferences(updated);
    setNewPreference("");
  };

  const handleUpdateUserProfile = async () => {
    const updated = await updateUserProfile(userId, userProfile);
    setUserProfile(updated);
  };

  const handleDeletePreference = async (idx: number) => {
    const updated = await deletePreference(userId, idx);
    setPreferences(updated);
  };

  const handleLogin = () => {
    if (userId.trim()) setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserId("");
    setChatSessions([]);
    setActiveSession(null);
    setMessages([]);
  };

  const handleAgentChange = async (agentName: string) => {
    setSelectedAgent(agentName);
    try {
      await setActiveAgent(agentName);
      await fetchSessions();
      await createNewSession();
    } catch (error) {
      console.error("Error changing agent:", error);
    }
  };

  useEffect(() => {
    fetchAgents()
      .then((data) => {
        setAgents(data);
        if (data.length > 0) setSelectedAgent(data[0]);
      })
      .catch((err) => console.error("Error fetching agents:", err));
  }, []);

  useEffect(() => {
    if (isLoggedIn && userId) {
      setActiveAgent(selectedAgent)
        .then(() => fetchSessions())
        .then(() => createNewSession())
        .catch((err) => console.error("Error initializing:", err));
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!userQuery || !activeSession) return;

    const fetchBotResponse = async () => {
      setIsLoading(true);
      try {
        const data = await sendMessage(activeSession.session_id, userId, userQuery);
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: data.response, documents: data.documents || [] },
        ]);
        fetchSessions();
      } catch (error) {
        console.error("Error fetching bot response:", error);
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: "Sorry, there was an issue connecting to the server." },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBotResponse();
  }, [userQuery]);

  useEffect(() => {
    if (!activeSession) return;

    fetchChatHistory(activeSession.session_id)
      .then((history) => {
        const processed = history.map((msg: any) => ({
          sender: msg.sender,
          text: msg.text,
          documents: msg.documents?.tool_output || [],
        }));
        setMessages(processed);
        setUserQuery(null);
      })
      .catch((err) => {
        console.error("Error fetching chat history:", err);
        setMessages([]);
      });
  }, [activeSession]);

  const handleSendMessage = () => {
    if (!isLoggedIn) {
      (document.getElementById("login_modal") as any)?.showModal();
      return;
    }
    if (input.trim() && !isLoading) {
      setMessages((prev) => [...prev, { sender: "human", text: input }]);
      setUserQuery(input);
      setInput("");
    }
  };

  const createNewSession = async () => {
    if (!userId) return;
    try {
      const newSession = await createSession(userId);
      setChatSessions((prev) => [newSession, ...prev]);
      setActiveSession(newSession);
      setMessages([]);
    } catch (error) {
      console.error("Error creating session:", error);
    }
  };

  const fetchSessions = async () => {
    if (!userId) return;
    try {
      const sessions = await apiFetchAllSessions(userId);
      setChatSessions(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      await apiDeleteSession(sessionId);
      setChatSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
      if (activeSession?.session_id === sessionId) {
        createNewSession();
      }
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const formatAgentName = (name: string) =>
    name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div data-theme="agentforge" className="h-screen flex flex-col overflow-hidden bg-base-100">
      <Navbar
        userId={userId}
        isLoggedIn={isLoggedIn}
        handleLogout={handleLogout}
        onOpenMemories={() => setIsPreferencesOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Login Modal */}
      <dialog id="login_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box max-w-sm">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </form>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg">Welcome to Agent Forge</h3>
          </div>
          <p className="text-sm text-base-content/60 mb-5">Enter a username to get started.</p>
          <div className="flex gap-2">
            <input
              type="text"
              className="input input-bordered flex-grow text-sm"
              placeholder="Username"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && userId.trim()) {
                  handleLogin();
                  (document.getElementById("login_modal") as any)?.close();
                }
              }}
            />
            <button
              className="btn btn-primary"
              onClick={() => {
                handleLogin();
                (document.getElementById("login_modal") as any)?.close();
              }}
            >
              Start
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {isLoggedIn && isSidebarOpen && (
          <aside className="w-64 shrink-0 bg-sidebar flex flex-col border-r border-sidebar-hover">
            {/* Sidebar Header */}
            <div className="p-3 flex items-center gap-2">
              <button
                onClick={createNewSession}
                className="flex-1 flex items-center justify-center gap-2 text-sm text-sidebar-text bg-sidebar-hover hover:bg-sidebar-active rounded-lg px-3 py-2.5 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New Chat
              </button>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hover rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
                </svg>
              </button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto sidebar-scroll px-2 pb-2">
              <p className="text-[10px] uppercase tracking-wider text-sidebar-muted px-2 mb-2 mt-1">Conversations</p>
              {chatSessions.length === 0 && (
                <p className="text-xs text-sidebar-muted px-2">No conversations yet</p>
              )}
              {chatSessions.map((session) => (
                <div
                  key={session.session_id}
                  onClick={() => setActiveSession(session)}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer mb-0.5 transition-colors ${
                    activeSession?.session_id === session.session_id
                      ? "bg-sidebar-active text-sidebar-text"
                      : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                  <span className="flex-1 text-sm truncate">{session.session_title}</span>
                  <button
                    onClick={(e) => handleDeleteSession(e, session.session_id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-error transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Agent Selector at Bottom */}
            <div className="p-3 border-t border-sidebar-hover">
              <p className="text-[10px] uppercase tracking-wider text-sidebar-muted px-1 mb-2">Agent</p>
              <div className="flex flex-col gap-1">
                {agents.map((agentName) => (
                  <button
                    key={agentName}
                    onClick={() => handleAgentChange(agentName)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedAgent === agentName
                        ? "bg-primary/20 text-primary"
                        : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      selectedAgent === agentName ? "bg-primary" : "bg-sidebar-muted/40"
                    }`} />
                    {formatAgentName(agentName)}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* Sidebar Toggle (when closed) */}
        {isLoggedIn && !isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="fixed left-3 top-[4.5rem] z-50 p-2 bg-base-100 border border-base-300 rounded-lg shadow-sm hover:bg-base-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M13 5l7 7-7 7M6 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-base-200/50">
          {/* Chat Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto scrollbar-thin"
          >
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-primary">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold mb-2">How can I help you?</h2>
                  <p className="text-sm text-base-content/50 max-w-md">
                    I can search the web, look up Wikipedia, do calculations, and more. Ask me anything.
                  </p>
                </div>
              )}

              {messages.map((message, index) => (
                <ChatBubble
                  key={index}
                  sender={message.sender}
                  text={message.text}
                  documents={message.documents}
                />
              ))}

              {isLoading && <TypingIndicator />}
            </div>
          </div>

          {/* Input Area */}
          <div className="shrink-0 border-t border-base-300 bg-base-100 p-4">
            <div className="max-w-3xl mx-auto relative">
              <input
                type="text"
                className="w-full bg-base-200 border-0 rounded-xl pl-4 pr-12 py-3.5 text-sm placeholder:text-base-content/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                placeholder={isLoggedIn ? "Message Agent Forge..." : "Sign in to start chatting..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) handleSendMessage();
                }}
                disabled={isLoading}
              />
              <button
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
                  input.trim() && !isLoading
                    ? "bg-primary text-primary-content hover:bg-primary/90"
                    : "text-base-content/20"
                }`}
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          </div>
        </main>

        {/* Slide-over Panels */}
        {/* Backdrop */}
        {(isPreferencesOpen || isProfileOpen) && (
          <div
            className="fixed inset-0 bg-black/20 z-40 transition-opacity"
            onClick={() => { setIsPreferencesOpen(false); setIsProfileOpen(false); }}
          />
        )}

        {/* Memories Panel */}
        <div className={`fixed top-0 right-0 h-full w-96 max-w-[90vw] bg-base-100 shadow-2xl z-50 transform transition-transform duration-300 ${
          isPreferencesOpen ? "translate-x-0" : "translate-x-full"
        }`}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-5 border-b border-base-300">
              <div>
                <h2 className="text-lg font-semibold">Memories</h2>
                <p className="text-xs text-base-content/50 mt-0.5">Things I remember about you</p>
              </div>
              <button
                className="p-2 hover:bg-base-200 rounded-lg transition-colors"
                onClick={() => setIsPreferencesOpen(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 border-b border-base-300">
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input input-bordered input-sm flex-grow text-sm"
                  placeholder="Add a memory..."
                  value={newPreference}
                  onChange={(e) => setNewPreference(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddPreference(); }}
                />
                <button className="btn btn-primary btn-sm" onClick={handleAddPreference}>
                  Add
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {preferences.length === 0 && (
                <p className="text-sm text-base-content/40 text-center py-8">No memories stored yet</p>
              )}
              {preferences.map((pref, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 bg-base-200 rounded-lg group">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-primary shrink-0">
                    <path d="M12 2a5 5 0 015 5v1a5 5 0 01-10 0V7a5 5 0 015-5z" />
                    <path d="M21 21v-1a7 7 0 00-7-7h-4a7 7 0 00-7 7v1" />
                  </svg>
                  <span className="flex-1 text-sm">{pref}</span>
                  <button
                    onClick={() => handleDeletePreference(idx)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-base-300 rounded transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-error">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Profile Panel */}
        <div className={`fixed top-0 right-0 h-full w-96 max-w-[90vw] bg-base-100 shadow-2xl z-50 transform transition-transform duration-300 ${
          isProfileOpen ? "translate-x-0" : "translate-x-full"
        }`}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-5 border-b border-base-300">
              <div>
                <h2 className="text-lg font-semibold">Profile</h2>
                <p className="text-xs text-base-content/50 mt-0.5">Tell me about yourself</p>
              </div>
              <button
                className="p-2 hover:bg-base-200 rounded-lg transition-colors"
                onClick={() => setIsProfileOpen(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 p-5">
              <textarea
                className="w-full h-48 bg-base-200 border-0 rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                placeholder="Write something about yourself — your role, interests, or preferences..."
                value={userProfile}
                onChange={(e) => setUserProfile(e.target.value)}
              />
              <button
                className="btn btn-primary btn-sm mt-3"
                onClick={handleUpdateUserProfile}
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
