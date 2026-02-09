import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import "./App.css";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import PageBackground from "./components/PageBackground/PageBackground";
import HomePage from "./pages/HomePage/HomePage";
import VeLamtra from "./pages/VeLamTra/VeLamtra";
import TinTuc from "./pages/TinTuc/TinTuc";
import TuyenDung from "./pages/TuyenDung/TuyenDung";
import CuaHang from "./pages/CuaHang/CuaHang";
import SanPham from "./pages/SanPham/SanPham";
import Feedbacks from "./pages/Feedbacks/Feedbacks";

function AppContent() {
  const location = useLocation();
  const pageTypeMap: Record<string, any> = {
    "/": "home",
    "/ve-lamtra": "ve-lamtra",
    "/tin-tuc": "tin-tuc",
    "/tuyen-dung": "tuyen-dung",
    "/cua-hang": "cua-hang",
    "/san-pham": "san-pham",
    "/feedbacks": "feedbacks",
  };

  const pageType = pageTypeMap[location.pathname] || "home";

  return (
    <div className="app-wrapper">
      <Header />

      <main className="app-content">
        <PageBackground pageType={pageType} />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/ve-lamtra" element={<VeLamtra />} />
          <Route path="/tin-tuc" element={<TinTuc />} />
          <Route path="/tuyen-dung" element={<TuyenDung />} />
          <Route path="/cua-hang" element={<CuaHang />} />
          <Route path="/san-pham" element={<SanPham />} />
          <Route path="/feedbacks" element={<Feedbacks />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
