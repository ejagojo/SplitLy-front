import { Link } from "react-router-dom";

/**
 * Dashboard page with an enhanced header, 
 * additional content, and improved spacing 
 * to avoid collision with the fixed Navbar.
 * 
 * Updated button classes so they have a non-white
 * background color and visible text.
 */
export default function Dashboard() {
  return (
    <div className="min-h-screen pt-28 px-6 bg-gradient-to-b from-gray-50 to-gray-100">
      {/**
       * We use pt-28 to ensure the dashboard content 
       * doesn't collide with the fixed Navbar. 
       * This accommodates the Navbar’s height plus 
       * extra breathing room.
       */}
      <header className="bg-primary text-white p-5 rounded shadow flex flex-col gap-2 md:flex-row md:justify-between md:items-center">
        <h1 className="text-2xl font-bold">SplitLy Dashboard</h1>
        <Link
          to="/login"
          className="text-white underline hover:text-accent transition"
        >
          Log Out
        </Link>
      </header>

      <main className="mt-8">
        <h2 className="text-xl font-semibold mb-4">
          What would you like to do?
        </h2>
        <div className="grid gap-4 mb-8 md:grid-cols-3">
          {/* 
            Buttons now have a clearly distinct background color 
            and white text, so they're easy to see.
          */}
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
