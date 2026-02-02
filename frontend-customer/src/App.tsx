import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import "./App.css";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import PageBackground from "./components/PageBackground/PageBackground";
import HomePage from "./pages/HomePage";
import VeLamtra from "./pages/VeLamtra";
import TinTuc from "./pages/TinTuc";
import TuyenDung from "./pages/TuyenDung";
import CuaHang from "./pages/CuaHang";
import SanPham from "./pages/SanPham";
import Feedbacks from "./pages/Feedbacks";

function AppContent() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <div className="app-wrapper">
      <Header />

      <main className="app-content">
        <PageBackground showCocTraSua={isHomePage} />
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
