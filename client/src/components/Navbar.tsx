import React from "react";

interface NavbarProps {
  userId: string;
  isLoggedIn: boolean;
  handleLogout: () => void;
  onOpenMemories: () => void;
  onOpenProfile: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  userId,
  isLoggedIn,
  handleLogout,
  onOpenMemories,
  onOpenProfile,
}) => {
  return (
    <header className="h-14 border-b border-base-300 bg-base-100 flex items-center justify-between px-5 shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <span className="text-lg font-semibold tracking-tight">Agent Forge</span>
      </div>

      <div className="flex items-center gap-2">
        {isLoggedIn ? (
          <>
            <button
              onClick={onOpenMemories}
              className="btn btn-ghost btn-sm text-sm font-normal gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                <path d="M12 2a5 5 0 015 5v1a5 5 0 01-10 0V7a5 5 0 015-5z" />
                <path d="M21 21v-1a7 7 0 00-7-7h-4a7 7 0 00-7 7v1" />
              </svg>
              Memories
            </button>
            <button
              onClick={onOpenProfile}
              className="btn btn-ghost btn-sm text-sm font-normal gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                <path d="M12 15V3m0 12l-4-4m4 4l4-4" />
                <path d="M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" />
              </svg>
              Profile
            </button>
            <div className="w-px h-6 bg-base-300 mx-1" />
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded-lg hover:bg-base-200 transition-colors">
                <div className="w-7 h-7 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-semibold">
                  {userId.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium">{userId}</span>
              </div>
              <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-xl z-[1] mt-2 w-44 p-1.5 shadow-lg border border-base-300">
                <li>
                  <button onClick={handleLogout} className="text-sm text-error">
                    Sign out
                  </button>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => (document.getElementById("login_modal") as any)?.showModal()}
          >
            Sign in
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
