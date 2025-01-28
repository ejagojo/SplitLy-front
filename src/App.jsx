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
import ReceiptAssign from "./pages/ReceiptAssign";
import ConnectedAccounts from "./pages/ConnectedAccounts";
import InputReceipt from "./pages/InputReceipt";
import MySocialsPortal from "./pages/MySocialsPortal";

import "./App.css";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Home page */}
        <Route path="/" element={<Home />} />

        {/* Auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Primary application routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/receipt/input-receipt" element={<InputReceipt />} />
        <Route path="/receipt/upload" element={<UploadReceipt />} />
        <Route path="/receipt/history" element={<ReceiptHistory />} />
        <Route path="/receipt/analysis" element={<ReceiptAnalysis />} />
        <Route path="/receipt/assign/:userId" element={<ReceiptAssign />} />
        <Route path="/interactive-messenger" element={<InteractiveMessenger />} />
        <Route path="/final-calculation" element={<FinalCalculation />} />
        <Route path="/payments/accounts" element={<ConnectedAccounts />} />
        <Route path="/mysocials/:portalId" element={<MySocialsPortal />} />
      </Routes>
    </>
  );
}

export default App;
