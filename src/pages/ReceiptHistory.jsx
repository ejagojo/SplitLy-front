import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * ReceiptHistory component:
 * - Fetches a list of receipts (currently mocked).
 * - Allows filtering by status (e.g., all, pending, analyzed).
 * - Displays the results in a styled table.
 * - "View Details" navigates to /receipt/analysis for deeper review.
 * 
 * In a real implementation, you would:
 * 1. Call your backend (Spring Boot) to fetch the user's receipts
 *    via fetch or Axios in `fetchReceipts()`.
 * 2. Store or update the data in state, apply filters, etc.
 * 3. Potentially support searching by name/date.
 */

export default function ReceiptHistory() {
  const [receipts, setReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // Simulate fetching from backend with a short delay
  const fetchReceipts = async () => {
    setLoading(true);
    // Mock data simulating what might come from the backend
    const mockData = [
      {
        id: 1,
        name: "Dinner at Italian Bistro",
        date: "2025-01-15",
        status: "pending",
        total: 74.23,
      },
      {
        id: 2,
        name: "Office Supplies",
        date: "2025-01-10",
        status: "analyzed",
        total: 123.45,
      },
      {
        id: 3,
        name: "Groceries",
        date: "2025-01-08",
        status: "pending",
        total: 89.99,
      },
      {
        id: 4,
        name: "Birthday Party Supplies",
        date: "2024-12-28",
        status: "analyzed",
        total: 145.0,
      },
    ];

    // Simulate an API delay
    setTimeout(() => {
      setReceipts(mockData);
      setLoading(false);
    }, 1000);
  };

  // Filter receipts based on status
  const applyFilter = (allReceipts, status) => {
    if (status === "all") {
      return allReceipts;
    }
    return allReceipts.filter((r) => r.status === status);
  };

  // When component mounts, fetch the receipts
  useEffect(() => {
    fetchReceipts();
  }, []);

  // Whenever receipts or filterStatus changes, re-apply filter
  useEffect(() => {
    const updatedList = applyFilter(receipts, filterStatus);
    setFilteredReceipts(updatedList);
  }, [receipts, filterStatus]);

  // Navigate to receipt analysis page
  const handleViewDetails = (receiptId) => {
    // In a real-world app, you might pass the ID to the next route,
    // or store it in context to fetch details in the analysis page.
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

      {/* Loading Spinner */}
      {loading && (
        <p className="text-gray-600">Loading receipts...</p>
      )}

      {/* Receipt List Table */}
      {!loading && filteredReceipts.length > 0 && (
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
                  <td className="p-4">${receipt.total.toFixed(2)}</td>
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
      {!loading && filteredReceipts.length === 0 && (
        <p className="text-gray-600">
          No receipts found for the selected filter.
        </p>
      )}
    </div>
  );
}
