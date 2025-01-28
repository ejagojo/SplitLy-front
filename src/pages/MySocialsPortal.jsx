/**
 * File: /src/pages/MySocialsPortal.jsx
 *
 * Enhanced UI layout for your “My Socials!” portal. Instead of displaying the full raw URL,
 * each card now shows a fun, branded label (e.g., “Open Venmo” or “Pay with PayPal”) that
 * links to the actual URL. The rest of the design elements and animations remain for a
 * polished, distinctive user experience.
 */

import React from "react";
import { useParams } from "react-router-dom";

/**
 * MySocialsPortal:
 * - Displays a read-only “My Socials!” page based on localStorage data + :portalId route.
 * - If the local ID doesn’t match or no links exist, shows a friendly fallback message.
 * - Cards are more "brand-like" now, offering a single clickable label instead of the raw link.
 */
export default function MySocialsPortal() {
  const { portalId } = useParams();

  // Local data:
  const storedSocialsId = localStorage.getItem("mySocialsId") || "";
  const storedJSON = localStorage.getItem("connectedAccounts");

  let parsedLinks = {
    venmo: "",
    zelle: "",
    paypal: "",
    cashapp: ""
  };
  if (storedJSON) {
    try {
      parsedLinks = JSON.parse(storedJSON);
    } catch {
      parsedLinks = {
        venmo: "",
        zelle: "",
        paypal: "",
        cashapp: ""
      };
    }
  }

  // Confirm the route param matches the local ID
  const isMatch = portalId === storedSocialsId;

  // Extract only the services with non-empty links
  const linkEntries = Object.entries(parsedLinks).filter(
    ([, url]) => url.trim().length > 0
  );

  // If mismatch or nothing to show
  if (!isMatch || linkEntries.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-100 via-gray-200 to-gray-300">
        <div className="bg-white p-8 rounded shadow text-center max-w-md mx-auto animate-[pulse_1.5s_ease_in_out_infinite]">
          <h1 className="text-2xl font-bold mb-4 text-red-600">My Socials!</h1>
          <p className="text-gray-700 mb-4">
            This link is either invalid or there are no payment links set up.
          </p>
          <p className="text-gray-500 italic">Please check the link and try again.</p>
        </div>
      </div>
    );
  }

  // A small helper to produce a brand-like label for each service
  const brandLabel = {
    venmo: "Open Venmo",
    zelle: "Send via Zelle",
    paypal: "Pay with PayPal",
    cashapp: "Go to Cash App"
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-100 via-white to-indigo-50 px-6 pt-28 relative">
      {/* Optional decorative background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-[60%] w-80 h-80 rounded-full bg-purple-300 opacity-30 animate-[ping_20s_linear_infinite]" />
        <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-pink-300 opacity-40 animate-[bounce_12s_infinite]" />
      </div>

      <div className="relative bg-white p-8 rounded shadow max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-extrabold text-indigo-700 mb-4 drop-shadow-sm">
          My Socials!
        </h1>
        <p className="text-gray-600 mb-8 text-lg max-w-xl mx-auto">
          Welcome! Below are the user’s connected payment methods for easy sending.
        </p>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {linkEntries.map(([service, link]) => (
            <div
              key={service}
              className="group border rounded p-5 bg-gradient-to-r from-gray-50 to-white hover:shadow-xl transition flex flex-col items-center"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-2 capitalize group-hover:text-indigo-600 transition">
                {service}
              </h2>

              {/* Instead of showing the raw link, show a branded button-like label */}
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-indigo-100 text-indigo-600 py-2 px-4 rounded font-bold text-sm uppercase tracking-wide shadow-sm hover:shadow-lg hover:bg-indigo-200 transition-transform transform group-hover:scale-105"
              >
                {brandLabel[service] || "Open Link"}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
