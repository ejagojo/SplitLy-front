/***************************************
 * File: Dashboard.jsx
 * Location: /src/pages/Dashboard.jsx
 * 
 * Changes Made:
 * 1. Added a subtle rotating/pulsing shape 
 *    behind the main dashboard area for consistency 
 *    with the Home page’s animated feel.
 * 2. Retained the gradient background from gray-50 
 *    to gray-100 as requested.
 ***************************************/

import { Link } from "react-router-dom";

/**
 * Dashboard page with an enhanced header, 
 * additional content, and improved spacing 
 * to avoid collision with the fixed Navbar.
 * 
 * Now includes a rotating shape for a more "alive" design.
 */
export default function Dashboard() {
  return (
    <div className="relative min-h-screen pt-28 px-6 bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Animated background shape */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-300 rounded-full opacity-20 animate-[spin_30s_linear_infinite]" />
      </div>

      <header className="bg-primary text-white p-5 rounded shadow flex flex-col gap-2 md:flex-row md:justify-between md:items-center relative z-10">
        <h1 className="text-2xl font-bold">SplitLy Dashboard</h1>
        <Link
          to="/login"
          className="text-white underline hover:text-accent transition"
        >
          Log Out
        </Link>
      </header>

      <main className="mt-8 relative z-10">
        <h2 className="text-xl font-semibold mb-4">
          What would you like to do?
        </h2>
        <div className="grid gap-4 mb-8 md:grid-cols-3">
          <Link
            to="/receipt/upload"
            className="p-4 bg-blue-600 text-white font-semibold rounded shadow hover:bg-blue-700 transition text-center"
          >
            Upload Receipt
          </Link>
          <Link
            to="/receipt/history"
            className="p-4 bg-blue-600 text-white font-semibold rounded shadow hover:bg-blue-700 transition text-center"
          >
            View Recent Splits
          </Link>
          <Link
            to="/payments/accounts"
            className="p-4 bg-blue-600 text-white font-semibold rounded shadow hover:bg-blue-700 transition text-center"
          >
            Connected Accounts
          </Link>
        </div>

        {/* Extra content: Quick stats or tips */}
        <section className="bg-white p-5 rounded shadow mb-8">
          <h3 className="text-lg font-bold mb-2">Quick Stats</h3>
          <p className="text-gray-700 mb-2">
            Here you can view a summary of your recent activities:
          </p>
          <ul className="list-disc list-inside text-gray-600">
            <li>3 new receipts pending analysis</li>
            <li>2 friends recently joined your SplitLy group</li>
            <li>Saved over $50 in shared discounts last week</li>
          </ul>
        </section>

        {/* Extra content: Some tips or announcements */}
        <section className="bg-white p-5 rounded shadow">
          <h3 className="text-lg font-bold mb-2">Announcements</h3>
          <p className="text-gray-700">
            Check out our new feature: Real-time item assignment in the Interactive Messenger!
            Stay tuned for upcoming integrations with new payment providers.
          </p>
        </section>
      </main>
    </div>
  );
}
