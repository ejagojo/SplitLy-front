/**
 * File: /src/pages/ReceiptHistory.jsx
 */

import React, { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

/**
 * A small helper to format ISO date strings into a more readable format.
 * Returns "Unknown Date" if invalid or missing.
 */
function formatDate(isoString) {
  if (!isoString) return "Unknown Date";
  const dateObj = new Date(isoString);
  if (isNaN(dateObj.getTime())) return "Unknown Date";
  // Example output: "January 23, 2025, 3:45 PM"
  return dateObj.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

/**
 * ReceiptHistory component:
 * - Fetches a list of receipts from Firestore, filtered by the current user.
 * - Displays them in a table with filtering by status.
 * - Clicking "View Details" reveals a read-only panel showing deeper info (date, status, total, plus optional breakdown).
 * - The breakdown section is improved to display multiple splits (bigger splits) with a more structured UI.
 */
export default function ReceiptHistory() {
  const [receipts, setReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null); // Track error state

  // The selected receipt data for read-only display
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Firestore & Auth
  const db = getFirestore();
  const auth = getAuth();

  /**
   * fetchReceipts: Retrieves receipts from Firestore where userId == auth.currentUser.uid.
   * Also overrides "Receipt by <email>" with localStorage's "receiptName" if found.
   */
  const fetchReceipts = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated. Please log in first.");
      }

      // Query Firestore for receipts belonging to the current user
      const receiptsRef = collection(db, "receipts");
      const q = query(receiptsRef, where("userId", "==", user.uid));
      const snapshot = await getDocs(q);

      // Transform each Firestore document for display
      const retrievedData = snapshot.docs.map((docSnap) => {
        const docData = docSnap.data();

        // If docData.name starts with "Receipt by", override with localStorage's "receiptName"
        const storedName = localStorage.getItem("receiptName") || "Untitled Receipt";
        let finalName = docData.name || "Untitled Receipt";
        if (finalName.startsWith("Receipt by ")) {
          finalName = storedName;
        }

        return {
          id: docSnap.id,
          name: finalName,
          // We'll store date as-is; we can format upon display
          date: docData.date || "Unknown Date",
          status: docData.status || "pending",
          total: docData.total || 0
        };
      });

      setReceipts(retrievedData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      setErrorMessage("Unable to retrieve receipts. Please try again later.");
      setReceipts([]);
      setLoading(false);
    }
  };

  /**
   * applyFilter: Filters receipts by status: "all", "pending", or "analyzed".
   */
  const applyFilter = (allReceipts, status) => {
    if (status === "all") return allReceipts;
    return allReceipts.filter((r) => r.status === status);
  };

  /**
   * On mount, fetch data from Firestore.
   */
  useEffect(() => {
    fetchReceipts();
  }, []);

  /**
   * Re-filter whenever `receipts` or `filterStatus` changes.
   */
  useEffect(() => {
    const updatedList = applyFilter(receipts, filterStatus);
    setFilteredReceipts(updatedList);
  }, [receipts, filterStatus]);

  /**
   * handleViewDetails: fetch a single receipt by ID from Firestore
   * to display in read-only mode (no calculations or edits allowed).
   */
  const handleViewDetails = async (receiptId) => {
    setLoadingDetail(true);
    setSelectedReceipt(null); // Clear previous data

    try {
      const docRef = doc(db, "receipts", receiptId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        alert("Receipt not found or no longer available.");
        setLoadingDetail(false);
        return;
      }

      const data = docSnap.data();
      // Override "Receipt by ..." if needed
      const storedName = localStorage.getItem("receiptName") || "Untitled Receipt";
      let finalName = data.name || "Untitled Receipt";
      if (finalName.startsWith("Receipt by ")) {
        finalName = storedName;
      }

      // We'll store everything relevant in state
      setSelectedReceipt({
        id: receiptId,
        name: finalName,
        // Format date more readably
        date: formatDate(data.date),
        status: data.status || "pending",
        total: data.total || 0,
        // If you want item-level detail
        breakdown: data.breakdown || []
      });
    } catch (err) {
      console.error("Error fetching receipt details:", err);
      alert("Unable to load receipt details.");
    } finally {
      setLoadingDetail(false);
    }
  };

  /**
   * Closes the read-only detail panel
   */
  const handleCloseDetails = () => {
    setSelectedReceipt(null);
  };

  return (
    <div className="pt-28 px-6 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <h1 className="text-2xl font-bold mb-6">Receipt History</h1>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <label className="font-medium">Filter by status:</label>
        <select
          className="border border-gray-300 rounded p-2"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="analyzed">Analyzed</option>
        </select>
      </div>

      {/* Loading Indicator for main receipt list */}
      {loading && <p className="text-gray-600">Loading receipts...</p>}

      {/* Error Message */}
      {errorMessage && !loading && (
        <p className="text-red-600 mb-4">{errorMessage}</p>
      )}

      {/* Receipt List Table */}
      {!loading && !errorMessage && filteredReceipts.length > 0 && (
        <div className="overflow-x-auto mb-8">
          <table className="min-w-full text-left bg-white shadow-md rounded">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="p-4 font-semibold">Receipt Name</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Total</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReceipts.map((receipt) => (
                <tr
                  key={receipt.id}
                  className="border-b last:border-none hover:bg-gray-50"
                >
                  <td className="p-4">{receipt.name}</td>
                  <td className="p-4">{formatDate(receipt.date)}</td>
                  <td className="p-4 capitalize">{receipt.status}</td>
                  <td className="p-4">
                    ${Number(receipt.total).toFixed(2)}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleViewDetails(receipt.id)}
                      className="px-4 py-2 bg-blue-600 text-white font-semibold rounded shadow hover:bg-blue-700 transition"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* No Receipts Found */}
      {!loading && !errorMessage && filteredReceipts.length === 0 && (
        <p className="text-gray-600">No receipts found for the selected filter.</p>
      )}

      {/* Read-Only Detail Section (conditional rendering) */}
      {selectedReceipt && (
        <div className="bg-white rounded shadow p-6 mt-4 max-w-3xl">
          <h2 className="text-xl font-bold mb-4">Receipt Details (Read-Only)</h2>

          {/* Show a loader if we're still fetching details */}
          {loadingDetail ? (
            <p className="text-gray-600">Loading details...</p>
          ) : (
            <>
              <div className="mb-4 space-y-1">
                <p>
                  <span className="font-semibold">Name:</span> {selectedReceipt.name}
                </p>
                <p>
                  <span className="font-semibold">Date:</span> {selectedReceipt.date}
                </p>
                <p>
                  <span className="font-semibold">Status:</span>{" "}
                  {selectedReceipt.status}
                </p>
                <p>
                  <span className="font-semibold">Total:</span>{" "}
                  ${Number(selectedReceipt.total).toFixed(2)}
                </p>
              </div>

              {/* If breakdown is stored, show the item-level details read-only */}
              {selectedReceipt.breakdown.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">
                    Detailed Splits
                  </h3>

                  {/* 
                    Each breakdown entry typically represents a person (userName)
                    who consumed a set of items. We'll display it in a more structured UI.
                  */}
                  <div className="grid gap-6 md:grid-cols-2">
                    {selectedReceipt.breakdown.map((bEntry, idx) => (
                      <div key={idx} className="bg-gray-50 border rounded p-3">
                        <h4 className="font-semibold text-gray-700 mb-2">
                          {bEntry.userName}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Owes: $
                          {Number(bEntry.totalOwed || 0).toFixed(2)}
                        </p>
                        {/* A small table for each user’s item splits */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-gray-700 border">
                            <thead className="bg-gray-100 border-b">
                              <tr>
                                <th className="p-2 font-semibold">Item</th>
                                <th className="p-2 font-semibold">Qty</th>
                                <th className="p-2 font-semibold">Base</th>
                                <th className="p-2 font-semibold">Tax</th>
                                <th className="p-2 font-semibold">Tip</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bEntry.items.map((itm, i2) => (
                                <tr key={i2} className="border-b last:border-none">
                                  <td className="p-2">{itm.itemName}</td>
                                  <td className="p-2">{itm.partialQty}</td>
                                  <td className="p-2">
                                    ${itm.partialBaseCost?.toFixed(2)}
                                  </td>
                                  <td className="p-2">
                                    ${itm.partialTax?.toFixed(2)}
                                  </td>
                                  <td className="p-2">
                                    ${itm.partialTip?.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Close button */}
              <div className="mt-6">
                <button
                  onClick={handleCloseDetails}
                  className="px-4 py-2 bg-gray-500 text-white font-semibold rounded hover:bg-gray-600 transition"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
