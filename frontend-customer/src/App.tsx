import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import "./App.css";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import Chatbot from "./components/Chatbot/Chatbot";
import PageBackground from "./components/PageBackground/PageBackground";
import HomePage from "./pages/HomePage/HomePage";
import VeLamtra from "./pages/VeLamTra/VeLamtra";
import TinTuc from "./pages/TinTuc/TinTuc";
import TinTucDetail from "./pages/TinTuc/TinTucDetail";
import TuyenDung from "./pages/TuyenDung/TuyenDung";
import TuyenDungDetail from "./pages/TuyenDung/TuyenDungDetail";
import CuaHang from "./pages/CuaHang/CuaHang";
import SanPham from "./pages/SanPham/SanPham";
import SanPhamDetail from "./pages/SanPham/SanPhamDetail";
import Feedbacks from "./pages/Feedbacks/Feedbacks";
import Auth from "./pages/Auth/Auth";
import Profile from "./pages/Profile/Profile";
import Cart from "./pages/Cart/Cart";
import PaymentResult from "./pages/PaymentResult/PaymentResult";
import OrderTracking from "./pages/OrderTracking/OrderTracking";
import PhoneRequirementModal from "./components/PhoneRequirementModal/PhoneRequirementModal";
import { supabase } from "./lib/supabase";
import { useEffect, useState } from "react";
import { CartProvider } from "./context/CartContext";
import { Toaster } from 'react-hot-toast';

type PageType =
  | "home"
  | "ve-lamtra"
  | "tin-tuc"
  | "tuyen-dung"
  | "cua-hang"
  | "san-pham"
  | "feedbacks"
  | "profile"
  | "cart"
  | "payment-result"
  | "order-tracking";

function AppContent() {
  const location = useLocation();
  const pageTypeMap: Record<string, PageType> = {
    "/": "home",
    "/ve-lamtra": "ve-lamtra",
    "/tin-tuc": "tin-tuc",
    "/tuyen-dung": "tuyen-dung",
    "/cua-hang": "cua-hang",
    "/san-pham": "san-pham",
    "/feedbacks": "feedbacks",
    "/profile": "profile",
    "/cart": "cart",
    "/payment-result": "payment-result",
  };

  let pageType: PageType = "home";
  if (pageTypeMap[location.pathname]) {
    pageType = pageTypeMap[location.pathname];
  } else if (location.pathname.startsWith("/tin-tuc")) {
    pageType = "tin-tuc";
  } else if (location.pathname.startsWith("/san-pham")) {
    pageType = "san-pham";
  } else if (location.pathname.startsWith("/ve-lamtra")) {
    pageType = "ve-lamtra";
  } else if (location.pathname.startsWith("/tuyen-dung")) {
    pageType = "tuyen-dung";
  } else if (location.pathname.startsWith("/cua-hang")) {
    pageType = "cua-hang";
  } else if (location.pathname.startsWith("/feedbacks")) {
    pageType = "feedbacks";
  } else if (location.pathname.startsWith("/order/")) {
    pageType = "order-tracking";
  }

  return (
    <div className="app-wrapper">
      <Header />

      <main className="app-content">
        <PageBackground pageType={pageType} />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/ve-lamtra" element={<VeLamtra />} />
          <Route path="/tin-tuc" element={<TinTuc />} />
          <Route path="/tin-tuc/:id" element={<TinTucDetail />} />
          <Route path="/tuyen-dung" element={<TuyenDung />} />
          <Route path="/tuyen-dung/:location" element={<TuyenDungDetail />} />
          <Route path="/cua-hang" element={<CuaHang />} />
          <Route path="/san-pham" element={<SanPham />} />
          <Route path="/san-pham/:id" element={<SanPhamDetail />} />
          <Route path="/feedbacks" element={<Feedbacks />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/payment-result" element={<PaymentResult />} />
          <Route path="/order/:id" element={<OrderTracking />} />
        </Routes>
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
}

function App() {
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  useEffect(() => {
    const checkCustomerData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase.from('customers').select('*').eq('authid', session.user.id).maybeSingle();
        if (data) {
           setCustomerInfo(data);
           if (!data.phone) {
             setShowPhoneModal(true);
           }
        }
      }
    };
    checkCustomerData();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
       if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          checkCustomerData();
       } else if (event === 'SIGNED_OUT') {
          setCustomerInfo(null);
          setShowPhoneModal(false);
       }
    });

    return () => {
      authListener.subscription.unsubscribe();
    }
  }, []);

  const handlePhoneUpdated = () => {
    setShowPhoneModal(false);
  };

  return (
    <CartProvider>
      <Toaster position="bottom-right" toastOptions={{ style: { fontFamily: 'Quicksand, sans-serif', fontWeight: 600, color: '#d81b60', borderRadius: '12px' } }} />
      {showPhoneModal && customerInfo && <PhoneRequirementModal customerData={customerInfo} onSuccess={handlePhoneUpdated} />}
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="*" element={<AppContent />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
