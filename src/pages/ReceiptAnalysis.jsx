import React, { useState, useEffect } from "react";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const db = getFirestore();
const auth = getAuth();

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

  useEffect(() => {
    const storedItemsJSON = localStorage.getItem("receiptItems");
    if (storedItemsJSON) {
      try {
        const parsedItems = JSON.parse(storedItemsJSON);
        const { normalItems, summaryItems } = separateSummaryFromItems(
          parsedItems
        );
        setItems(normalItems);
        setSummary(summaryItems);
      } catch (err) {
        console.error("Error parsing receipt items:", err);
      }
    }
  }, []);

  const handleGenerateMessengerLink = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated.");

      const docRef = doc(db, "receipt_links", user.uid);
      const receiptData = { items, summary, createdAt: new Date().toISOString() };

      await setDoc(docRef, receiptData);

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

  const handleCalculateBreakdown = async () => {
    try {
      const totalTax = summary.find((s) => s.name.toLowerCase().includes("tax"))?.price || 0;
      const totalTip = summary.find((s) => s.name.toLowerCase().includes("tip"))?.price || 0;
      const totalSummary = parseFloat(totalTax) + parseFloat(totalTip);

      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated.");

      const docRef = doc(db, "receipt_assignments", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        alert("No assignments found. Please ensure participants have assigned items.");
        return;
      }

      const assignments = docSnap.data().assignments;

      const totals = assignments.map((assignment) => {
        const itemTotal = assignment.items.reduce(
          (acc, item) => acc + parseFloat(item.price) * parseInt(item.qty, 10),
          0
        );
        const share = (itemTotal / items.reduce((acc, i) => acc + parseFloat(i.price), 0)) * totalSummary;
        return {
          userName: assignment.userName,
          totalOwed: itemTotal + share,
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

  return (
    <div className="pt-28 px-6 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <h1 className="text-2xl font-bold mb-4">Receipt Breakdown</h1>

      {(items.length > 0 || summary.length > 0) && (
        <div className="bg-white p-5 rounded shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <span>🧾</span> Analyzed Receipt Details
          </h2>

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

          {messengerLink && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
              <h4 className="text-md font-bold text-blue-700">Messenger Link</h4>
              <p>{messengerLink}</p>
            </div>
          )}

          {finalBreakdown.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
              <h4 className="text-md font-bold text-green-700">Final Breakdown</h4>
              <ul>
                {finalBreakdown.map((person, idx) => (
                  <li key={idx}>{person.userName}: ${person.totalOwed.toFixed(2)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
