import { Link } from "react-router-dom";
/* 
  We import react-icons for small button icons 
  that enhance the interface.
*/
import { FiLogIn, FiUserPlus } from "react-icons/fi";

/**
 * Updated Home component:
 * - Slightly smaller, more mobile-friendly buttons
 * - Icons to make the interface more lively
 * - Subtle hover and entrance animations for a more polished appearance
 */
export default function Home() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center overflow-hidden">
      {/* 
        We add a simple floating shape or gradient background if you'd like.
        The main background animation is handled by body in your index.css,
        but here's an optional extra shape or overlay. 
      */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Translucent radial gradient shape in top-left corner */}
        <div className="absolute top-[-10%] left-[-20%] w-96 h-96 bg-purple-300 rounded-full opacity-30 animate-pulse" />
        {/* Another shape in bottom-right corner */}
        <div className="absolute bottom-[-10%] right-[-20%] w-80 h-80 bg-pink-300 rounded-full opacity-30 animate-pulse delay-1000" />
      </div>

      {/* Main content */}
      <div className="z-10 px-4 py-8 max-w-md w-full">
        {/* Animated heading: fade/scale in */}
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-primary animate-fadeInUp">
          Welcome to SplitLy
        </h1>
        <p className="text-base md:text-lg text-gray-600 mb-8">
          Simplify group expenses. Upload receipts, assign items, and settle payments easily!
        </p>

        {/* Buttons with icons, smaller sizing, strong visual contrast */}
        <div className="flex flex-col gap-3 w-full">
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 py-2 px-4 bg-primary text-white text-md md:text-lg rounded hover:bg-gray-800 transition"
          >
            <FiLogIn className="text-lg" />
            Log In
          </Link>
          <Link
            to="/signup"
            className="flex items-center justify-center gap-2 py-2 px-4 bg-blue-500 text-white text-md md:text-lg rounded hover:bg-blue-600 transition"
          >
            <FiUserPlus className="text-lg" />
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
