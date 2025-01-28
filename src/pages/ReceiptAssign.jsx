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
 * covering at least some portion of the item’s total quantity (if you choose).
 * You can also enforce an exact match (sum of contributor qty = item’s qty) if needed.
 */
function isAllItemsAssigned(items, assignments) {
  if (!items.length) return false; // No items => nothing to assign
  // Each item must have at least one contributor with quantity > 0
  return items.every((_, index) => {
    const contributors = assignments[index] || [];
    const assignedQty = contributors.reduce((sum, c) => sum + parseInt(c.quantity || "0", 10), 0);
    return assignedQty > 0; // or sum up to item.qty if exact coverage is required
  });
}

export default function ReceiptAssign() {
  const { userId } = useParams(); // The host user’s ID from the URL
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState([]);

  /**
   * For each item index, we maintain an array of contributor objects:
   *   assignments[index] = [
   *     { userName: "Alice", quantity: "2" },
   *     { userName: "Bob", quantity: "3" }
   *   ]
   */
  const [assignments, setAssignments] = useState([]);

  /**
   * Possible contributor names, set by the host in the UI, e.g. ["Alice", "Bob", "Charlie"].
   */
  const [possibleContributors, setPossibleContributors] = useState([]);

  /**
   * Temporary input for capturing new contributor names (comma-separated).
   */
  const [namesInput, setNamesInput] = useState("");

  /**
   * Fetch the receipt data from Firestore: `receipt_links/{userId}`.
   * Initialize `assignments` with an empty array for each item.
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
          const blankAssignments = (items || []).map(() => []);
          setAssignments(blankAssignments);
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
   * Parse comma-separated names and store them in `possibleContributors`.
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
   * Add a new contributor record to the item at `index`, defaulting to empty fields.
   */
  const handleAddContributor = (index) => {
    setAssignments((prev) => {
      const updated = [...prev];
      updated[index] = [...updated[index], { userName: "", quantity: "" }];
      return updated;
    });
  };

  /**
   * Enforce these rules when changing a contributor’s quantity:
   *  - quantity >= 1
   *  - sum of all contributor quantities <= the item’s total quantity
   */
  const handleContributorChange = (itemIndex, contribIndex, field, newValue) => {
    setAssignments((prev) => {
      const updated = [...prev];
      const contributors = [...updated[itemIndex]];
      const oldData = contributors[contribIndex];
      const maxQty = parseInt(items[itemIndex]?.qty || "1", 10);

      const newData = { ...oldData, [field]: newValue };

      if (field === "quantity") {
        let parsedQty = parseInt(newValue, 10);
        if (isNaN(parsedQty) || parsedQty < 1) {
          parsedQty = 1;
        }
        newData.quantity = parsedQty.toString();
      }

      // Temporarily set the new data
      contributors[contribIndex] = newData;
      // Now verify if total assigned <= maxQty
      const sumOfContribs = contributors.reduce((sum, c) => sum + parseInt(c.quantity || "0", 10), 0);
      if (sumOfContribs > maxQty) {
        alert(`Cannot exceed total quantity of ${maxQty} for this item.`);
        // Revert to old data
        contributors[contribIndex] = oldData;
      } else {
        updated[itemIndex] = contributors;
      }
      return updated;
    });
  };

  /**
   * Remove a contributor from the list for a specific item.
   */
  const handleRemoveContributor = (itemIndex, contribIndex) => {
    setAssignments((prev) => {
      const updated = [...prev];
      const itemContributors = [...updated[itemIndex]];
      itemContributors.splice(contribIndex, 1);
      updated[itemIndex] = itemContributors;
      return updated;
    });
  };

  /**
   * Submit the final assignments to Firestore at `receipt_assignments/{userId}`.
   * If all items are assigned, we mark `assignmentsComplete = true`.
   */
  const handleSubmitAssignments = async () => {
    try {
      const assignmentPayload = items.map((item, idx) => ({
        item,
        contributors: assignments[idx] || []
      }));

      const assignmentRef = doc(db, "receipt_assignments", userId);
      const docSnap = await getDoc(assignmentRef);

      const now = new Date().toISOString();
      if (docSnap.exists()) {
        await updateDoc(assignmentRef, {
          assignments: assignmentPayload,
          updatedAt: now
        });
      } else {
        await setDoc(assignmentRef, {
          assignments: assignmentPayload,
          createdAt: now,
          updatedAt: now
        });
      }

      // If everything is assigned, notify the host in `receipt_links`
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

      {/* 
        Additional Instructions:
        This block helps participants and the host understand how to handle item assignments
      */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded p-4 text-gray-700">
        <h2 className="text-md font-semibold text-blue-700 mb-2">
          Assignment Guidelines
        </h2>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>
            Host adds or inputs contributor names (e.g., "Alice, Bob, Charlie") below.
          </li>
          <li>
            Each item has a total quantity. Contributors must claim how many units they consumed.
          </li>
          <li>
            The total assigned units can’t exceed the item’s total quantity.
          </li>
          <li>
            You can add multiple contributors for each item if multiple people shared it.
          </li>
          <li>
            Once everyone is done, click “Submit Assignments” so the host is notified.
          </li>
        </ul>
      </div>

      {/* 
        1) Host user enters list of names for potential contributors 
      */}
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

      {/* 
        2) Display items and let user assign contributors from the saved names 
      */}
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
