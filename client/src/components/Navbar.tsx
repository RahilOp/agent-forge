import React from "react";

interface NavbarProps {
  userId: string;
  isLoggedIn: boolean;
  handleLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ userId, isLoggedIn, handleLogout }) => {
  return (
    <div className="navbar flex justify-between bg-base-200 shadow-xl">
      <div className="flex-1 flex items-center">
        <a href="/" className="btn btn-ghost text-xl">
          ChatAgent
        </a>
      </div>

      <div className="flex-none gap-2">
        {isLoggedIn ? (
          <div className="flex items-center gap-3">
            <span className="font-medium">{userId}</span>
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle avatar"
              >
                <div className="w-10 rounded-full bg-neutral text-neutral-content flex items-center justify-center">
                  <span className="text-lg">{userId.charAt(0).toUpperCase()}</span>
                </div>
              </div>
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
              >
                <li>
                  <span className="font-bold">User: {userId}</span>
                </li>
                <li>
                  <button onClick={handleLogout}>Logout</button>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <button
            className="btn btn-neutral"
            onClick={() =>
              (document.getElementById("login_modal") as any)?.showModal()
            }
          >
            Login
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;
