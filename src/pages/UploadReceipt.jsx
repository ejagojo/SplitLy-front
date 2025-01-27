import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import Tesseract from "tesseract.js";
import { getFirestore, collection, addDoc } from "firebase/firestore"; // Firestore imports
import { getAuth } from "firebase/auth"; // Firebase auth for user-specific data

const db = getFirestore(); // Firestore instance
const auth = getAuth(); // Firebase auth instance

/**
 * UploadReceipt Component:
 * - Firebase integration to save parsed receipt data.
 * - Preserves original logic and design, including progress bar, manual editing, and summary handling.
 */
export default function UploadReceipt() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [rawText, setRawText] = useState("");
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState([]);
  const [progress, setProgress] = useState(0); // OCR progress tracking
  const navigate = useNavigate();

  /**
   * Splits OCR text into relevant lines, categorized as item lines or summary lines.
   */
  const extractRelevantLines = (ocrText) => {
    const allLines = ocrText.split("\n").map((line) => line.trim());
    const summaryRegex = /(tax|tip|total|subtotal|amount due|due|balance|paid|change)/i;
    const currencyRegex = /(\$|(\d+\.\d{2}))/;

    const itemLines = [];
    const summaryLines = [];

    allLines.forEach((line) => {
      if (!line) return;

      if (summaryRegex.test(line) || /^(?:.*\s+)?(\$?\d+\.\d{2})(?:\s.*)?$/.test(line)) {
        if (currencyRegex.test(line) || summaryRegex.test(line)) {
          summaryLines.push(line);
        }
      } else if (currencyRegex.test(line)) {
        itemLines.push(line);
      }
    });

    return { itemLines, summaryLines };
  };

  /**
   * Parses an item line into structured data { qty, name, price }.
   */
  const parseItemLine = (line) => {
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
  };

  /**
   * Parses a summary line into structured data { qty, name, price }.
   */
  const parseSummaryLine = (line) => {
    let qty = "1";
    let name = "Summary Item";
    let price = "$0.00";

    const currencyMatch = line.match(/(\$?\d+\.\d{2})/);
    if (currencyMatch) {
      price = currencyMatch[1];
    }

    if (/tax/i.test(line)) {
      name = "Tax";
    } else if (/tip/i.test(line)) {
      name = "Tip";
    } else if (/total/i.test(line)) {
      name = "Total";
    } else if (/subtotal/i.test(line)) {
      name = "Subtotal";
    } else {
      name = line.replace(currencyMatch?.[0], "").trim() || "Summary Item";
    }

    return { qty, name, price };
  };

  /**
   * Analyzes the uploaded receipt using Tesseract.js and processes the results.
   */
  const handleAnalyzeReceipt = async () => {
    if (!selectedFile) {
      alert("Please upload a receipt file first!");
      return;
    }

    setUploadStatus("Analyzing receipt...");
    setProgress(0);

    try {
      const result = await Tesseract.recognize(selectedFile, "eng", {
        tessedit_char_whitelist:
          "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz$.,:- ",
        tessedit_pageseg_mode: "6",
        logger: (info) => {
          if (info.status === "recognizing text") {
            setProgress(Math.round(info.progress * 100));
          }
        },
      });

      const fullText = result.data.text || "";
      setRawText(fullText);

      const { itemLines, summaryLines } = extractRelevantLines(fullText);

      const parsedItems = itemLines.map((line) => parseItemLine(line));
      const parsedSummaryItems = summaryLines.map((line) => parseSummaryLine(line));

      const combinedItems = [...parsedItems, ...parsedSummaryItems];
      setItems(combinedItems);
      setSummary(summaryLines);

      // Save the parsed data to Firestore
      await saveReceiptToFirestore(combinedItems);

      localStorage.setItem("receiptText", fullText);
      localStorage.setItem("receiptItems", JSON.stringify(combinedItems));

      setUploadStatus("Receipt analysis complete!");
    } catch (error) {
      console.error("Error analyzing receipt:", error);
      setUploadStatus(`Error: ${error.message}`);
    }
  };

  /**
   * Saves receipt data to Firestore under the authenticated user's account.
   */
  const saveReceiptToFirestore = async (items) => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated.");
    }

    const receiptsCollection = collection(db, "receipts");
    await addDoc(receiptsCollection, {
      userId: user.uid,
      items,
      createdAt: new Date().toISOString(),
    });
  };

  /**
   * Handles retrying the analysis process.
   */
  const handleRetry = () => {
    setSelectedFile(null);
    setItems([]);
    setSummary([]);
    setUploadStatus("");
    setProgress(0);
    localStorage.removeItem("receiptText");
    localStorage.removeItem("receiptItems");
  };

  /**
   * Updates localStorage whenever items change.
   */
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem("receiptItems", JSON.stringify(items));
    }
  }, [items]);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setUploadStatus("");
      setItems([]);
      setSummary([]);
      setProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"] },
    onDrop,
    multiple: false,
  });

  const goToAnalysisPage = () => {
    if (!rawText) {
      alert("No recognized text available. Please analyze first.");
      return;
    }
    navigate("/receipt/analysis");
  };

  const handleItemChange = (index, field, newValue) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: newValue };
      return updated;
    });
  };

  const handleAddItem = () => {
    const newItem = { qty: "1", name: "New Item", price: "$0.00" };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  return (
    <div className="pt-28 px-6 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <h1 className="text-2xl font-bold mb-4">Upload Receipt</h1>
      <p className="text-gray-600 mb-6">
        Upload your receipt image below. Once uploaded, click “Analyze Receipt” to
        run OCR. Edit the data if needed, then press “Next.”
      </p>

      {/* Drag-and-drop area */}
      <div
        {...getRootProps()}
        className={`mb-4 p-8 border-2 border-dashed rounded ${
          isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-white"
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-center text-gray-600">
          {isDragActive ? "Drop the file here..." : "Drag & drop a receipt image here, or click to select one"}
        </p>
      </div>

      {/* File preview */}
      {selectedFile && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Preview:</h2>
          <img src={URL.createObjectURL(selectedFile)} alt="Receipt Preview" className="max-w-sm rounded shadow" />
        </div>
      )}

      {/* Progress bar */}
      {progress > 0 && progress < 100 && (
        <div className="mb-4">
          <p className="text-gray-600">Analyzing receipt... {progress}%</p>
          <div className="w-full bg-gray-200 rounded">
            <div
              className="bg-blue-600 text-center text-white rounded h-5"
              style={{ width: `${progress}%` }}
            >
              {progress}%
            </div>
          </div>
        </div>
      )}

      {/* Status */}
      {uploadStatus && <p className="mt-4 text-gray-700">{uploadStatus}</p>}

      {/* Analyze button */}
      {selectedFile && !items.length && (
        <button
          onClick={handleAnalyzeReceipt}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded mt-4"
        >
          Analyze Receipt
        </button>
      )}

      {/* Items Table Section */}
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

      {/* Retry button (conditional rendering) */}
      {selectedFile && uploadStatus && items.length > 0 && (
        <button
          onClick={handleRetry}
          className="px-6 py-3 bg-yellow-500 text-white font-semibold rounded mt-4"
        >
          Retry
        </button>
      )}

      {items.length > 0 && (
        <button
          onClick={goToAnalysisPage}
          className="px-6 py-3 bg-green-600 text-white font-semibold rounded mt-4"
        >
          Next
        </button>
      )}
    </div>
  );
}
