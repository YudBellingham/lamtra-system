import { BrowserRouter, Route, Routes } from "react-router-dom";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import HomePage from "./pages/HomePage";
import VeLamtra from "./pages/VeLamtra";
import TinTuc from "./pages/TinTuc";
import TuyenDung from "./pages/TuyenDung";
import CuaHang from "./pages/CuaHang";
import SanPham from "./pages/SanPham";
import Feedbacks from "./pages/Feedbacks";

function App() {
  return (
    <BrowserRouter>
      <Header />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/ve-lamtra" element={<VeLamtra />} />
        <Route path="/tin-tuc" element={<TinTuc />} />
        <Route path="/tuyen-dung" element={<TuyenDung />} />
        <Route path="/cua-hang" element={<CuaHang />} />
        <Route path="/san-pham" element={<SanPham />} />
        <Route path="/feedbacks" element={<Feedbacks />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}

export default App;
