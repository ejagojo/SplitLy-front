/**
 * File: /src/pages/ConnectedAccounts.jsx
 */

import React, { useState, useEffect } from "react";

/**
 * ConnectedAccounts page:
 * - A customizable UI for linking Venmo, Zelle, PayPal, and Cash App.
 * - Each service is presented as a "card" for linking/unlinking, persisted in localStorage (or a backend for production).
 * - A “My Socials!” section (similar to a linktree, but re-branded) lets users share all payment methods in one place.
 * - Designed for large-scale production use.
 */
export default function ConnectedAccounts() {
  // Service links stored in localStorage
  const [serviceLinks, setServiceLinks] = useState({
    venmo: "",
    zelle: "",
    paypal: "",
    cashapp: ""
  });

  // Whether to show the “My Socials!” details in this UI
  const [showSocials, setShowSocials] = useState(false);

  // A unique "Socials ID" for demonstration — in production, you'd likely store this server-side
  const [socialsId, setSocialsId] = useState("");

  // On mount, load existing data from localStorage + set up a unique ID
  useEffect(() => {
    // Load links
    const storedJSON = localStorage.getItem("connectedAccounts");
    if (storedJSON) {
      try {
        const parsed = JSON.parse(storedJSON);
        setServiceLinks({
          venmo: parsed.venmo || "",
          zelle: parsed.zelle || "",
          paypal: parsed.paypal || "",
          cashapp: parsed.cashapp || ""
        });
      } catch (err) {
        console.warn("Error parsing connectedAccounts from localStorage:", err);
      }
    }

    // Assign or retrieve a local "Socials" ID
    let storedSocialsId = localStorage.getItem("mySocialsId");
    if (!storedSocialsId) {
      storedSocialsId = `socials-${Math.random().toString(36).substr(2, 8)}`;
      localStorage.setItem("mySocialsId", storedSocialsId);
    }
    setSocialsId(storedSocialsId);
  }, []);

  /**
   * updateServiceLink: update local state for a particular service
   */
  const updateServiceLink = (service, value) => {
    setServiceLinks((prev) => ({ ...prev, [service]: value }));
  };

  /**
   * Friendly name
   */
  const serviceName = (key) => key.charAt(0).toUpperCase() + key.slice(1);

  /**
   * saveServiceLink: persist one service link to localStorage
   */
  const saveServiceLink = (service) => {
    const linkValue = (serviceLinks[service] || "").trim();
    if (!linkValue) {
      alert(`Please enter a valid link for ${serviceName(service)}.`);
      return;
    }
    const updated = { ...serviceLinks, [service]: linkValue };
    localStorage.setItem("connectedAccounts", JSON.stringify(updated));
    setServiceLinks(updated);
    alert(`${serviceName(service)} link saved successfully!`);
  };

  /**
   * removeServiceLink: remove a link for a particular service
   */
  const removeServiceLink = (service) => {
    const updated = { ...serviceLinks, [service]: "" };
    localStorage.setItem("connectedAccounts", JSON.stringify(updated));
    setServiceLinks(updated);
    alert(`${serviceName(service)} link removed.`);
  };

  /**
   * toggleShowSocials: show/hide the “My Socials!” panel
   */
  const toggleShowSocials = () => {
    setShowSocials((prev) => !prev);
  };

  /**
   * copySocialsText: copy a text-based summary of the user’s linked services
   */
  const copySocialsText = async () => {
    let text = `Welcome to My Socials! (ID: ${socialsId})\n\n`;
    const anyLinked = Object.values(serviceLinks).some((val) => val.trim());
    if (!anyLinked) {
      text += "I currently have no payment links connected.";
    } else {
      if (serviceLinks.venmo) text += `Venmo: ${serviceLinks.venmo}\n`;
      if (serviceLinks.zelle) text += `Zelle: ${serviceLinks.zelle}\n`;
      if (serviceLinks.paypal) text += `PayPal: ${serviceLinks.paypal}\n`;
      if (serviceLinks.cashapp) text += `Cash App: ${serviceLinks.cashapp}\n`;
    }
    try {
      await navigator.clipboard.writeText(text);
      alert("Your Socials info has been copied to the clipboard!");
    } catch (err) {
      console.error("Failed to copy socials info:", err);
      alert("Unable to copy My Socials info to clipboard.");
    }
  };

  /**
   * getSocialsPortalLink: a shareable link that others can open to see these payment methods
   * In production, you'd have a dedicated route or hosted page for this.
   */
  const getSocialsPortalLink = () => {
    return `${window.location.origin}/mysocials/${socialsId}`;
  };

  // Basic UI config
  const servicesConfig = [
    {
      key: "venmo",
      label: "Venmo",
      color: "bg-blue-50",
      placeholder: "e.g. https://venmo.com/YourUsername"
    },
    {
      key: "zelle",
      label: "Zelle",
      color: "bg-purple-50",
      placeholder: "e.g. (Your Zelle link or instructions)"
    },
    {
      key: "paypal",
      label: "PayPal",
      color: "bg-yellow-50",
      placeholder: "e.g. https://paypal.me/YourUsername"
    },
    {
      key: "cashapp",
      label: "Cash App",
      color: "bg-green-50",
      placeholder: "e.g. https://cash.app/$YourCashtag"
    }
  ];

  // Check if user has anything linked
  const anyLinked = Object.values(serviceLinks).some((val) => val.trim());

  return (
    <div className="min-h-screen pt-28 px-6 bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white rounded shadow p-5">
        <h1 className="text-2xl font-bold mb-2">Connected Accounts</h1>
        <p className="text-gray-600">
          Manage or link your payment accounts for easier splitting, or share them via your personal “My Socials!” link.
        </p>
      </header>

      <main className="mt-8 grid gap-6">
        {/* Current Links */}
        <section className="bg-white p-5 rounded shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Your Linked Accounts</h2>
            <button
              onClick={toggleShowSocials}
              className="py-2 px-4 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 transition"
            >
              {showSocials ? "Hide My Socials!" : "Show My Socials!"}
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            {anyLinked
              ? "Click 'Remove' to unlink any service."
              : "You have no links yet. Add some below!"}
          </p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {servicesConfig.map((svc) => {
              const link = serviceLinks[svc.key];
              const isLinked = !!link;
              return (
                <div
                  key={svc.key}
                  className={`border rounded p-4 ${svc.color} hover:shadow transition`}
                >
                  <h3 className="text-md font-semibold text-gray-800 mb-1">
                    {svc.label}
                  </h3>
                  {isLinked ? (
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-gray-700 break-all">
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline hover:text-blue-700"
                        >
                          {link}
                        </a>
                      </p>
                      <button
                        onClick={() => removeServiceLink(svc.key)}
                        className="mt-2 py-1 px-3 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition self-start"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Not linked</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Add/Update */}
        <section className="bg-white p-5 rounded shadow">
          <h2 className="text-lg font-bold mb-4">Add or Update Services</h2>
          <p className="text-gray-600 mb-4">
            Enter your usernames or links below. These will appear in your “My Socials!” snippet.
          </p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {servicesConfig.map((svc) => (
              <div
                key={svc.key}
                className="border rounded p-4 bg-gray-50 hover:shadow transition"
              >
                <h3 className="text-md font-semibold text-gray-700 mb-1">
                  {svc.label}
                </h3>
                <input
                  type="text"
                  placeholder={svc.placeholder}
                  className="w-full bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
                  value={serviceLinks[svc.key]}
                  onChange={(e) => updateServiceLink(svc.key, e.target.value)}
                />
                <button
                  onClick={() => saveServiceLink(svc.key)}
                  className="mt-2 py-1 px-3 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition self-start"
                >
                  Save
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* My Socials */}
        {showSocials && (
          <section className="bg-white p-5 rounded shadow">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
              <div>
                <h2 className="text-lg font-bold">My Socials!</h2>
                <p className="text-gray-600 text-sm">
                  Share this page to let others see how to send you money.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={copySocialsText}
                  className="py-2 px-4 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition"
                >
                  Copy My Socials Info
                </button>
                <button
                  onClick={() =>
                    navigator.clipboard
                      .writeText(getSocialsPortalLink())
                      .then(() => alert("My Socials! portal link copied!"))
                      .catch((err) => {
                        console.error("Failed to copy link:", err);
                        alert("Unable to copy My Socials portal link.");
                      })
                  }
                  className="py-2 px-4 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 transition"
                >
                  Copy Portal Link
                </button>
              </div>
            </div>

            <div className="bg-gray-50 border rounded p-4 text-sm">
              <p className="mb-2 font-semibold text-gray-700">
                Share this personal “My Socials!” portal link:
              </p>
              <a
                href={getSocialsPortalLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline break-all hover:text-blue-700"
              >
                {getSocialsPortalLink()}
              </a>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {servicesConfig.map((svc) => {
                const link = serviceLinks[svc.key];
                if (!link) return null;
                return (
                  <div
                    key={svc.key}
                    className={`border rounded p-4 ${svc.color} hover:shadow transition`}
                  >
                    <h3 className="text-md font-semibold text-gray-800 mb-2">
                      {svc.label}
                    </h3>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-blue-600 underline hover:text-blue-700 break-all"
                    >
                      {link}
                    </a>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
