/*****************************************
 * File: ReceiptAnalysis.jsx
 * Location: /src/pages/ReceiptAnalysis.jsx
 *
 * Changes Made:
 * 1. We now first check localStorage for a "receiptItems" array
 *    (as stored by UploadReceipt.jsx) and separate it into
 *    normal items vs. summary items (tax, tip, total, etc.).
 * 2. Preserved the original parse logic for reference, but
 *    commented it out so we no longer rely on splitting raw lines.
 * 3. Page remains read-only for demonstration while retaining
 *    the pastel-themed UI and placeholder text.
 *****************************************/

import React, { useState, useEffect } from "react";

/*
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ORIGINAL HELPER FUNCTIONS (commented out for reference)
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// 1) A quick helper to parse raw lines into items or summary:
function extractRelevantLines(ocrText) {
  const lines = ocrText.split("\n").map((l) => l.trim());
  const summaryRegex = /(tax|tip|total|subtotal|amount due|due|balance|paid|change)/i;
  const currencyRegex = /(\$|(\d+\.\d{2}))/;

  const itemLines = [];
  const summaryLines = [];

  lines.forEach((line) => {
    if (!line) return;

    // If line has "summary" keywords or is purely currency, treat as summary
    if (summaryRegex.test(line) || /^(?:.*\s+)?(\$?\d+\.\d{2})(?:\s.*)?$/.test(line)) {
      if (currencyRegex.test(line) || summaryRegex.test(line)) {
        summaryLines.push(line);
      }
    } else if (currencyRegex.test(line)) {
      itemLines.push(line);
    }
  });

  return { itemLines, summaryLines };
}

// 2) Helper to parse an item line into { qty, name, price }:
function parseItemLine(line) {
  let qty = "1";
  let name = line;
  let price = "";

  const qtyMatch = line.match(/^(\d+)\s+(.*)/);
  if (qtyMatch) {
    qty = qtyMatch[1];
    name = qtyMatch[2];
  }
  const priceMatch = name.match(/(\$?\d+\.\d{2})$/);
  if (priceMatch) {
    price = priceMatch[1];
    name = name.replace(price, "").trim();
  }

  return { qty, name: name || "Item", price: price || "$0.00" };
}
*/

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// New helper: separate items from summary by checking item.name
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function separateSummaryFromItems(allItems) {
  const summaryKeywords = ["Tax", "Tip", "Subtotal", "Total", "Summary Item"];
  const normalItems = [];
  const summaryItems = [];

  allItems.forEach((item) => {
    // If the name indicates a summary element, we put it in summaryItems
    if (summaryKeywords.some((keyword) => item.name.toLowerCase().includes(keyword.toLowerCase()))) {
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

  useEffect(() => {
    // 1) Check if structured items exist in localStorage
    const storedItemsJSON = localStorage.getItem("receiptItems");

    // 2) If found, we parse them and separate
    if (storedItemsJSON) {
      try {
        const parsedAllItems = JSON.parse(storedItemsJSON);
        const { normalItems, summaryItems } = separateSummaryFromItems(parsedAllItems);
        setItems(normalItems);
        setSummary(summaryItems);
        return;
      } catch (error) {
        console.warn("Error parsing stored receiptItems:", error);
      }
    }

    // 3) Otherwise, we fallback to using "receiptText" if it exists
    //    (original approach). We'll parse lines from raw text,
    //    then separate them. This code is commented out to preserve
    //    the new logic of reading from "receiptItems."
    /*
    const rawText = localStorage.getItem("receiptText");
    if (rawText) {
      // Original logic:
      const { itemLines, summaryLines } = extractRelevantLines(rawText);
      const parsedItems = itemLines.map((l) => parseItemLine(l));
      setItems(parsedItems);
      setSummary(summaryLines);
    }
    */
  }, []);

  return (
    <div className="pt-28 px-6 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <h1 className="text-2xl font-bold mb-4">Receipt Analysis</h1>
      <p className="text-gray-600 mb-6">
        Placeholder for analyzing the uploaded receipt and assigning items
        to users or friends. (In a real flow, you’d add controls here for
        item assignments.)
      </p>

      {/* Only display the rest if we have items or summary */}
      {(items.length > 0 || summary.length > 0) && (
        <div className="bg-white p-5 rounded shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <span>🧾</span> Analyzed Receipt
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
                    {/* If you want to show quantity for summary lines, you could:
                     <div className="text-pink-600">{summaryItem.qty}</div> 
                    */}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
