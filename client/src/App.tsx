import React, { useState, useEffect, useRef } from "react";
import ChatBubble from "./components/ChatBubble";
import ReactMarkdown from "react-markdown";
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
  >([
    {
      sender: "ai",
      text: "Hi! I'm your AI assistant with tool-calling capabilities. I can search the web, look up Wikipedia, do calculations, and more. How can I help?",
    },
  ]);
  const [input, setInput] = useState("");
  const [userQuery, setUserQuery] = useState<string | null>(null);
  const [agents, setAgents] = useState<string[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [userId, setUserId] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("general_assistant");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userProfile, setUserProfile] = useState("");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [newPreference, setNewPreference] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch preferences when panel opens
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
    if (userId.trim()) {
      setIsLoggedIn(true);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserId("");
    setChatSessions([]);
    setActiveSession(null);
    setMessages([
      {
        sender: "ai",
        text: "Hi! I'm your AI assistant with tool-calling capabilities. How can I help?",
      },
    ]);
  };

  const handleAgentChange = async (agentName: string) => {
    setSelectedAgent(agentName);
    setIsDropdownOpen(false);
    try {
      await setActiveAgent(agentName);
      await fetchSessions();
      await createNewSession();
    } catch (error) {
      console.error("Error changing agent:", error);
    }
  };

  // Fetch available agents on mount
  useEffect(() => {
    fetchAgents()
      .then((data) => {
        setAgents(data);
        if (data.length > 0) setSelectedAgent(data[0]);
      })
      .catch((err) => console.error("Error fetching agents:", err));
  }, []);

  // On login, set up agent + sessions
  useEffect(() => {
    if (isLoggedIn && userId) {
      setActiveAgent(selectedAgent)
        .then(() => fetchSessions())
        .then(() => createNewSession())
        .catch((err) => console.error("Error initializing:", err));
    }
  }, [isLoggedIn]);

  // Fetch bot response when userQuery changes
  useEffect(() => {
    if (!userQuery || !activeSession) return;

    const fetchBotResponse = async () => {
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
          { sender: "ai", text: "Sorry, there was an issue with the server." },
        ]);
      }
    };

    fetchBotResponse();
  }, [userQuery]);

  // Fetch chat history when active session changes
  useEffect(() => {
    if (!activeSession) return;

    fetchChatHistory(activeSession.session_id)
      .then((history) => {
        const processed = history.map((msg: any) => ({
          sender: msg.sender,
          text: msg.text,
          documents: msg.documents?.tool_output || [],
        }));
        if (processed.length === 0) {
          setMessages([{ sender: "ai", text: "How can I assist you?" }]);
        } else {
          setMessages(processed);
        }
        setUserQuery(null);
      })
      .catch((err) => {
        console.error("Error fetching chat history:", err);
        setMessages([{ sender: "ai", text: "Unable to load chat history." }]);
      });
  }, [activeSession]);

  const handleSendMessage = () => {
    if (!isLoggedIn) {
      (document.getElementById("login_modal") as any)?.showModal();
      return;
    }
    if (input.trim()) {
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
      setMessages([{ sender: "ai", text: "New session started. How can I assist you?" }]);
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

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm("Delete this session?")) return;
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
      chatContainerRef.current.lastElementChild?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeSession]);

  const markdownComponents = {
    a: ({ href, children }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 font-semibold underline hover:text-blue-800"
      >
        {children}
      </a>
    ),
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar
        userId={userId}
        isLoggedIn={isLoggedIn}
        handleLogout={handleLogout}
      />

      {/* Login Modal */}
      <dialog id="login_modal" className="modal">
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              X
            </button>
          </form>
          <h3 className="font-bold text-lg">Welcome to ChatAgent</h3>
          <p className="py-4">Enter a username to start chatting.</p>
          <div className="flex gap-2">
            <input
              type="text"
              className="input input-bordered flex-grow"
              placeholder="Your username"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleLogin();
                  (document.getElementById("login_modal") as any)?.close();
                }
              }}
            />
            <button
              className="btn btn-neutral"
              onClick={() => {
                handleLogin();
                (document.getElementById("login_modal") as any)?.close();
              }}
            >
              Start
            </button>
          </div>
        </div>
      </dialog>

      <div className="flex flex-grow overflow-hidden">
        {/* Sidebar */}
        {isLoggedIn && isSidebarOpen && (
          <div
            className="bg-base-200 p-4 flex flex-col space-y-2 transition-all duration-300"
            style={{
              width: "250px",
              maxWidth: "250px",
              minWidth: "250px",
              overflowY: "auto",
              scrollbarWidth: "none",
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setIsSidebarOpen(false)}
              >
                Close
              </button>
              <button className="btn btn-neutral btn-sm" onClick={createNewSession}>
                + New
              </button>
            </div>

            <div className="flex-grow">
              {chatSessions.map((session, index) => (
                <div
                  key={index}
                  className={`p-2 mb-2 rounded hover:bg-gray-400 cursor-pointer flex justify-between items-center ${
                    activeSession?.session_id === session.session_id
                      ? "bg-base-400 font-semibold"
                      : "bg-base-300"
                  } break-words`}
                >
                  <div
                    onClick={() => setActiveSession(session)}
                    className="flex-grow truncate"
                  >
                    {session.session_title}
                  </div>
                  <button
                    onClick={() => handleDeleteSession(session.session_id)}
                    className="ml-2 text-red-500 hover:text-red-700 text-sm"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sidebar toggle button */}
        {isLoggedIn && !isSidebarOpen && (
          <button
            className="fixed left-4 z-50 btn btn-outline btn-sm"
            style={{ top: "5rem" }}
            onClick={() => setIsSidebarOpen(true)}
          >
            Menu
          </button>
        )}

        {/* Main Chat Area */}
        <div className="flex-grow flex flex-col justify-left items-center bg-white-400 p-4 overflow-hidden">
          {isLoggedIn && (
            <div className="flex flex-col items-end w-full space-y-2 mb-2">
              <button
                className="btn btn-neutral btn-sm w-40"
                onClick={() => setIsPreferencesOpen(true)}
              >
                Memories
              </button>
              <button
                className="btn btn-neutral btn-sm w-40"
                onClick={() => setIsProfileOpen(true)}
              >
                User Profile
              </button>
            </div>
          )}

          {/* Preferences Panel */}
          {isLoggedIn && isPreferencesOpen && (
            <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-lg z-50 p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Long-Term Memories</h2>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setIsPreferencesOpen(false)}
                >
                  X
                </button>
              </div>
              <div className="flex mb-4 space-x-2">
                <input
                  type="text"
                  className="input input-bordered flex-grow"
                  placeholder="Add new memory"
                  value={newPreference}
                  onChange={(e) => setNewPreference(e.target.value)}
                />
                <button className="btn btn-primary" onClick={handleAddPreference}>
                  +
                </button>
              </div>
              <ul className="space-y-3">
                {preferences.map((pref, idx) => (
                  <li key={idx} className="flex items-center space-x-2">
                    <input
                      type="text"
                      className="input input-sm input-bordered flex-grow"
                      defaultValue={pref}
                      readOnly
                    />
                    <button
                      className="btn btn-sm btn-error"
                      onClick={() => handleDeletePreference(idx)}
                    >
                      x
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Profile Panel */}
          {isLoggedIn && isProfileOpen && (
            <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-lg z-50 p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">User Profile</h2>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setIsProfileOpen(false)}
                >
                  X
                </button>
              </div>
              <div className="space-y-3">
                <div className="relative border border-gray-300 rounded-lg p-3 h-32 overflow-y-auto">
                  <textarea
                    className="w-full h-full resize-none outline-none"
                    value={userProfile}
                    onChange={(e) => setUserProfile(e.target.value)}
                  />
                  <div className="absolute top-2 right-2">
                    <button className="btn btn-sm" onClick={handleUpdateUserProfile}>
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Agent Selector */}
          <div className="relative w-64 mx-auto mt-8">
            <button
              className="w-full bg-base-300 text-gray-800 font-medium px-4 py-2 rounded-lg flex justify-between items-center hover:bg-gray-400"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {selectedAgent.replace(/_/g, " ") || "Select an agent"}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className={`w-5 h-5 transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {agents.length > 0 ? (
                  agents.map((agentName) => (
                    <div
                      key={agentName}
                      onClick={() => handleAgentChange(agentName)}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      {agentName.replace(/_/g, " ")}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-500">No agents available</div>
                )}
              </div>
            )}
          </div>

          {/* Chat Messages */}
          <div
            className="flex-grow w-full max-w-4xl space-y-4 overflow-y-auto mt-2 px-4"
            ref={chatContainerRef}
            style={{
              maxHeight: "calc(100vh - 100px)",
              overflowY: "auto",
              scrollbarWidth: "thin",
              scrollbarColor: "#c0c0c0 transparent",
            }}
          >
            {messages.map((message, index) => (
              <div key={index}>
                {message.sender === "human" ? (
                  <ChatBubble messages={[message]} />
                ) : (
                  <div>
                    {Array.isArray(message.documents) &&
                      message.documents.length > 0 && (
                        <div className="mt-2 mb-2 flex space-x-2 flex-wrap">
                          {message.documents.slice(0, 3).map((doc: any, docIndex: number) => (
                            <a
                              key={docIndex}
                              href={doc.url || doc.href || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="card bg-base-100 w-64 shadow-md cursor-pointer hover:shadow-lg transition-shadow mb-2"
                            >
                              <div className="card-body p-3">
                                <h2 className="card-title text-sm font-semibold">
                                  {doc.name || doc.title || "Source"}
                                </h2>
                                {doc.snippet && (
                                  <p className="text-xs text-gray-500 truncate">
                                    {doc.snippet}
                                  </p>
                                )}
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    <div className="p-4 rounded-lg bg-base-200">
                      <ReactMarkdown components={markdownComponents}>
                        {message.text}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="w-full max-w-4xl mt-4 relative">
            <input
              type="text"
              className="input input-bordered w-full pr-10"
              placeholder="Ask anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
            />
            <button
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={handleSendMessage}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 10.25l16.57-4.76a1 1 0 011.3 1.3l-4.76 16.57a1 1 0 01-1.89.11L11.28 12l-7.68-3.28a1 1 0 01-.6-1.27z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
