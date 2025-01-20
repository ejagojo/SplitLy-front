import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import UploadReceipt from "./pages/UploadReceipt";
import ReceiptAnalysis from "./pages/ReceiptAnalysis";
import InteractiveMessenger from "./pages/InteractiveMessenger";
import FinalCalculation from "./pages/FinalCalculation";
import ReceiptHistory from "./pages/ReceiptHistory";
import ConnectedAccounts from "./pages/ConnectedAccounts";

import "./App.css";

function App() {
  return (
    <>
      {/**
       * Navbar is fixed; the rest of the content 
       * adjusts via extra padding or margins in 
       * the individual pages.
       */}
      <Navbar />

      {/**
       * The main router area. 
       * We do NOT add extra padding or margin 
       * here because each page can handle it 
       * individually (e.g., Dashboard uses pt-28).
       */}
      <Routes>
        {/* Home page */}
        <Route path="/" element={<Home />} />

        {/* Auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Primary application routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/receipt/upload" element={<UploadReceipt />} />
        <Route path="/receipt/history" element={<ReceiptHistory />} />
        <Route path="/receipt/analysis" element={<ReceiptAnalysis />} />
        <Route path="/interactive-messenger" element={<InteractiveMessenger />} />
        <Route path="/final-calculation" element={<FinalCalculation />} />
        <Route path="/payments/accounts" element={<ConnectedAccounts />} />
      </Routes>
    </>
  );
}

export default App;
