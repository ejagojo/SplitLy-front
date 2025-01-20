import React from "react";

/**
 * ConnectedAccounts page:
 * - Consistent gradient background
 * - Top padding (pt-28) to avoid collision with fixed Navbar
 * - Matching heading and layout style
 */
export default function ConnectedAccounts() {
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
            <li>Venmo - linked</li>
            <li>Zelle - not linked</li>
          </ul>
        </section>

        {/* Placeholder for linking new accounts */}
        <section className="bg-white p-5 rounded shadow">
          <h2 className="text-lg font-bold mb-4">Link a New Account</h2>
          <p className="text-gray-600 mb-4">
            Choose a payment provider to link with your SplitLy profile.
          </p>
          <div className="flex flex-col gap-3">
            {/* Example action buttons for new connections */}
            <button className="py-2 px-4 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition">
              Connect Venmo
            </button>
            <button className="py-2 px-4 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition">
              Connect Zelle
            </button>
            <button className="py-2 px-4 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition">
              Connect PayPal
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
