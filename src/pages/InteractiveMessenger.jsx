import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid"; // Used to generate unique link tokens
import { useNavigate } from "react-router-dom";

/**
 * InteractiveMessenger component:
 * - Simulates a sharable link generation for group members
 * - Displays a list of items for participants to claim
 * - Allows each user to enter their name and claim items
 * - In a real-world app, you'd fetch items from the backend
 *   and post updates whenever someone claims an item
 * - We use a minimal chat-like display to show item claims
 *   as if participants are "messaging" the group
 * 
 * Dependencies:
 * 1. "uuid" for generating a mock link token (npm install uuid)
 * 2. If you want real-time updates, you'd integrate with a
 *    backend (e.g., WebSocket or polling).
 */

export default function InteractiveMessenger() {
  // Sample items that might have come from your receipt analysis
  const [items, setItems] = useState([
    { id: 1, name: "Pasta", price: 12.0, claimedBy: null },
    { id: 2, name: "Salad", price: 8.0, claimedBy: null },
    { id: 3, name: "Soda", price: 3.0, claimedBy: null },
  ]);

  // Input states
  const [username, setUsername] = useState("");
  const [groupLink, setGroupLink] = useState("");
  const navigate = useNavigate();

  /**
   * Generates a shareable link simulating a unique token.
   * In a real app, you'd likely have your backend generate
   * a unique ID for the messenger session, e.g.,
   * https://myapp.com/messenger/abc123
   */
  const handleGenerateLink = () => {
    const uniqueToken = uuidv4();
    // In a real project, store this token in the backend
    // so participants can load the correct items/receipt
    const shareLink = `https://myapp.com/interactive-messenger/${uniqueToken}`;
    setGroupLink(shareLink);
  };

  /**
   * Simulate claiming an item by the current user.
   * We simply update the item’s "claimedBy" field.
   */
  const handleClaimItem = (itemId) => {
    if (!username) {
      alert("Please enter your name before claiming an item!");
      return;
    }
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? { ...it, claimedBy: it.claimedBy ? it.claimedBy : username }
          : it
      )
    );
  };

  /**
   * Finish assignment and navigate to final calculation
   * or receipt analysis (depending on your flow).
   */
  const handleSubmitAssignments = () => {
    // In a real scenario, you’d call the backend to store these claims
    // Then redirect to a different page for final calculations
    navigate("/final-calculation");
  };

  return (
    <div className="pt-28 px-6 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <h1 className="text-2xl font-bold mb-4">Interactive Messenger</h1>
      <p className="text-gray-600 mb-6">
        Share this link with friends to claim items. Enter your name below, then
        click on an item to claim it.
      </p>

      {/* Generate/Display Group Link */}
      <div className="bg-white shadow p-5 rounded mb-6">
        <h2 className="text-lg font-bold mb-2">Group Link</h2>
        {groupLink ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="border border-gray-300 rounded p-2 w-full md:w-auto flex-1"
              value={groupLink}
              onChange={() => {}}
              readOnly
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(groupLink);
                alert("Link copied to clipboard!");
              }}
              className="py-2 px-4 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition"
            >
              Copy
            </button>
          </div>
        ) : (
          <button
            onClick={handleGenerateLink}
            className="py-2 px-4 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition"
          >
            Generate Group Link
          </button>
        )}
      </div>

      {/* Username Input */}
      <div className="bg-white shadow p-5 rounded mb-6">
        <label className="block text-gray-700 font-bold mb-2">
          Your Name:
        </label>
        <input
          className="border border-gray-300 rounded p-2 w-full md:w-1/2"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g., John"
        />
      </div>

      {/* Item Assignment UI */}
      <div className="bg-white shadow p-5 rounded mb-6">
        <h2 className="text-lg font-bold mb-2">Items to Claim</h2>
        <p className="text-gray-600 mb-4">Click an item to claim it.</p>
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => handleClaimItem(item.id)}
              className={`p-3 text-left rounded border 
                ${item.claimedBy ? "border-green-400 bg-green-50" : "border-gray-300 bg-gray-50"}
                hover:bg-green-100 transition relative`}
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

      {/* Submit Assignments Button */}
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
