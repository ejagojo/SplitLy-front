/***************************************
 * File: Signup.jsx
 * Location: /src/pages/Signup.jsx
 * 
 * Changes Made:
 * 1. Added a floating background shape 
 *    to maintain an animated, lively design.
 * 2. Preserved the original sign-up logic.
 ***************************************/

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../services/firebase";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (error) {
      alert("Signup failed: " + error.message);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-100 to-gray-300 overflow-hidden">
      {/* Animated background shape */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[30%] left-[60%] w-80 h-80 bg-blue-500 rounded-full opacity-20 animate-[spin_25s_linear_infinite]" />
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md z-10">
        <h1 className="text-xl font-semibold mb-6">Sign up for SplitLy</h1>
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
        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full p-3 mb-4 border border-gray-300 rounded"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button
          onClick={handleSignup}
          className="w-full p-3 bg-primary text-secondary rounded hover:bg-gray-800"
        >
          Sign Up
        </button>
        <p className="text-center mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-accent underline">
            Log in here!
          </Link>
        </p>
      </div>
    </div>
  );
}
