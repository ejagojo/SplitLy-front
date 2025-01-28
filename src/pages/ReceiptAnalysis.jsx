/**
 * File: /src/pages/ReceiptAnalysis.jsx
 */

import React, { useState, useEffect } from "react";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  addDoc,
  deleteDoc
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
  const [assignedOverview, setAssignedOverview] = useState([]); // For “who’s assigned” overview

  /**
   * On mount, load items + summary from localStorage, including any Tax & Tip.
   */
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

    // Also fetch numeric Tax & Tip from localStorage
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

  /**
   * Watches `receipt_assignments/{user.uid}` in real-time to build
   * an overview of which items are assigned or unassigned.
   */
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || items.length === 0) return;

    const assignmentDocRef = doc(db, "receipt_assignments", user.uid);
    console.log("[assignedOverview effect] Setting up onSnapshot for assignments...");

    const unsubAssign = onSnapshot(assignmentDocRef, (snap) => {
      if (snap.exists()) {
        const assignedData = snap.data().assignments || [];
        console.log("[assignedOverview effect] assignmentDoc data:", assignedData);

        const mapAssigned = new Map();
        assignedData.forEach((entry) => {
          const { item, contributors } = entry;
          const key = `${item.name}|${item.price}`;
          mapAssigned.set(key, contributors);
        });

        const merged = items.map((it) => {
          const key = `${it.name}|${it.price}`;
          const contributors = mapAssigned.get(key) || [];
          return { ...it, contributors };
        });
        setAssignedOverview(merged);
      } else {
        console.log("[assignedOverview effect] No assignment doc => unassigned everything.");
        // No assignment doc => everything unassigned
        const unassigned = items.map((it) => ({ ...it, contributors: [] }));
        setAssignedOverview(unassigned);
      }
    });

    return () => unsubAssign();
  }, [items]);

  /**
   * (FIX) Single effect that checks receipt_links + assignedOverview after it updates.
   * If `assignmentsComplete === true` and we see no unassigned items, we trigger the alert.
   */
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    if (assignedOverview.length === 0) return;

    // We'll fetch the current receipt_links doc to see if assignmentsComplete is set
    const linkDocRef = doc(db, "receipt_links", user.uid);

    async function checkAssignmentsStatus() {
      try {
        const linkSnap = await getDoc(linkDocRef);
        if (!linkSnap.exists()) {
          console.log("[checkAssignmentsStatus] No receipt_links doc found.");
          return;
        }
        const data = linkSnap.data();
        console.log("[checkAssignmentsStatus] linkDoc data:", data);

        if (data.assignmentsComplete === true) {
          // Check if there's ANY item that is still unassigned
          const anyUnassigned = assignedOverview.some((item) => {
            const totalAssignedQty = (item.contributors || []).reduce(
              (sum, c) => sum + parseInt(c.quantity || "0", 10),
              0
            );
            console.log(
              `[checkAssignmentsStatus] item "${item.name}" assigned ${totalAssignedQty} / ${item.qty}`
            );
            return totalAssignedQty < parseInt(item.qty || "1", 10);
          });

          console.log("[checkAssignmentsStatus] anyUnassigned =", anyUnassigned);
          if (!anyUnassigned) {
            alert("All participants have completed their assignments!");
          }
        }
      } catch (err) {
        console.error("[checkAssignmentsStatus] Error:", err);
      }
    }

    checkAssignmentsStatus();
  }, [assignedOverview]);

  /**
   * Generates the link to assign items, stored at `receipt_links/{user.uid}`.
   * Also clears any previous assignments so each new link starts fresh.
   */
  const handleGenerateMessengerLink = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated.");

      // Delete old assignment doc so we don't reuse old data
      const assignmentDocRef = doc(db, "receipt_assignments", user.uid);
      await deleteDoc(assignmentDocRef).catch((err) => {
        // If doc doesn't exist, ignore the error
        if (err.code !== "not-found") {
          throw err;
        }
      });

      // Create or overwrite the doc in receipt_links
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

  /**
   * Calculates final cost breakdown per person, aggregated by userName,
   * based on partial item assignments in `receipt_assignments/{user.uid}`.
   */
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

      const data = assignmentSnap.data().assignments || [];
      console.log("[handleCalculateBreakdown] Found assignments data:", data);

      const userTotals = {};

      // Sum of normal items for fair distribution of tax/tip
      const sumOfItemPrices = items.reduce(
        (acc, i) =>
          acc + parseFloat(i.price || 0) * parseInt(i.qty || "1", 10),
        0
      );
      console.log("[handleCalculateBreakdown] sumOfItemPrices:", sumOfItemPrices);

      // Identify total Tax & Tip
      const taxItem = summary.find((s) => s.name.toLowerCase().includes("tax"));
      const tipItem = summary.find((s) => s.name.toLowerCase().includes("tip"));
      const totalTax = parseFloat(taxItem?.price || 0);
      const totalTip = parseFloat(tipItem?.price || 0);
      console.log("[handleCalculateBreakdown] totalTax:", totalTax, " totalTip:", totalTip);

      // Build userTotals
      data.forEach(({ item, contributors }) => {
        const itemName = item.name || "Unknown Item";
        const priceEach = parseFloat(item.price || "0");
        console.log("[handleCalculateBreakdown] Processing item:", itemName);

        contributors.forEach(({ userName, quantity }) => {
          if (!userName || !quantity) return;
          const partialQty = parseInt(quantity, 10) || 0;
          if (partialQty <= 0) return;

          const partialBaseCost = partialQty * priceEach;
          let partialTax = 0;
          let partialTip = 0;
          if (sumOfItemPrices > 0) {
            partialTax = (partialBaseCost / sumOfItemPrices) * totalTax;
            partialTip = (partialBaseCost / sumOfItemPrices) * totalTip;
          }

          if (!userTotals[userName]) {
            userTotals[userName] = {
              userName,
              items: [],
              totalOwed: 0
            };
          }

          userTotals[userName].items.push({
            itemName,
            partialQty,
            partialBaseCost,
            partialTax,
            partialTip
          });
          userTotals[userName].totalOwed +=
            partialBaseCost + partialTax + partialTip;
        });
      });

      setFinalBreakdown(Object.values(userTotals));
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

  // Optional share link
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

  /**
   * Saves the final breakdown to Firestore so it’s available in Receipt History.
   */
  const handleSaveBreakdown = async () => {
    try {
      if (!finalBreakdown || finalBreakdown.length === 0) {
        alert("No final breakdown to save. Please calculate the breakdown first.");
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        alert("User not authenticated.");
        return;
      }

      // Calculate a total from the finalBreakdown to store for quick reference
      const totalOwedAll = finalBreakdown.reduce((acc, entry) => {
        return acc + entry.totalOwed;
      }, 0);
      console.log("[handleSaveBreakdown] totalOwedAll:", totalOwedAll);

      // Create a new doc in the "receipts" collection
      await addDoc(collection(db, "receipts"), {
        userId: user.uid,
        name: `Receipt by ${user.email || "Unknown User"}`,
        date: new Date().toISOString(),
        status: "analyzed",
        total: parseFloat(totalOwedAll.toFixed(2)),
        breakdown: finalBreakdown
      });

      alert("Breakdown saved successfully!");
    } catch (err) {
      console.error("Error saving breakdown:", err);
      alert("An error occurred while saving the breakdown.");
    }
  };

  return (
    <div className="pt-28 px-6 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <h1 className="text-2xl font-bold mb-4">Receipt Breakdown</h1>

      {/* 
        Additional Instructions:
        This section guides the user through the entire process:
      */}
      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6 text-gray-700">
        <h2 className="text-md font-semibold text-blue-700 mb-2">
          How It Works
        </h2>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>
            <span className="font-medium">1. Input your receipt items:</span>
            Use the "Input Receipt" page to add each item’s name, quantity, and
            price, along with optional Tax & Tip.
          </li>
          <li>
            <span className="font-medium">2. Generate an assignment link:</span>
            Return here and click “Generate Messenger Link” to share a unique
            URL with your friends.
          </li>
          <li>
            <span className="font-medium">3. Contributors assign themselves:</span>
            Everyone accesses the link and selects their name + how many units
            of each item they’re responsible for.
          </li>
          <li>
            <span className="font-medium">4. Monitor progress:</span>
            You’ll see who’s assigned and who hasn’t, marked with “Unassigned”
            if any item is still pending.
          </li>
          <li>
            <span className="font-medium">5. Calculate Final Breakdown:</span>
            When all assignments are complete, you can calculate each person's
            total owed, including their portion of Tax & Tip.
          </li>
        </ul>
      </div>

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

          {/* Assigned Overview Section */}
          {assignedOverview.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 rounded border border-yellow-200">
              <h3 className="text-md font-bold mb-2 text-yellow-700">
                🧑‍🤝‍🧑 Assigned Overview
              </h3>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-yellow-100 text-yellow-700 uppercase">
                    <th className="p-2 font-semibold">Qty</th>
                    <th className="p-2 font-semibold">Item</th>
                    <th className="p-2 font-semibold">Contributors</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedOverview.map((it, idx) => {
                    const totalAssignedQty = (it.contributors || []).reduce(
                      (sum, c) => sum + parseInt(c.quantity || "0", 10),
                      0
                    );
                    console.log(
                      `[ReceiptAnalysis.jsx] assignedOverview item: "${it.name}", ` +
                        `totalAssignedQty = ${totalAssignedQty}, needed = ${it.qty}`
                    );
                    return (
                      <tr key={idx} className="border-b last:border-none">
                        <td className="p-2">{it.qty}</td>
                        <td className="p-2">{it.name}</td>
                        <td className="p-2">
                          {it.contributors && it.contributors.length > 0 ? (
                            <ul className="list-disc list-inside">
                              {it.contributors.map((c, cIdx) => (
                                <li key={cIdx}>
                                  <span className="font-semibold">
                                    {c.userName}:
                                  </span>{" "}
                                  <span>
                                    {c.quantity}{" "}
                                    {parseInt(c.quantity, 10) > 1
                                      ? "units"
                                      : "unit"}
                                  </span>
                                </li>
                              ))}
                              {totalAssignedQty <
                                parseInt(it.qty || "1", 10) && (
                                <li className="text-red-500 font-semibold">
                                  Still unassigned for{" "}
                                  {parseInt(it.qty, 10) - totalAssignedQty} more
                                </li>
                              )}
                            </ul>
                          ) : (
                            <span className="text-red-500 font-semibold">
                              Unassigned
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Action Buttons */}
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

          {/* Messenger Link */}
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

          {/* Final Breakdown */}
          {finalBreakdown.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
              <h4 className="text-md font-bold text-green-700">
                Final Breakdown
              </h4>
              <div className="grid gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-3">
                {finalBreakdown.map((entry, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-4 rounded shadow border border-green-200 flex flex-col gap-2"
                  >
                    <h5 className="text-lg font-semibold text-gray-700 capitalize">
                      {entry.userName}
                    </h5>
                    <div className="space-y-2 text-sm text-gray-600">
                      {entry.items.map((itm, iIdx) => (
                        <div
                          key={iIdx}
                          className="bg-gray-50 p-2 rounded border"
                        >
                          <p>
                            <span className="font-medium">Item:</span>{" "}
                            {itm.itemName} (x{itm.partialQty})
                          </p>
                          <p>
                            <span className="font-medium">Base Cost:</span>{" "}
                            ${itm.partialBaseCost.toFixed(2)}
                          </p>
                          <p>
                            <span className="font-medium">Tax:</span>{" "}
                            ${itm.partialTax.toFixed(2)}{" "}
                            <span className="font-medium">Tip:</span>{" "}
                            ${itm.partialTip.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-700 border-t pt-2 mt-2">
                      <span className="font-medium">Total Owed:</span>{" "}
                      <span className="text-gray-800">
                        ${entry.totalOwed.toFixed(2)}
                      </span>
                    </p>
                  </div>
                ))}
              </div>

              {/* NEW Save Breakdown Button */}
              <button
                onClick={handleSaveBreakdown}
                className="mt-4 px-6 py-3 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 transition"
              >
                Save Breakdown
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
