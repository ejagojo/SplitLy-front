/*****************************************
 * File: UploadReceipt.jsx
 * Location: /src/pages/UploadReceipt.jsx
 *
 * Changes Made:
 * 1. Enlarged the "Item / Label" column for better visibility.
 * 2. Added a useEffect hook to store updated items in localStorage 
 *    so that the Receipt Analysis page can access the final item data.
 * 3. Preserved all original logic, code, and commented-out summary section.
 *****************************************/

import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import Tesseract from "tesseract.js";

/**
 * UploadReceipt component:
 * - Uses Tesseract.js for OCR with a custom whitelist and psm=6.
 * - Extracts lines containing currency or receipt keywords.
 * - Splits them into "Items" (Quantity, Item, Price) or "Summary"
 *   (Tax, Tip, Total, etc.), then merges them into a single items array.
 * - Displays everything in one table for a more informative overview.
 * - Now includes a manual add/remove feature to handle OCR inaccuracies.
 * - The item/label column is widened for better readability.
 *
 * Scalability Note:
 *  - For ~1 million users, ensure Tesseract calls are offloaded (e.g.,
 *    server-side or via a scalable microservice) to handle concurrency.
 *  - This demo focuses on client-side logic for clarity.
 */

export default function UploadReceipt() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [rawText, setRawText] = useState("");

  // Single array combining both standard items and summary items
  const [items, setItems] = useState([]);

  // We still keep 'summary' in state to preserve existing references,
  // but we no longer render it separately.
  const [summary, setSummary] = useState([]);

  const navigate = useNavigate();

  /**
   * extractRelevantLines:
   * - Splits OCR text into lines, filtering based on keywords or currency.
   * - Then sorts them into two categories:
   *   1. Lines that match "tax|tip|total|subtotal|amount due|due|balance|paid|change" => summary
   *   2. Everything else => item lines.
   */
  const extractRelevantLines = (ocrText) => {
    const allLines = ocrText.split("\n").map((l) => l.trim());
    const summaryRegex = /(tax|tip|total|subtotal|amount due|due|balance|paid|change)/i;
    const currencyRegex = /(\$|(\d+\.\d{2}))/;

    const itemLines = [];
    const summaryLines = [];

    allLines.forEach((line) => {
      if (!line) return;

      // If line has "summary" keywords, or is purely a single currency line, treat as summary
      if (summaryRegex.test(line) || /^(?:.*\s+)?(\$?\d+\.\d{2})(?:\s.*)?$/.test(line)) {
        if (currencyRegex.test(line) || summaryRegex.test(line)) {
          summaryLines.push(line);
        }
      } else if (currencyRegex.test(line)) {
        // Attempt to parse line as an item: qty, item, price
        itemLines.push(line);
      }
    });

    return { itemLines, summaryLines };
  };

  /**
   * parseItemLine:
   * - A naive parser to split an "item line" into { qty, name, price }.
   *   E.g. "1 Coffee $2.50" => { qty: "1", name: "Coffee", price: "$2.50" }.
   */
  const parseItemLine = (line) => {
    let qty = "1";
    let name = line;
    let price = "";

    // Leading quantity?
    const qtyMatch = line.match(/^(\d+)\s+(.*)/);
    if (qtyMatch) {
      qty = qtyMatch[1];
      name = qtyMatch[2];
    }

    // Trailing price?
    const priceMatch = name.match(/(\$?\d+\.\d{2})$/);
    if (priceMatch) {
      price = priceMatch[1];
      name = name.replace(price, "").trim();
    }

    return { qty, name: name || "Item", price: price || "$0.00" };
  };

  /**
   * parseSummaryLine:
   * - Converts a summary line (e.g., "Tax $2.00", "Tip: $3.50", etc.)
   *   into the same { qty, name, price } shape used for items.
   */
  const parseSummaryLine = (line) => {
    let qty = "1";
    let name = "Summary Item";
    let price = "$0.00";

    // Extract currency if present
    const currencyMatch = line.match(/(\$?\d+\.\d{2})/);
    if (currencyMatch) {
      price = currencyMatch[1];
    }

    // Identify known keywords, or default to the raw line
    if (/tax/i.test(line)) {
      name = "Tax";
    } else if (/tip/i.test(line)) {
      name = "Tip";
    } else if (/total/i.test(line)) {
      name = "Total";
    } else if (/subtotal/i.test(line)) {
      name = "Subtotal";
    } else {
      // If no special keyword, remove the currency from the line and store the remainder
      name = line.replace(currencyMatch?.[0], "").trim() || "Summary Item";
    }

    return { qty, name, price };
  };

  /**
   * handleAnalyzeReceipt:
   * - Runs Tesseract with advanced config for improved accuracy,
   *   then splits lines into items vs. summary.
   * - Finally merges both sets into a single "items" array
   *   displayed in one unified table.
   */
  const handleAnalyzeReceipt = async () => {
    if (!selectedFile) {
      alert("Please upload a receipt file first!");
      return;
    }
    try {
      setUploadStatus("Analyzing receipt with Tesseract...");

      const result = await Tesseract.recognize(selectedFile, "eng", {
        tessedit_char_whitelist:
          "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz$.,:- ",
        tessedit_pageseg_mode: "6",
      });

      const fullText = result.data.text || "";
      setRawText(fullText);

      const { itemLines, summaryLines } = extractRelevantLines(fullText);

      // Convert item lines into structured objects
      const parsedItems = itemLines.map((l) => parseItemLine(l));
      // Convert summary lines into the same structure
      const parsedSummaryItems = summaryLines.map((l) => parseSummaryLine(l));

      // Merge them into one array
      const combinedItems = [...parsedItems, ...parsedSummaryItems];
      setItems(combinedItems);

      // We still store the raw summary lines in state
      // (preserving original code references).
      setSummary(summaryLines);

      // Store raw text in localStorage so /receipt/analysis can read it
      localStorage.setItem("receiptText", fullText);

      // Also store the combined items in localStorage,
      // ensuring the next page has the updated items array
      localStorage.setItem("receiptItems", JSON.stringify(combinedItems));

      setUploadStatus("Analysis complete! Feel free to adjust below or try again.");
    } catch (error) {
      console.error("Error analyzing receipt:", error);
      setUploadStatus(`Error analyzing receipt: ${error.message}`);
    }
  };

  /**
   * useEffect to update localStorage whenever items change (post-analysis).
   * This ensures that manual edits (add/remove/rename) are also saved.
   */
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem("receiptItems", JSON.stringify(items));
    } else {
      // If the array is empty, optionally clear the stored items
      localStorage.removeItem("receiptItems");
    }
  }, [items]);

  /**
   * handleRetry:
   * - Clears everything, re-analyzes with the same file.
   */
  const handleRetry = () => {
    if (!selectedFile) {
      alert("No file selected to re-analyze. Please upload again.");
      return;
    }
    setUploadStatus("Retrying analysis...");
    setRawText("");
    setItems([]);
    setSummary([]);
    localStorage.removeItem("receiptText");
    localStorage.removeItem("receiptItems");
    handleAnalyzeReceipt();
  };

  /**
   * goToAnalysisPage:
   * - Moves on to /receipt/analysis if we have some recognized text.
   */
  const goToAnalysisPage = () => {
    if (!rawText) {
      alert("No recognized text available. Please analyze first.");
      return;
    }
    navigate("/receipt/analysis");
  };

  /**
   * handleItemChange:
   * - Edits a single field (quantity, name, or price) in an item row,
   *   including summary-like rows in the same array.
   */
  const handleItemChange = (index, field, newValue) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: newValue };
      return updated;
    });
  };

  /**
   * handleAddItem:
   * - Adds a new item object to the items array.
   *   Defaults to { qty: "1", name: "New Item", price: "$0.00" }.
   */
  const handleAddItem = () => {
    const newItem = { qty: "1", name: "New Item", price: "$0.00" };
    setItems((prev) => [...prev, newItem]);
  };

  /**
   * handleRemoveItem:
   * - Removes the item at the specified index.
   */
  const handleRemoveItem = (index) => {
    setItems((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  /**
   * onDrop:
   * - React Dropzone callback for file selection.
   */
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setUploadStatus("");
      setRawText("");
      setItems([]);
      setSummary([]);
      localStorage.removeItem("receiptText");
      localStorage.removeItem("receiptItems");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"] },
    onDrop,
    multiple: false,
  });

  return (
    <div className="pt-28 px-6 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <h1 className="text-2xl font-bold mb-4">Upload Receipt</h1>
      <p className="text-gray-600 mb-6">
        Upload your receipt image below. Once uploaded, click “Analyze Receipt” to
        run OCR. If something looks incorrect, edit below. When satisfied, press
        “Next” to proceed.
      </p>

      {/* Drag-and-drop area */}
      <div
        {...getRootProps()}
        className={`mb-4 p-8 border-2 border-dashed rounded cursor-pointer transition-all ${
          isDragActive
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 bg-white hover:bg-gray-50"
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-center text-blue-600">Drop the file here...</p>
        ) : (
          <p className="text-center text-gray-600">
            Drag & drop a receipt image here, or click to select one
          </p>
        )}
      </div>

      {/* Preview of selected file */}
      {selectedFile && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Preview:</h2>
          <img
            src={URL.createObjectURL(selectedFile)}
            alt="Receipt Preview"
            className="max-w-xs border rounded shadow"
          />
        </div>
      )}

      {/* Buttons for analysis */}
      <div className="flex flex-col items-start gap-3">
        <button
          onClick={handleAnalyzeReceipt}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded shadow hover:bg-blue-700 transition"
        >
          Analyze Receipt
        </button>

        {/* "Try Again" if we have items or there's an error */}
        {((items.length > 0) || uploadStatus.startsWith("Error")) && (
          <button
            onClick={handleRetry}
            className="px-6 py-3 bg-yellow-500 text-white font-semibold rounded shadow hover:bg-yellow-600 transition"
          >
            Try Again
          </button>
        )}

        {/* "Next" only if we have recognized lines and no error */}
        {items.length > 0 && !uploadStatus.startsWith("Error") && (
          <button
            onClick={goToAnalysisPage}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded shadow hover:bg-green-700 transition"
          >
            Next
          </button>
        )}
      </div>

      {/* Show status if any */}
      {uploadStatus && (
        <p className="mt-4 text-gray-700 whitespace-pre-line">{uploadStatus}</p>
      )}

      {/* 
        Items Table Section (Quantity, Item, Price)
        Includes both standard items and summary entries,
        now with Add/Remove functionality and a wider label column.
      */}
      {items.length > 0 && (
        <div className="mt-6 p-5 bg-white rounded shadow w-full max-w-3xl">
          <h3 className="text-xl font-bold mb-3 text-gray-800 flex items-center gap-2">
            <span>🛒</span> Items (including any summary lines)
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Adjust the quantity, name, or price for each row (Tax, Tip, Total, etc.).
            Use “Add New Item” to manually create items if OCR missed something.
          </p>

          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-purple-100 text-purple-700 uppercase">
                  <th className="p-2 font-semibold w-20">Qty</th>
                  <th className="p-2 font-semibold w-1/2">Item / Label</th>
                  <th className="p-2 font-semibold w-24">Price</th>
                  <th className="p-2 font-semibold w-24">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b last:border-none">
                    <td className="p-2">
                      <input
                        className="w-16 bg-purple-50 border border-purple-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                        value={item.qty}
                        onChange={(e) => handleItemChange(idx, "qty", e.target.value)}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        className="bg-purple-50 border border-purple-200 rounded px-2 py-1 w-full min-w-[240px] focus:outline-none focus:ring-2 focus:ring-purple-400"
                        value={item.name}
                        onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        className="w-20 bg-purple-50 border border-purple-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                        value={item.price}
                        onChange={(e) => handleItemChange(idx, "price", e.target.value)}
                      />
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="px-3 py-1 bg-red-500 text-white rounded shadow hover:bg-red-600 transition"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Button to add a new item manually */}
          <div className="mt-4">
            <button
              onClick={handleAddItem}
              className="px-5 py-2 bg-blue-600 text-white font-semibold rounded shadow hover:bg-blue-700 transition"
            >
              + Add New Item
            </button>
          </div>
        </div>
      )}

      {/*
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        ORIGINAL SUMMARY SECTION (COMMENTED OUT)
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        We retain the code for reference but do not render it,
        since we are now merging summary lines into the items table.
        
        {summary.length > 0 && (
          <div className="mt-6 p-5 bg-white rounded shadow w-full max-w-2xl">
            <h3 className="text-xl font-bold mb-3 text-gray-800 flex items-center gap-2">
              <span>💰</span> Summary
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Edit any of the summary lines (tax, tip, total, etc.) if needed:
            </p>
            <div className="space-y-2 text-sm text-gray-800">
              {summary.map((line, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded bg-pink-50 border-l-4 border-pink-300"
                >
                  <span className="text-pink-600 font-semibold">{`Line ${idx + 1}:`}</span>
                  <input
                    className="flex-1 bg-pink-100 border border-pink-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-pink-400"
                    value={line}
                    onChange={(e) => {
                      setSummary((prev) => {
                        const updated = [...prev];
                        updated[idx] = e.target.value;
                        return updated;
                      });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      */}
    </div>
  );
}
