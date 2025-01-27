import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  getDoc
} from "firebase/firestore";

const db = getFirestore();

/**
 * Checks if every item in `items` has a corresponding assignment in `assignments`.
 * If so, we consider all participants done.
 */
function isAllItemsAssigned(items, assignments) {
  // If no items exist, we can’t mark them all assigned
  if (!items.length) return false;

  return items.every((_, index) => {
    const assignedName = assignments[index];
    // Must have a non-empty name to be considered assigned
    return assignedName && assignedName.trim().length > 0;
  });
}

export default function ReceiptAssign() {
  const { userId } = useParams(); // The host user’s ID from the URL
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState([]);
  const [assignments, setAssignments] = useState({}); // Tracks item -> assigned user

  /**
   * Fetch the data from Firestore: `receipt_links/{userId}` for items + summary.
   */
  useEffect(() => {
    const fetchReceiptData = async () => {
      try {
        const docRef = doc(db, "receipt_links", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const { items, summary } = docSnap.data();
          setItems(items || []);
          setSummary(summary || []);
        } else {
          alert("No receipt data found for this link.");
        }
      } catch (err) {
        console.error("Error fetching receipt data:", err);
        alert("Failed to fetch receipt data. Please try again.");
      }
    };

    fetchReceiptData();
  }, [userId]);

  /**
   * Called when a user type changes an assignment for an item at index `index`.
   */
  const handleAssignmentChange = (index, userName) => {
    setAssignments((prev) => ({
      ...prev,
      [index]: userName
    }));
  };

  /**
   * Submits assignments to Firestore at `receipt_assignments/{userId}`.
   * Then, if every item is assigned, we set `assignmentsComplete = true` in `receipt_links/{userId}`
   * so the host is notified in real-time that participants are done.
   */
  const handleSubmitAssignments = async () => {
    try {
      // Convert the local `assignments` object into an array: { userName, item }
      const assignmentData = Object.entries(assignments).map(([index, userName]) => ({
        userName,
        item: items[Number(index)]
      }));

      // Upsert the user’s assignments in `receipt_assignments/{userId}`
      const assignmentRef = doc(db, "receipt_assignments", userId);
      const docSnap = await getDoc(assignmentRef);

      const now = new Date().toISOString();
      if (docSnap.exists()) {
        await updateDoc(assignmentRef, {
          assignments: assignmentData,
          updatedAt: now
        });
      } else {
        await setDoc(assignmentRef, {
          assignments: assignmentData,
          createdAt: now,
          updatedAt: now
        });
      }

      // If all items have valid assignments, notify the host
      if (isAllItemsAssigned(items, assignments)) {
        const linkRef = doc(db, "receipt_links", userId);
        await updateDoc(linkRef, { assignmentsComplete: true });
      }

      alert("Assignments submitted successfully!");
    } catch (err) {
      if (err.code === "permission-denied") {
        alert("You do not have permission to perform this action.");
      } else {
        console.error("Error submitting assignments:", err);
        alert("An unexpected error occurred while submitting assignments.");
      }
    }
  };

  // Combined items + summary if you ever choose to assign summary items too:
  // const allItems = [...items, ...summary];

  return (
    <div className="pt-28 px-6 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <h1 className="text-2xl font-bold mb-4">Assign Receipt Items</h1>

      {items.length > 0 ? (
        <div className="bg-white p-5 rounded shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Receipt Items</h2>

          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-purple-100 text-purple-700 uppercase">
                <th className="p-2 font-semibold">Qty</th>
                <th className="p-2 font-semibold">Item</th>
                <th className="p-2 font-semibold">Price</th>
                <th className="p-2 font-semibold">Assign To</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-b last:border-none">
                  <td className="p-2">{item.qty}</td>
                  <td className="p-2">{item.name}</td>
                  <td className="p-2">${item.price}</td>
                  <td className="p-2">
                    <input
                      type="text"
                      placeholder="Enter name"
                      className="w-full bg-gray-50 border border-gray-300 rounded px-2 py-1"
                      value={assignments[index] || ""}
                      onChange={(e) => handleAssignmentChange(index, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={handleSubmitAssignments}
            className="mt-4 px-6 py-3 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition"
          >
            Submit Assignments
          </button>
        </div>
      ) : (
        <p className="text-gray-600">
          No items available for assignment. Please check your link or receipt data.
        </p>
      )}
    </div>
  );
}
