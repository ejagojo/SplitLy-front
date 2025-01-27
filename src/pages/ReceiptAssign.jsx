import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getFirestore, doc, setDoc, updateDoc, getDoc } from "firebase/firestore";

const db = getFirestore();

export default function ReceiptAssign() {
  const { userId } = useParams(); // Get userId from the URL
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState([]);
  const [assignments, setAssignments] = useState({}); // Tracks item assignments

  // Fetch receipt data for the given userId
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
          alert("No receipt data found.");
        }
      } catch (err) {
        console.error("Error fetching receipt data:", err);
        alert("Failed to fetch receipt data. Please try again.");
      }
    };

    fetchReceiptData();
  }, [userId]);

  // Handle assignment changes for an item
  const handleAssignmentChange = (index, userName) => {
    setAssignments((prev) => ({
      ...prev,
      [index]: userName,
    }));
  };

  // Submit assignments to Firestore
  const handleSubmitAssignments = async () => {
    try {
      const assignmentData = Object.entries(assignments).map(([index, userName]) => ({
        userName,
        item: items[index],
      }));

      const docRef = doc(db, "receipt_assignments", userId);
      const docSnap = await getDoc(docRef);

      // Use setDoc for new documents or updateDoc for existing ones
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          assignments: assignmentData,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await setDoc(docRef, {
          assignments: assignmentData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
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
        <p className="text-gray-600">No items available for assignment.</p>
      )}
    </div>
  );
}
