import React from "react";

const ChatSidebar = ({
  employeeID,
  isSidebarOpen,
  toggleSidebar,
  createNewSession,
  chatSessions,
  activeSession,
  setActiveSession,
  handleDeleteSession,
}) => {
  if (!employeeID) return null;

  return (
    <div className="flex flex-grow overflow-hidden">
      {isSidebarOpen && (
        <div
          className="bg-base-200 p-4 flex flex-col space-y-2 transition-all duration-300"
          style={{
            width: "250px",
            maxWidth: "250px",
            minWidth: "250px",
            overflowY: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            resize: "none",
          }}
          onWheel={(e) => {
            e.currentTarget.scrollTop += e.deltaY;
          }}
        >
          <style>
            {`
              div::-webkit-scrollbar {
                display: none;
              }
            `}
          </style>

          <div className="flex justify-between items-center mb-4">
            <button className="btn btn-outline btn-sm" onClick={toggleSidebar}>
              ❌ Close
            </button>
            <button className="btn btn-primary btn-sm" onClick={createNewSession}>
              ➕ New Session
            </button>
          </div>

          <div className="flex-grow">
            {chatSessions.map((session, index) => (
              <div
                key={index}
                className={`p-2 mb-2 rounded hover:bg-gray-400 cursor-pointer flex justify-between items-center ${
                  activeSession === session ? "bg-base-400" : "bg-base-300"
                } break-words`}
              >
                <div
                  onClick={() => setActiveSession(session)}
                  className="flex-grow"
                >
                  {session}
                </div>
                <button
                  onClick={() => handleDeleteSession(session)}
                  className="ml-2 text-red-500 hover:text-red-700 text-sm"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      
    </div>
  );
};

export default ChatSidebar;
