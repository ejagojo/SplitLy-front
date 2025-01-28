/**
 * File: /src/pages/ReceiptHistory.jsx
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// NEW: Firestore + Auth imports
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";

/**
 * ReceiptHistory component:
 * - Fetches a list of receipts from Firestore.
 * - Handles potential fetch errors gracefully by falling back to an empty array or showing a message.
 * - Allows filtering by status (e.g., all, pending, analyzed).
 * - Displays results in a styled table.
 * - "View Details" navigates to /receipt/analysis for deeper review.
 *
 * Implementation Notes:
 * 1) This version replaces the previous `fetch` call with Firestore logic to fetch documents
 *    from the "receipts" collection, where `userId` matches the authenticated user's UID.
 * 2) The rest of the logic (filtering, rendering) remains unchanged.
 */

export default function ReceiptHistory() {
  const [receipts, setReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null); // Track error state

  const navigate = useNavigate();

  // NEW: Access Firestore & Auth
  const db = getFirestore();
  const auth = getAuth();

  /**
   * Revised fetch function to retrieve receipts from Firestore, filtered by the current user.
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

      // Transform each document into an object that matches the shape your table expects
      const retrievedData = snapshot.docs.map((docSnap) => {
        const docData = docSnap.data();
        return {
          id: docSnap.id,
          name: docData.name || "Untitled Receipt",
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
   * Filters receipts by status: "all", "pending", or "analyzed".
   */
  const applyFilter = (allReceipts, status) => {
    if (status === "all") return allReceipts;
    return allReceipts.filter((r) => r.status === status);
  };

  /**
   * On mount, fetch the data from Firestore instead of a REST API.
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
   * handleViewDetails: navigate to /receipt/analysis or pass receiptId to a route/context.
   */
  const handleViewDetails = (receiptId) => {
    navigate("/receipt/analysis");
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

      {/* Loading Indicator */}
      {loading && <p className="text-gray-600">Loading receipts...</p>}

      {/* Error Message */}
      {errorMessage && !loading && (
        <p className="text-red-600 mb-4">{errorMessage}</p>
      )}

      {/* Receipt List Table */}
      {!loading && !errorMessage && filteredReceipts.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left bg-white shadow-md rounded">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="p-4 font-semibold">Name</th>
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
                  <td className="p-4">{receipt.date}</td>
                  <td className="p-4 capitalize">{receipt.status}</td>
                  <td className="p-4">${Number(receipt.total).toFixed(2)}</td>
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
        <p className="text-gray-600">
          No receipts found for the selected filter.
        </p>
      )}
    </div>
  );
}
