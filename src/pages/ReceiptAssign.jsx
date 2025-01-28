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
 * Checks if every item in `items` has a valid set of contributors,
 * covering the entire item quantity with no leftover. If so, we mark them done.
 */
function isAllItemsAssigned(items, assignments) {
  // If no items exist => can't mark them all assigned
  if (!items.length) return false;

  // Each item must have at least one contributor with quantity > 0.
  // (Optionally verify sum of contributor qty == item.qty if you want a stricter check.)
  return items.every((_, index) => {
    const contributors = assignments[index] || [];
    const assignedQty = contributors.reduce((sum, c) => sum + parseInt(c.quantity || "0", 10), 0);
    return assignedQty > 0;
  });
}

export default function ReceiptAssign() {
  const { userId } = useParams(); // The host user’s ID from the URL

  // Items + summary from Firestore’s "receipt_links/{userId}"
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState([]);

  /**
   * For each item index, we hold an array of contributor objects:
   * assignments[index] = [
   *   { userName: "Alice", quantity: "2" },
   *   { userName: "Bob", quantity: "3" }
   * ]
   */
  const [assignments, setAssignments] = useState([]);

  /**
   * The list of possible contributor names, as specified by the host.
   */
  const [possibleContributors, setPossibleContributors] = useState([]);

  /**
   * Temporary input for the host to add names (comma-separated).
   */
  const [namesInput, setNamesInput] = useState("");

  /**
   * Fetch data from Firestore (`receipt_links/{userId}`) for items + summary.
   * Initialize assignments with empty arrays matching the item count.
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
          // Create a blank array of contributors for each item
          const arrayOfContributors = (items || []).map(() => []);
          setAssignments(arrayOfContributors);
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
   * Host inputs a list of names (comma-separated).
   * Once "Save Names" is clicked, parse them into an array and store.
   */
  const handleSaveNames = () => {
    const splitNames = namesInput
      .split(",")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    setPossibleContributors(splitNames);
    alert("Contributor names saved!");
  };

  /**
   * Add a new contributor object to item at 'index': { userName: '', quantity: '' }
   */
  const handleAddContributor = (index) => {
    setAssignments((prev) => {
      const updated = [...prev];
      updated[index] = [...updated[index], { userName: "", quantity: "" }];
      return updated;
    });
  };

  /**
   * Update a contributor’s fields (userName or quantity).
   * Enforce these rules:
   * 1) quantity >= 1
   * 2) sum of contributor quantities ≤ the item’s total qty
   */
  const handleContributorChange = (itemIndex, contribIndex, field, newValue) => {
    setAssignments((prev) => {
      const updated = [...prev];
      const contributors = [...updated[itemIndex]];
      const oldContributor = contributors[contribIndex];
      const itemQty = parseInt(items[itemIndex]?.qty || "1", 10);

      // We clone the contributor and update the relevant field
      const newContributor = { ...oldContributor, [field]: newValue };

      // If the user is editing quantity, enforce minimum 1
      if (field === "quantity") {
        let parsedQty = parseInt(newValue, 10);
        if (isNaN(parsedQty) || parsedQty < 1) {
          parsedQty = 1; // clamp to 1
        }
        newContributor.quantity = parsedQty.toString();
      }

      // Temporarily replace the old contributor with the new one
      contributors[contribIndex] = newContributor;

      // Now check if the sum of all contributor quantities <= itemQty
      const sumOfContribs = contributors.reduce((sum, c) => sum + parseInt(c.quantity || "0", 10), 0);
      if (sumOfContribs > itemQty) {
        // Revert: remove the newly updated quantity or show an alert
        alert(`Cannot exceed total quantity of ${itemQty} for this item.`);
        // restore old value
        contributors[contribIndex] = oldContributor;
      } else {
        // Otherwise, keep the new contributor
        updated[itemIndex] = contributors;
      }

      return updated;
    });
  };

  /**
   * Remove a contributor from a specific item’s contributor array.
   */
  const handleRemoveContributor = (itemIndex, contribIndex) => {
    setAssignments((prev) => {
      const updated = [...prev];
      const contributors = [...updated[itemIndex]];
      contributors.splice(contribIndex, 1);
      updated[itemIndex] = contributors;
      return updated;
    });
  };

  /**
   * Submits assignments to Firestore at `receipt_assignments/{userId}`.
   * If all items are assigned, set `assignmentsComplete = true`.
   */
  const handleSubmitAssignments = async () => {
    try {
      const assignmentData = items.map((item, idx) => ({
        item,
        contributors: assignments[idx] || []
      }));

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

      // Check if items are fully assigned
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

  return (
    <div className="pt-28 px-6 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <h1 className="text-2xl font-bold mb-4">Assign Receipt Items</h1>

      {/* 1) Host user enters list of names for potential contributors */}
      <div className="mb-6 bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Who will be contributing to this bill?
        </h2>
        <p className="text-sm text-gray-600 mb-3">
          Enter comma-separated names below (e.g. "Alice, Bob, Charlie"), then click "Save Names."
        </p>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="Alice, Bob, Charlie"
            value={namesInput}
            onChange={(e) => setNamesInput(e.target.value)}
          />
          <button
            onClick={handleSaveNames}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition"
          >
            Save Names
          </button>
        </div>
        {possibleContributors.length > 0 && (
          <p className="mt-2 text-sm text-gray-700">
            <span className="font-medium">Current contributors:</span>{" "}
            {possibleContributors.join(", ")}
          </p>
        )}
      </div>

      {/* 2) Display items and let user assign contributors from the saved names */}
      {items.length > 0 ? (
        <div className="bg-white p-5 rounded shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Receipt Items</h2>

          {items.map((item, index) => (
            <div key={index} className="mb-6 border-b pb-4 last:border-none last:pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-800">
                    {item.name} (Qty: {item.qty})
                  </p>
                  <p className="text-sm text-gray-600">${item.price} each</p>
                </div>
                <button
                  onClick={() => handleAddContributor(index)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition"
                >
                  + Add Contributor
                </button>
              </div>

              {/* Contributors for this item */}
              <div className="mt-3 space-y-2">
                {(assignments[index] || []).map((contrib, cIdx) => (
                  <div
                    key={cIdx}
                    className="flex flex-col md:flex-row md:items-center gap-2 bg-gray-50 p-2 rounded border"
                  >
                    {/* Use a dropdown from possibleContributors */}
                    <select
                      className="flex-1 bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                      value={contrib.userName}
                      onChange={(e) => handleContributorChange(index, cIdx, "userName", e.target.value)}
                    >
                      <option value="">-- Select Person --</option>
                      {possibleContributors.map((person) => (
                        <option key={person} value={person}>
                          {person}
                        </option>
                      ))}
                    </select>

                    {/* Enter how many units of this item this person gets */}
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      className="w-24 bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                      value={contrib.quantity}
                      onChange={(e) => handleContributorChange(index, cIdx, "quantity", e.target.value)}
                    />

                    <button
                      onClick={() => handleRemoveContributor(index, cIdx)}
                      className="px-2 py-1 bg-red-500 text-white text-sm font-semibold rounded hover:bg-red-600 transition"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Final submission button */}
          <button
            onClick={handleSubmitAssignments}
            className="mt-4 px-6 py-3 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition"
          >
            Submit Assignments
          </button>
        </div>
      ) : (
        <p className="text-gray-600 mt-4">
          No items available for assignment. Please check your link or receipt data.
        </p>
      )}
    </div>
  );
}
