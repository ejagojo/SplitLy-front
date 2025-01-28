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

  // For “who’s assigned” overview, no changes needed from earlier code
  const [assignedOverview, setAssignedOverview] = useState([]);

  useEffect(() => {
    // Load items + summary from localStorage
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

    // Also load Tax & Tip
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

  // Listen for assignmentsComplete
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

  // For assignedOverview
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || items.length === 0) return;

    const assignmentDocRef = doc(db, "receipt_assignments", user.uid);
    const unsubAssign = onSnapshot(assignmentDocRef, (snap) => {
      if (snap.exists()) {
        // Now each item is { item, contributors: [ { userName, quantity }, ... ] }
        const assignedData = snap.data().assignments || [];
        // We'll flatten them into: itemName|price => array of { userName, quantity }
        // Then merge with local items
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
        // No assignment doc => everything unassigned
        const unassigned = items.map((it) => ({ ...it, contributors: [] }));
        setAssignedOverview(unassigned);
      }
    });

    return () => unsubAssign();
  }, [items]);

  // Generate link
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

  /**
   * Updated final breakdown logic:
   * - We read each item’s array of contributors.
   * - We group them by userName so that each user has a single line, summing partial quantities across multiple items.
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

      // assignmentDocRef stores an array of { item, contributors: [ { userName, quantity } ] }
      const data = assignmentSnap.data().assignments || [];

      // Combine partial quantity across multiple items for each userName
      // building structure: userTotals[userName] = { totalBaseCost, totalTax, totalTip }
      const userTotals = {};

      // Sum of item prices for distributing tax/tip
      const sumOfItemPrices = items.reduce((acc, i) => acc + parseFloat(i.price || 0) * parseInt(i.qty || "1", 10), 0);

      // Identify Tax and Tip
      const taxItem = summary.find((s) => s.name.toLowerCase().includes("tax"));
      const tipItem = summary.find((s) => s.name.toLowerCase().includes("tip"));
      const totalTax = parseFloat(taxItem?.price || 0);
      const totalTip = parseFloat(tipItem?.price || 0);
      const totalSummary = totalTax + totalTip;

      // Process each assigned item, and each contributor in that item
      data.forEach(({ item, contributors }) => {
        const itemName = item.name || "Unknown Item";
        const itemQty = parseInt(item.qty || "1", 10);
        const priceEach = parseFloat(item.price || "0");

        // itemBase = itemQty * priceEach total cost for entire item
        // We'll distribute tax & tip proportionally.
        // But each contributor’s partial quantity => partial base cost => partial share of tax/tip
        contributors.forEach(({ userName, quantity }) => {
          if (!userName || !quantity) return; // skip empty
          const partialQty = parseInt(quantity, 10) || 0;
          if (partialQty <= 0) return;

          const partialBaseCost = partialQty * priceEach;

          // Distribute tax/tip if sumOfItemPrices is known
          let partialTax = 0;
          let partialTip = 0;
          if (sumOfItemPrices > 0) {
            partialTax = (partialBaseCost / sumOfItemPrices) * totalTax;
            partialTip = (partialBaseCost / sumOfItemPrices) * totalTip;
          }

          // Accumulate into userTotals
          if (!userTotals[userName]) {
            userTotals[userName] = {
              userName,
              items: [], // keep an array of { itemName, partialQty, partialBaseCost, partialTax, partialTip }
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
          userTotals[userName].totalOwed += partialBaseCost + partialTax + partialTip;
        });
      });

      // Now we flatten userTotals into finalBreakdown array
      const breakdownArray = Object.values(userTotals);
      setFinalBreakdown(breakdownArray);

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

  // Copy link
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

          {/* Assigned Overview logic remains the same as before */}
          {assignedOverview.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 rounded border border-yellow-200">
              <h3 className="text-md font-bold mb-2 text-yellow-700">🧑‍🤝‍🧑 Assigned Overview</h3>
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
                    return (
                      <tr key={idx} className="border-b last:border-none">
                        <td className="p-2">{it.qty}</td>
                        <td className="p-2">{it.name}</td>
                        <td className="p-2">
                          {it.contributors && it.contributors.length > 0 ? (
                            <ul className="list-disc list-inside">
                              {it.contributors.map((c, cIdx) => (
                                <li key={cIdx}>
                                  <span className="font-semibold">{c.userName}:</span>{" "}
                                  <span>
                                    {c.quantity} {parseInt(c.quantity, 10) > 1 ? "units" : "unit"}
                                  </span>
                                </li>
                              ))}
                              {totalAssignedQty < parseInt(it.qty || "1", 10) && (
                                <li className="text-red-500 font-semibold">
                                  Still unassigned for {parseInt(it.qty, 10) - totalAssignedQty} more
                                </li>
                              )}
                            </ul>
                          ) : (
                            <span className="text-red-500 font-semibold">Unassigned</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Buttons */}
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

          {/* Generated link */}
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

          {/* Final Breakdown, now aggregated by userName */}
          {finalBreakdown.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
              <h4 className="text-md font-bold text-green-700">Final Breakdown</h4>
              <div className="grid gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-3">
                {finalBreakdown.map((entry, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-4 rounded shadow border border-green-200 flex flex-col gap-2"
                  >
                    <h5 className="text-lg font-semibold text-gray-700 capitalize">
                      {entry.userName}
                    </h5>
                    {/* Show each partial item they contributed to */}
                    <div className="space-y-2 text-sm text-gray-600">
                      {entry.items.map((itm, iIdx) => (
                        <div key={iIdx} className="bg-gray-50 p-2 rounded border">
                          <p>
                            <span className="font-medium">Item:</span> {itm.itemName} (x{itm.partialQty})
                          </p>
                          <p>
                            <span className="font-medium">Base Cost:</span> $
                            {itm.partialBaseCost.toFixed(2)}
                          </p>
                          <p>
                            <span className="font-medium">Tax:</span> $
                            {itm.partialTax.toFixed(2)}
                            {"  "}
                            <span className="font-medium">Tip:</span> $
                            {itm.partialTip.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-700 border-t pt-2 mt-2">
                      <span className="font-medium">Total Owed:</span>{" "}
                      <span className="text-gray-800">${entry.totalOwed.toFixed(2)}</span>
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
