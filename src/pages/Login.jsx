import { useState } from "react";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../services/firebase";

/**
 * Login component that allows users to sign in with
 * email/password or Google, now with minor 
 * background animation for consistency.
 */
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Google Auth provider instance
  const googleProvider = new GoogleAuthProvider();

  // Handle email/password login
  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Google Sign-in successful. User:", result.user);
      navigate("/dashboard");
    } catch (error) {
      alert("Google login failed: " + error.message);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-100 to-gray-300 overflow-hidden">
      {/* Animated shape in background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-purple-300 rounded-full opacity-20 animate-pulse" />
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md z-10">
        <h1 className="text-xl font-semibold mb-6">Login to SplitLy</h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-4 border border-gray-300 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-4 border border-gray-300 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full p-3 bg-primary text-secondary rounded hover:bg-gray-800 mb-4"
        >
          Log In
        </button>

        <button
          onClick={handleGoogleLogin}
          className="w-full p-3 border border-gray-300 rounded hover:bg-gray-100 transition"
        >
          Sign in with Google
        </button>

        <p className="text-center mt-4">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-accent underline">
            Sign up here!
          </Link>
        </p>
      </div>
    </div>
  );
}
