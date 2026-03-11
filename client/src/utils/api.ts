const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:7778";

export const fetchAgents = async (): Promise<string[]> => {
  const response = await fetch(`${API_BASE}/available_agents`);
  if (!response.ok) throw new Error("Failed to fetch agents");
  return await response.json();
};

export const setActiveAgent = async (agentName: string): Promise<void> => {
  const response = await fetch(
    `${API_BASE}/agent?agent_name=${encodeURIComponent(agentName)}`,
    { method: "PUT", headers: { Accept: "application/json" } }
  );
  if (!response.ok) throw new Error("Failed to set agent");
};

export const fetchAllSessions = async (userId: string): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/sessions?user_id=${encodeURIComponent(userId)}`);
  if (!response.ok) throw new Error("Failed to fetch sessions");
  return await response.json();
};

export const createSession = async (userId: string): Promise<any> => {
  const response = await fetch(`${API_BASE}/create_session?user_id=${encodeURIComponent(userId)}`);
  if (!response.ok) throw new Error("Failed to create session");
  return await response.json();
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/delete_session?session_id=${encodeURIComponent(sessionId)}`);
  if (!response.ok) throw new Error("Failed to delete session");
};

export const fetchChatHistory = async (sessionId: string): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/session_history?session_id=${encodeURIComponent(sessionId)}`);
  if (!response.ok) throw new Error("Failed to fetch chat history");
  return await response.json();
};

export const sendMessage = async (sessionId: string, userId: string, userInput: string): Promise<any> => {
  const response = await fetch(
    `${API_BASE}/chat?session_id=${encodeURIComponent(sessionId)}&user_id=${encodeURIComponent(userId)}&user_input=${encodeURIComponent(userInput)}`
  );
  if (!response.ok) throw new Error("Failed to send message");
  return await response.json();
};

export const fetchPreferences = async (userId: string): Promise<string[]> => {
  const response = await fetch(`${API_BASE}/preferences?user_id=${encodeURIComponent(userId)}`);
  if (!response.ok) throw new Error("Failed to fetch preferences");
  return await response.json();
};

export const addPreference = async (userId: string, preference: string): Promise<string[]> => {
  const response = await fetch(
    `${API_BASE}/add_preferences?user_id=${encodeURIComponent(userId)}&new_preference=${encodeURIComponent(preference)}`,
    { method: "POST", headers: { "Content-Type": "application/json" } }
  );
  return await response.json();
};

export const deletePreference = async (userId: string, idx: number): Promise<string[]> => {
  const response = await fetch(
    `${API_BASE}/delete_preferences?user_id=${encodeURIComponent(userId)}&idx=${idx}`,
    { method: "POST" }
  );
  return await response.json();
};

export const fetchUserProfile = async (userId: string): Promise<string> => {
  const response = await fetch(`${API_BASE}/user_profile?user_id=${encodeURIComponent(userId)}`);
  if (!response.ok) throw new Error("Failed to fetch user profile");
  return await response.json();
};

export const updateUserProfile = async (userId: string, profile: string): Promise<string> => {
  const response = await fetch(
    `${API_BASE}/update_user_profile?user_id=${encodeURIComponent(userId)}&new_profile=${encodeURIComponent(profile)}`,
    { method: "POST", headers: { "Content-Type": "application/json" } }
  );
  return await response.json();
};
