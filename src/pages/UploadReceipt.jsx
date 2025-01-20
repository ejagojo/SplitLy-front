import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";

/**
 * UploadReceipt component:
 * - Allows users to drag-and-drop or select a file (receipt image).
 * - Previews the uploaded image.
 * - Includes a button to "Analyze Receipt," which simulates calling an API.
 * 
 * Notes:
 * 1. We utilize 'react-dropzone' to handle drag-and-drop. 
 *    If you haven't installed it:
 *      npm install react-dropzone
 * 
 * 2. The "Analyze Receipt" button triggers a mock function that 
 *    would normally upload the file to your backend (e.g., 
 *    Spring Boot API with Tesseract/Google Vision OCR).
 * 
 * 3. For a real implementation, you would replace 
 *    "simulateAnalyzeReceipt" with an actual POST request 
 *    (using fetch or Axios) to your receipt processing endpoint.
 */

export default function UploadReceipt() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(""); 
  const navigate = useNavigate();

  // Mock function simulating backend OCR request
  const simulateAnalyzeReceipt = async (file) => {
    setUploadStatus("Analyzing receipt...");
    // In real code, you'd do something like:
    // const formData = new FormData();
    // formData.append("receiptImage", file);
    // const response = await fetch("/api/receipt/upload", { method: "POST", body: formData });
    // ... handle response
    // For now, we simulate a short delay:
    return new Promise((resolve) => {
      setTimeout(() => {
        setUploadStatus("Analysis complete! Redirecting...");
        resolve(true);
      }, 2000);
    });
  };

  // Handle the 'Analyze Receipt' button
  const handleAnalyzeReceipt = async () => {
    if (!selectedFile) {
      alert("Please upload a receipt file first!");
      return;
    }
    try {
      await simulateAnalyzeReceipt(selectedFile);
      // For demonstration, we navigate to the "ReceiptAnalysis" page
      // once the mock analysis is "complete."
      navigate("/receipt/analysis");
    } catch (error) {
      alert("Error analyzing receipt: " + error.message);
      setUploadStatus("");
    }
  };

  // onDrop callback for react-dropzone
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setUploadStatus("");
    }
  }, []);

  // Configure react-dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"],
    },
    onDrop,
    multiple: false,
  });

  return (
    <div className="pt-28 px-6 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <h1 className="text-2xl font-bold mb-4">Upload Receipt</h1>

      <p className="text-gray-600 mb-6">
        Upload your receipt image below. Once uploaded, click "Analyze Receipt" to process 
        it using OCR and get itemized details. (Currently simulated on the front end.)
      </p>

      {/**
       * Drag-and-drop area 
       */}
      <div
        {...getRootProps()}
        className={`mb-4 p-8 border-2 border-dashed rounded cursor-pointer transition-all ${
          isDragActive
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 bg-white hover:bg-gray-50"
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-center text-blue-600">Drop the files here...</p>
        ) : (
          <p className="text-center text-gray-600">
            Drag & drop an image here, or click to select one
          </p>
        )}
      </div>

      {/**
       * Preview of the uploaded image 
       */}
      {selectedFile && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Preview:</h2>
          <img
            src={URL.createObjectURL(selectedFile)}
            alt="Receipt Preview"
            className="max-w-xs border rounded shadow"
          />
        </div>
      )}

      {/**
       * Upload/Analyze button 
       */}
      <div className="flex flex-col items-start">
        <button
          onClick={handleAnalyzeReceipt}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded shadow hover:bg-blue-700 transition"
        >
          Analyze Receipt
        </button>

        {uploadStatus && (
          <p className="mt-4 text-gray-700">
            {uploadStatus}
          </p>
        )}
      </div>
    </div>
  );
}
