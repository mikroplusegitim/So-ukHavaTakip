import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import { Toaster } from "sonner";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/panel" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "#111116",
            border: "1px solid #272730",
            borderRadius: 0,
            color: "#fff",
            fontFamily: "Inter",
          },
        }}
      />
    </div>
  );
}

export default App;
