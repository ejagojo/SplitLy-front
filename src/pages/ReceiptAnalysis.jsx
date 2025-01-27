import React, { useState, useEffect } from "react";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const db = getFirestore();
const auth = getAuth();

/**
 * Separates "summary" lines (e.g., Tax, Tip, Subtotal, Total) from normal items.
 */
function separateSummaryFromItems(allItems) {
  const summaryKeywords = ["Tax", "Tip", "Subtotal", "Total", "Summary Item"];
  const normalItems = [];
  const summaryItems = [];

  allItems.forEach((item) => {
    if (
      summaryKeywords.some((keyword) =>
        item.name.toLowerCase().includes(keyword.toLowerCase())
      )
    ) {
      summaryItems.push(item);
    } else {
      normalItems.push(item);
    }
  });

  return { normalItems, summaryItems };
}

export default function ReceiptAnalysis() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState([]);
  const [messengerLink, setMessengerLink] = useState("");
  const [finalBreakdown, setFinalBreakdown] = useState([]);

  // Load items + summary from localStorage, including Tax & Tip
  useEffect(() => {
    const storedItemsJSON = localStorage.getItem("receiptItems");
    let normalItems = [];
    let summaryItems = [];

    if (storedItemsJSON) {
      try {
        const parsedItems = JSON.parse(storedItemsJSON);
        const { normalItems: nm, summaryItems: sm } =
          separateSummaryFromItems(parsedItems);
        normalItems = nm;
        summaryItems = sm;
      } catch (err) {
        console.error("Error parsing receipt items:", err);
      }
    }

    const taxValue = parseFloat(localStorage.getItem("receiptTax")) || 0;
    const tipValue = parseFloat(localStorage.getItem("receiptTip")) || 0;

    if (taxValue > 0) {
      summaryItems.push({ name: "Tax", price: taxValue, qty: "1" });
    }
    if (tipValue > 0) {
      summaryItems.push({ name: "Tip", price: tipValue, qty: "1" });
    }

    setItems(normalItems);
    setSummary(summaryItems);
  }, []);

  // Listen for assignmentsComplete at receipt_links/{user.uid}
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const docRef = doc(db, "receipt_links", user.uid);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.assignmentsComplete === true) {
          alert("All participants have completed their assignments!");
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Generate the messenger link (receipt_links/{user.uid}), resetting assignmentsComplete
  const handleGenerateMessengerLink = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated.");

      const receiptData = {
        items,
        summary,
        createdAt: new Date().toISOString(),
        assignmentsComplete: false
      };

      const linkDocRef = doc(db, "receipt_links", user.uid);
      await setDoc(linkDocRef, receiptData);

      const link = `${window.location.origin}/receipt/assign/${user.uid}`;
      setMessengerLink(link);

      alert("Messenger link generated successfully!");
    } catch (err) {
      if (err.code === "permission-denied") {
        alert("You do not have permission to perform this action.");
      } else {
        console.error("Error generating link:", err);
        alert("An unexpected error occurred while generating the link.");
      }
    }
  };

  // Retrieves assigned items from receipt_assignments/{user.uid} to compute final owed amounts
  const handleCalculateBreakdown = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated.");

      const assignmentDocRef = doc(db, "receipt_assignments", user.uid);
      const assignmentSnap = await getDoc(assignmentDocRef);

      if (!assignmentSnap.exists()) {
        alert("No assignments found. Participants have not assigned items yet.");
        return;
      }

      const assignments = assignmentSnap.data().assignments;
      const sumOfItemPrices = items.reduce((acc, i) => acc + parseFloat(i.price || 0), 0);

      const taxItem = summary.find((s) => s.name.toLowerCase().includes("tax"));
      const tipItem = summary.find((s) => s.name.toLowerCase().includes("tip"));
      const totalTax = parseFloat(taxItem?.price || 0);
      const totalTip = parseFloat(tipItem?.price || 0);
      const totalSummary = totalTax + totalTip;

      const totals = assignments.map((assignment) => {
        const assignedItem = assignment.item || {};
        const qty = parseInt(assignedItem.qty || "1", 10);
        const price = parseFloat(assignedItem.price || "0");
        const itemTotal = qty * price;

        let share = 0;
        if (sumOfItemPrices > 0) {
          share = (itemTotal / sumOfItemPrices) * totalSummary;
        }

        return {
          userName: assignment.userName,
          totalOwed: itemTotal + share
        };
      });

      setFinalBreakdown(totals);
      alert("Final breakdown calculated successfully!");
    } catch (err) {
      if (err.code === "permission-denied") {
        alert("You do not have permission to access this data.");
      } else {
        console.error("Error calculating breakdown:", err);
        alert("An unexpected error occurred while calculating the breakdown.");
      }
    }
  };

  // Copy link helper
  const handleCopyLink = () => {
    if (!messengerLink) return;
    navigator.clipboard
      .writeText(messengerLink)
      .then(() => {
        alert("Link copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy link:", err);
      });
  };

  // Optional share link helper (for browsers supporting the Web Share API)
  const handleShareLink = () => {
    if (!messengerLink) return;

    if (navigator.share) {
      navigator
        .share({
          title: "Split Receipt",
          text: "Assign your items in this shared receipt!",
          url: messengerLink
        })
        .catch((err) => console.error("Sharing failed:", err));
    } else {
      alert("Sharing not supported by your browser, but the link was copied!");
      handleCopyLink();
    }
  };

  return (
    <div className="pt-28 px-6 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <h1 className="text-2xl font-bold mb-4">Receipt Breakdown</h1>

      {(items.length > 0 || summary.length > 0) && (
        <div className="bg-white p-5 rounded shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <span>🧾</span> Analyzed Receipt Details
          </h2>

          {/* Display normal items */}
          {items.length > 0 && (
            <div className="mb-6 p-4 bg-purple-50 rounded border border-purple-200">
              <h3 className="text-md font-bold mb-2 text-purple-700">🛒 Items</h3>
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
                    <tr key={idx} className="border-b">
                      <td className="p-2">{item.qty}</td>
                      <td className="p-2">{item.name}</td>
                      <td className="p-2">${item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Buttons for generating link and final breakdown */}
          <div className="mt-6 flex flex-col md:flex-row gap-4">
            <button
              onClick={handleGenerateMessengerLink}
              className="px-5 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700"
            >
              Generate Messenger Link
            </button>
            <button
              onClick={handleCalculateBreakdown}
              className="px-5 py-3 bg-green-600 text-white font-semibold rounded hover:bg-green-700"
            >
              Calculate Final Breakdown
            </button>
          </div>

          {/* Show the newly generated link in an enhanced card with copy/share */}
          {messengerLink && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
              <h4 className="text-md font-bold text-blue-700 mb-2">
                Messenger Link
              </h4>
              <div className="bg-white border border-gray-200 rounded p-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <input
                  type="text"
                  readOnly
                  value={messengerLink}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-sm text-gray-700 focus:outline-none cursor-text"
                  onClick={handleCopyLink}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-1 bg-gray-300 text-gray-800 text-sm font-semibold rounded hover:bg-gray-400 transition"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={handleShareLink}
                    className="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded hover:bg-blue-600 transition"
                  >
                    Share Link
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Improved Final Breakdown: card-style display */}
          {finalBreakdown.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
              <h4 className="text-md font-bold text-green-700">Final Breakdown</h4>
              <div className="grid gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-3">
                {finalBreakdown.map((person, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-4 rounded shadow border border-green-200 flex flex-col gap-2"
                  >
                    <h5 className="text-lg font-semibold text-gray-700 capitalize">
                      {person.userName}
                    </h5>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Owes:</span>{" "}
                      <span className="text-gray-800">
                        ${person.totalOwed.toFixed(2)}
                      </span>
                    </p>
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
