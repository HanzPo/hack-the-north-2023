import { useState } from "react";
import "./App.css";
import { Button, ButtonGroup, Spinner } from "@chakra-ui/react";
import LoginPage from "./pages/LoginPage";
import { Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState();

  return (
    <>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    </>
  );
};

export default App;
