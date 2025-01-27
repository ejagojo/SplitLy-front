import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

/**
 * InteractiveMessenger page:
 * - Fetches items from the newly generated link (token).
 * - Displays items so the user can “claim” them by specifying their name.
 * - Sends a POST to /api/receipt/claim-item for each item claimed,
 *   then updates the local item list with the newly claimedBy field.
 * - On successful assignment, the user can proceed to final calculation.
 */
export default function InteractiveMessenger() {
  const { token } = useParams(); // The unique token from the URL
  const [items, setItems] = useState([]);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // 1) Fetch receipt data using the token
  useEffect(() => {
    axios
      .get(`/api/receipt/messenger/${token}`)
      .then((response) => {
        setItems(response.data.items);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load receipt data. Please try again.");
        setLoading(false);
      });
  }, [token]);

  // 2) Claim an item for the current username
  const handleClaimItem = (itemId) => {
    if (!username) {
      alert("Please enter your name before claiming an item!");
      return;
    }

    axios
      .post("/api/receipt/claim-item", {
        token,
        itemId,
        claimedBy: username,
      })
      .then((response) => {
        // Update the items array with the newly claimed item
        setItems(response.data.updatedItems);
      })
      .catch(() => {
        alert("Failed to claim item. Please try again.");
      });
  };

  // 3) When done, navigate to final calculation or a summary page
  const handleSubmitAssignments = () => {
    // In real usage, you might do additional checks or direct to a custom route
    navigate("/final-calculation");
  };

  // Render states: Loading, Error, or the main content
  if (loading) {
    return <p className="pt-28 px-6">Loading receipt data...</p>;
  }

  if (error) {
    return <p className="pt-28 px-6 text-red-500">{error}</p>;
  }

  return (
    <div className="pt-28 px-6 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <h1 className="text-2xl font-bold mb-4">Interactive Messenger</h1>
      <p className="text-gray-600 mb-6">
        Assign your items from the receipt below.
      </p>

      {/* User’s display name input */}
      <div className="bg-white shadow p-5 rounded mb-6">
        <label className="block text-gray-700 font-bold mb-2">Your Name:</label>
        <input
          className="border border-gray-300 rounded p-2 w-full md:w-1/2"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g., John"
        />
      </div>

      {/* Items list with claim buttons */}
      <div className="bg-white shadow p-5 rounded mb-6">
        <h2 className="text-lg font-bold mb-2">Items</h2>
        <p className="text-gray-600 mb-4">Click on an item to claim it.</p>
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => handleClaimItem(item.id)}
              className={`p-3 text-left rounded border ${
                item.claimedBy
                  ? "border-green-400 bg-green-50"
                  : "border-gray-300 bg-gray-50"
              } hover:bg-green-100 transition relative`}
            >
              <span className="block font-bold">{item.name}</span>
              <span className="text-sm text-gray-600">
                ${item.price.toFixed(2)}
              </span>
              {item.claimedBy && (
                <span className="text-green-700 text-sm absolute right-2 top-2 font-semibold">
                  Claimed by {item.claimedBy}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Submit button to proceed */}
      <div className="text-right">
        <button
          onClick={handleSubmitAssignments}
          className="py-2 px-6 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition"
        >
          Submit Assignments
        </button>
      </div>
    </div>
  );
}
