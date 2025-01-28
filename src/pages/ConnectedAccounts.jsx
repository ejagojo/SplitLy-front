/**
 * File: /src/pages/ConnectedAccounts.jsx
 */

import React, { useState, useEffect } from "react";

/**
 * ConnectedAccounts page:
 * - Lets users see or link their payment accounts for easier splitting.
 * - Users can now provide a Venmo link, which is stored locally in this example.
 * - Additional services can be added in the same style for uniformity.
 */
export default function ConnectedAccounts() {
  // Track user’s Venmo link input
  const [venmoLink, setVenmoLink] = useState("");
  // Displayed state after “saving” the link
  const [savedVenmoLink, setSavedVenmoLink] = useState("");

  /**
   * On mount, retrieve any previously saved Venmo link (e.g. from localStorage).
   * In a real app, you might store this in Firestore or a secure backend instead.
   */
  useEffect(() => {
    const storedLink = localStorage.getItem("userVenmoLink");
    if (storedLink) {
      setSavedVenmoLink(storedLink);
      setVenmoLink(storedLink);
    }
  }, []);

  /**
   * handleSaveVenmoLink: Save the user’s Venmo link in localStorage (or a real backend)
   */
  const handleSaveVenmoLink = () => {
    if (!venmoLink.trim()) {
      alert("Please enter a valid Venmo link.");
      return;
    }
    localStorage.setItem("userVenmoLink", venmoLink.trim());
    setSavedVenmoLink(venmoLink.trim());
    alert("Venmo link saved successfully!");
  };

  return (
    <div className="min-h-screen pt-28 px-6 bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-white rounded shadow p-5">
        <h1 className="text-2xl font-bold mb-2">Connected Accounts</h1>
        <p className="text-gray-600">
          Manage or link your payment accounts for easier splitting.
        </p>
      </header>

      <main className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Existing (or future) linked accounts */}
        <section className="bg-white p-5 rounded shadow">
          <h2 className="text-lg font-bold mb-4">Your Linked Accounts</h2>
          <ul className="list-inside list-disc text-gray-700 space-y-2">
            {/* Show Venmo link if saved */}
            {savedVenmoLink ? (
              <li>
                Venmo:{" "}
                <a
                  href={savedVenmoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-700"
                >
                  {savedVenmoLink}
                </a>
              </li>
            ) : (
              <li>Venmo - not linked</li>
            )}

            {/* Placeholder for other accounts (Zelle, etc.) */}
            <li>Zelle - not linked</li>
          </ul>
        </section>

        {/* Placeholder for linking new accounts */}
        <section className="bg-white p-5 rounded shadow">
          <h2 className="text-lg font-bold mb-4">Link a New Account</h2>
          <p className="text-gray-600 mb-4">
            Enter your Venmo link or connect with other payment services below.
          </p>

          {/* Venmo link input & save button */}
          <div className="mb-4">
            <label className="block font-medium text-gray-700 mb-1">
              Venmo Link
            </label>
            <input
              type="text"
              placeholder="e.g. https://venmo.com/YourUsername"
              className="w-full bg-purple-50 border border-purple-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={venmoLink}
              onChange={(e) => setVenmoLink(e.target.value)}
            />
            <button
              onClick={handleSaveVenmoLink}
              className="mt-2 py-2 px-4 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition"
            >
              Save Venmo Link
            </button>
          </div>

          {/* Example action buttons for new connections */}
          <div className="flex flex-col gap-3 mt-6">
            <button className="py-2 px-4 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition">
              Connect Zelle
            </button>
            <button className="py-2 px-4 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition">
              Connect PayPal
            </button>
            <button className="py-2 px-4 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition">
              Connect Cash App
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
