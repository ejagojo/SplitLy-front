import { Link } from "react-router-dom";

/**
 * Updated Navbar to be fixed at the top. 
 * We add padding at the top of the main content (see App.jsx) 
 * to avoid overlap with the Dashboard header.
 */
export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-primary text-secondary shadow-md">
      {/* Container for nav content */}
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-bold">
          SplitLy
        </h1>

        <nav className="space-x-6">
          <Link to="/login" className="hover:text-accent transition-colors">
            Login
          </Link>
          <Link to="/signup" className="hover:text-accent transition-colors">
            Sign Up
          </Link>
        </nav>
      </div>
    </header>
  );
}
