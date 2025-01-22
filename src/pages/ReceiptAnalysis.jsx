/*****************************************
 * File: ReceiptAnalysis.jsx
 * Location: /src/pages/ReceiptAnalysis.jsx
 *
 * Changes Made:
 * 1. Removed the placeholder text under the main heading.
 * 2. Added integration points for the interactive messenger 
 *    (“Generate Messenger Link”) and final cost breakdown 
 *    (“Calculate Final Breakdown”) buttons.
 * 3. Displays a read-only table of the final breakdown returned 
 *    from the backend, showing each user’s owed amount.
 * 4. Preserved existing separation of normal items vs. summary items 
 *    (Tax, Tip, Total, etc.).
 *****************************************/

import React, { useState, useEffect } from "react";

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ORIGINAL HELPER FUNCTIONS (commented out for reference)
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// function extractRelevantLines(ocrText) { ... }
// function parseItemLine(line) { ... }

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// New helper: separate items from summary by checking item.name
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function separateSummaryFromItems(allItems) {
  const summaryKeywords = ["Tax", "Tip", "Subtotal", "Total", "Summary Item"];
  const normalItems = [];
  const summaryItems = [];

  allItems.forEach((item) => {
    // If the name indicates a summary element, we put it in summaryItems
    if (
      summaryKeywords.some((keyword) =>
        item.name.toLowerCase().includes(keyword.toLowerCase())
      )
    ) {
      summaryItems.push(item);
    } else {
      normalItems.push(item);
    }
  });

  return { normalItems, summaryItems };
}

export default function ReceiptAnalysis() {
  // We track two arrays: items vs. summary
  const [items, setItems] = useState([]);      // Normal items
  const [summary, setSummary] = useState([]);  // Summary lines/items

  // For final cost breakdown after calculations
  const [finalBreakdown, setFinalBreakdown] = useState([]);

  // Shareable link for the interactive messenger
  const [messengerLink, setMessengerLink] = useState("");

  useEffect(() => {
    // 1) Check if structured items exist in localStorage
    const storedItemsJSON = localStorage.getItem("receiptItems");

    // 2) If found, parse them and separate
    if (storedItemsJSON) {
      try {
        const parsedAllItems = JSON.parse(storedItemsJSON);
        const { normalItems, summaryItems } = separateSummaryFromItems(
          parsedAllItems
        );
        setItems(normalItems);
        setSummary(summaryItems);
        return;
      } catch (error) {
        console.warn("Error parsing stored receiptItems:", error);
      }
    }

    // 3) Otherwise, we fallback to the original raw-text approach 
    //    (commented out). We are now focusing on item arrays.
    /*
    const rawText = localStorage.getItem("receiptText");
    if (rawText) {
      const { itemLines, summaryLines } = extractRelevantLines(rawText);
      const parsedItems = itemLines.map((l) => parseItemLine(l));
      setItems(parsedItems);
      setSummary(summaryLines);
    }
    */
  }, []);

  /**
   * handleGenerateMessengerLink:
   * - Calls the backend to create or fetch a unique link for 
   *   the interactive messenger. In a real environment, 
   *   you'd send "items" and "summary" to store them server-side.
   */
  const handleGenerateMessengerLink = async () => {
    try {
      // Example request to backend, e.g. POST /api/messenger/link
      // Pass items and summary so the server can store them
      const requestBody = { items, summary };
      const response = await fetch("/api/receipt/generate-messenger-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        throw new Error("Failed to generate messenger link");
      }
      const data = await response.json();
      // Suppose the backend returns { messengerLink: "https://..." }
      setMessengerLink(data.messengerLink);
      alert("Messenger link generated successfully!");
    } catch (err) {
      console.error("Error generating messenger link:", err);
      alert("Failed to generate link. Please try again later.");
    }
  };

  /**
   * handleCalculateBreakdown:
   * - Calls the backend to compute how much each user owes, 
   *   including any tip/tax from the summary items. The server 
   *   can parse 'summary' to detect taxes/tips, then distribute 
   *   costs across users who claimed items.
   */
  const handleCalculateBreakdown = async () => {
    try {
      // Example request to backend, e.g. POST /api/receipt/final-breakdown
      // Body includes items and summary
      const requestBody = { items, summary };
      const response = await fetch("/api/receipt/final-breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        throw new Error("Failed to calculate breakdown");
      }
      const data = await response.json();
      // Suppose the backend returns something like:
      // [
      //   { userName: "Alice", totalOwed: 12.75 },
      //   { userName: "Bob", totalOwed: 8.50 }
      // ]
      setFinalBreakdown(data);
      alert("Final breakdown calculated!");
    } catch (err) {
      console.error("Error calculating final breakdown:", err);
      alert("Failed to calculate final breakdown. Please try again later.");
    }
  };

  return (
    <div className="pt-28 px-6 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Updated heading without the old placeholder text */}
      <h1 className="text-2xl font-bold mb-4">Receipt Breakdown</h1>

      {/* We only display the rest if we have items or summary */}
      {(items.length > 0 || summary.length > 0) && (
        <div className="bg-white p-5 rounded shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <span>🧾</span> Analyzed Receipt Details
          </h2>

          {/* Items table (read-only) */}
          {items.length > 0 && (
            <div className="mb-6 p-4 bg-purple-50 rounded border border-purple-200">
              <h3 className="text-md font-bold mb-2 text-purple-700 flex items-center gap-1">
                <span>🛒</span> Items
              </h3>
              <div className="overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-purple-100 text-purple-700 uppercase">
                      <th className="p-2 font-semibold">Qty</th>
                      <th className="p-2 font-semibold">Item</th>
                      <th className="p-2 font-semibold">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="border-b last:border-none">
                        <td className="p-2">
                          <div className="bg-purple-50 border border-purple-200 rounded px-2 py-1">
                            {item.qty}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="bg-purple-50 border border-purple-200 rounded px-2 py-1">
                            {item.name}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="bg-purple-50 border border-purple-200 rounded px-2 py-1">
                            {item.price}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Summary section (read-only) */}
          {summary.length > 0 && (
            <div className="p-4 bg-pink-50 rounded border border-pink-200">
              <h3 className="text-md font-bold mb-2 text-pink-700 flex items-center gap-1">
                <span>💰</span> Summary
              </h3>
              <div className="space-y-2 text-sm text-gray-800">
                {summary.map((summaryItem, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded bg-pink-100 border-l-4 border-pink-300"
                  >
                    <div className="flex-1 text-pink-700 font-semibold">
                      {/* e.g. "Tax $2.00" or "Total $35.00" */}
                      {`${summaryItem.name} ${summaryItem.price}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons for interactive messenger & final breakdown */}
          <div className="mt-6 flex flex-col md:flex-row gap-4">
            {/* Generate Messenger Link Button */}
            <button
              onClick={handleGenerateMessengerLink}
              className="px-5 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition"
            >
              Generate Messenger Link
            </button>

            {/* Calculate Final Breakdown Button */}
            <button
              onClick={handleCalculateBreakdown}
              className="px-5 py-3 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition"
            >
              Calculate Final Breakdown
            </button>
          </div>

          {/* Display the generated Messenger Link, if any */}
          {messengerLink && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
              <h4 className="text-md font-bold mb-2 text-blue-700">Messenger Link</h4>
              <p className="text-gray-700 break-all">{messengerLink}</p>
              <p className="text-sm text-gray-500">
                Share this link with others so they can claim items in the interactive messenger.
              </p>
            </div>
          )}

          {/* Display the final breakdown table, if we have data */}
          {finalBreakdown.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
              <h4 className="text-md font-bold mb-2 text-green-700">Final Cost Breakdown</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-green-100 text-green-700 uppercase">
                      <th className="p-2 font-semibold">Participant</th>
                      <th className="p-2 font-semibold">Amount Owed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finalBreakdown.map((person, i) => (
                      <tr key={i} className="border-b last:border-none">
                        <td className="p-2">
                          <div className="bg-green-50 border border-green-200 rounded px-2 py-1">
                            {person.userName}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="bg-green-50 border border-green-200 rounded px-2 py-1">
                            ${person.totalOwed.toFixed(2)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
