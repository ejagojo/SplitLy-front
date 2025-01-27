import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Predefined item templates for auto-suggestions
const predefinedItems = [
  { qty: "1", name: "Coffee", price: "2.50" },
  { qty: "1", name: "Sandwich", price: "5.00" },
  { qty: "1", name: "Salad", price: "4.50" },
  { qty: "1", name: "Juice", price: "3.00" },
];

export default function InputReceipt() {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Filter items based on the search term for suggestions
  const filteredSuggestions = predefinedItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add a predefined item to the list
  const handleAddPredefinedItem = (item) => {
    setItems((prevItems) => [...prevItems, item]);
    setSearchTerm(""); // Clear the search field after selection
  };

  // Add a blank item for full manual entry
  const handleAddItem = () => {
    setItems((prevItems) => [
      ...prevItems,
      { qty: "1", name: "New Item", price: "0.00" },
    ]);
  };

  // Handle changes to a specific item's fields
  const handleItemChange = (index, field, value) => {
    setItems((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      return updatedItems;
    });
  };

  // Remove an item from the list by index
  const handleRemoveItem = (index) => {
    setItems((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems.splice(index, 1);
      return updatedItems;
    });
  };

  // Submit items and navigate to the ReceiptAnalysis page
  const handleSubmit = () => {
    if (items.length === 0) {
      alert("Please add at least one item before submitting.");
      return;
    }
    // Save items to localStorage for analysis
    localStorage.setItem("receiptItems", JSON.stringify(items));
    alert("Items saved successfully!");
    navigate("/receipt/analysis"); // Navigate to ReceiptAnalysis page
  };

  return (
    <div className="pt-28 px-6 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <h1 className="text-2xl font-bold mb-4">Input Receipt</h1>
      <p className="text-gray-600 mb-6">
        Manually input your receipt details below. Search for common items, use
        suggestions, or add your custom entries. Once done, click "Submit" to
        save your receipt.
      </p>

      {/* Search and Suggestions Section */}
      <div className="mb-6">
        <label
          htmlFor="search"
          className="block text-lg font-medium text-gray-700 mb-2"
        >
          Search for Common Items
        </label>
        <input
          type="text"
          id="search"
          className="w-full bg-purple-50 border border-purple-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
          placeholder="Type item name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <ul className="mt-3 bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-auto">
            {filteredSuggestions.map((item, index) => (
              <li
                key={index}
                className="p-3 hover:bg-purple-100 cursor-pointer flex justify-between items-center"
                onClick={() => handleAddPredefinedItem(item)}
              >
                <span>{item.name}</span>
                <span className="text-gray-500">${item.price}</span>
              </li>
            ))}
            {filteredSuggestions.length === 0 && (
              <li className="p-3 text-gray-500">No matching items found</li>
            )}
          </ul>
        )}
      </div>

      {/* Items Table Section */}
      <div className="mt-6 p-5 bg-white rounded shadow w-full max-w-3xl">
        <h3 className="text-xl font-bold mb-3 text-gray-800 flex items-center gap-2">
          <span>🛒</span> Items (Manually Entered)
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Adjust the quantity, name, or price for each row. Use “Add New Item”
          to add additional items to the list.
        </p>

        {/* Items Table */}
        {items.length > 0 ? (
          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-purple-100 text-purple-700 uppercase">
                  <th className="p-2 font-semibold w-20">Qty</th>
                  <th className="p-2 font-semibold w-1/2">Item / Label</th>
                  <th className="p-2 font-semibold w-24">Price</th>
                  <th className="p-2 font-semibold w-24">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b last:border-none">
                    <td className="p-2">
                      <input
                        type="number"
                        className="w-16 bg-purple-50 border border-purple-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                        value={item.qty}
                        onChange={(e) =>
                          handleItemChange(idx, "qty", e.target.value)
                        }
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        className="bg-purple-50 border border-purple-200 rounded px-2 py-1 w-full min-w-[240px] focus:outline-none focus:ring-2 focus:ring-purple-400"
                        value={item.name}
                        onChange={(e) =>
                          handleItemChange(idx, "name", e.target.value)
                        }
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.01"
                        className="w-20 bg-purple-50 border border-purple-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                        value={item.price}
                        onChange={(e) =>
                          handleItemChange(idx, "price", e.target.value)
                        }
                      />
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="px-3 py-1 bg-red-500 text-white rounded shadow hover:bg-red-600 transition"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 mb-4">No items added yet.</p>
        )}

        {/* Add New Item Button */}
        <div className="mt-4">
          <button
            onClick={handleAddItem}
            className="px-5 py-2 bg-blue-600 text-white font-semibold rounded shadow hover:bg-blue-700 transition"
          >
            + Add New Item
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-6">
        <button
          onClick={handleSubmit}
          className="px-6 py-3 bg-green-600 text-white font-semibold rounded shadow hover:bg-green-700 transition"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
