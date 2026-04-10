const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const qs = require('qs');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabaseUrl = 'https://tpwgbutlqmubdnnnfhdp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwd2didXRscW11YmRubm5maGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMTgwMDAsImV4cCI6MjA4ODc5NDAwMH0.N11fA3pyYUpbtGPs0yvM9lwQecM6AJIwLEnGKNswfVI';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- KIỂM TRA CẤU HÌNH VNPAY (VẤN ĐỀ 1) ---
const vnp_Config = {
  vnp_TmnCode: process.env.VNP_TMNCODE,
  vnp_HashSecret: process.env.VNP_HASHSECRET,
  vnp_Url: process.env.VNP_URL,
  vnp_ReturnUrl: process.env.VNP_RETURNURL,
};

Object.entries(vnp_Config).forEach(([key, value]) => {
  if (!value) {
    console.error(`[\x1b[31mCRITICAL ERROR\x1b[0m] Thiếu cấu hình VNPay: \x1b[33m${key}\x1b[0m trong file .env!`);
  }
});

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; 
  var dLat = deg2rad(lat2-lat1);  
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; 
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

async function geocodeWithFallback(address_detail, ward, city) {
   const queries = [
      { q: `${address_detail}, ${ward}, ${city}, Vietnam`, level: 1 },
      { q: `${ward}, ${city}, Vietnam`, level: 2 },
      { q: `${city}, Vietnam`, level: 3 }
   ];

   for (const item of queries) {
       try {
           const geoRes = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(item.q)}&format=json&limit=1`, {
              headers: { 'User-Agent': 'LamTra-App/1.0' }
           });
           if (geoRes.data && geoRes.data.length > 0) {
              return {
                 lat: parseFloat(geoRes.data[0].lat),
                 lng: parseFloat(geoRes.data[0].lon),
                 fallbackLevel: item.level
              };
           }
       } catch (err) {
           console.log('Geocode error fallback level', item.level, err.message);
       }
   }
   return null;
}

async function findBestBranch(targetLat, targetLng, cart, supabaseClient) {
    const { data: allBranches } = await supabaseClient.from('branches').select('*');
    if (!allBranches || allBranches.length === 0) return { error: 'Hệ thống chưa có chi nhánh nào.' };

    allBranches.sort((a, b) => {
        if (!a.latitude || !a.longitude) return 1;
        if (!b.latitude || !b.longitude) return -1;
        const distA = getDistanceFromLatLonInKm(targetLat, targetLng, a.latitude, a.longitude);
        const distB = getDistanceFromLatLonInKm(targetLat, targetLng, b.latitude, b.longitude);
        return distA - distB;
    });

    const { data: bStatus } = await supabaseClient.from('branchproductstatus').select('*');
    const { data: activeOrders } = await supabaseClient.from('orders').select('branchid, status').in('status', ['Chờ xác nhận', 'Đang làm']);
    
    const countMap = {};
    if (activeOrders) {
       activeOrders.forEach(o => {
          countMap[o.branchid] = (countMap[o.branchid] || 0) + 1;
       });
    }

    let selectedBranch = null;
    let finalDistance = null;

    for (const b of allBranches) {
        if (!b.isactive) continue;

        let hasAll = true;
        for (const item of cart) {
           const prodStatus = bStatus.find(s => s.branchid === b.branchid && s.productid === item.productid);
           if (!prodStatus || prodStatus.status !== 'Còn món') { hasAll = false; break; }
        }
        if (!hasAll) continue;

        const pendingCount = countMap[b.branchid] || 0;
        if (pendingCount > 10) continue;

        selectedBranch = b;
        finalDistance = getDistanceFromLatLonInKm(targetLat, targetLng, b.latitude, b.longitude);
        break;
    }

    if (!selectedBranch) {
        return { error: 'Hiện tại tất cả các cửa hàng đều hết món trong giỏ hàng hoặc đang quá tải. Vui lòng thử lại sau.' };
    }

    return { branch: selectedBranch, distance: finalDistance };
}

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/send-application', async (req, res) => {
  try {
    const { fullName, phone, dob, email, selectedStores, canRotate, startDate, otherDesires, location } = req.body;
    
    if (!fullName) {
      return res.status(400).json({ status: 'error', message: 'Không có dữ liệu gửi lên.' });
    }

    const storesString = Array.isArray(selectedStores) ? selectedStores.join(', ') : (selectedStores || '');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Hệ Thống Lam Trà" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_RECEIVER || 'lamtradamvingon@gmail.com',
      replyTo: `${fullName} <${email}>`,
      subject: `Đơn Ứng Tuyển Mới - ${fullName} - Khu vực ${location || 'Chưa rõ'}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #d66d75; color: white; padding: 20px; text-align: center;">
                <h2 style="margin: 0;">Đơn Ứng Tuyển Mới Khối Cửa Hàng</h2>
                <p style="margin: 5px 0 0;">Khu vực: <strong>${location || 'Chưa rõ'}</strong></p>
            </div>
            <div style="padding: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; width: 40%;"><strong>Họ và tên:</strong></td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${fullName || ''}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Ngày sinh:</strong></td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${dob || ''}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Số điện thoại:</strong></td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${phone || ''}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${email || ''}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Cửa hàng mong muốn:</strong></td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${storesString}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Xoay ca được không:</strong></td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${canRotate || ''}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Thời gian bắt đầu:</strong></td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${startDate || ''}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; vertical-align: top;"><strong>Nguyện vọng khác:</strong></td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${(otherDesires || '').replace(/\n/g, '<br />')}</td>
                    </tr>
                </table>
            </div>
            <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #777;">
                <p style="margin: 0;">Email được gửi tự động từ Website Liên hệ Hệ thống Lam Trà.</p>
            </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ status: 'success', message: 'Email đã được gửi' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Không thể gửi thư. ' + error.message });
  }
});

function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj){
        if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

function formatVNPayDate(date) {
  const pad = (n) => (n < 10 ? '0' + n : n);
  
  // Chuyển đổi sang múi giờ GMT+7 (Asia/Ho_Chi_Minh)
  const gmt7Date = new Date(date.getTime() + (7 * 60 * 60 * 1000) + (date.getTimezoneOffset() * 60 * 1000));
  
  return (
    gmt7Date.getFullYear().toString() +
    pad(gmt7Date.getMonth() + 1) +
    pad(gmt7Date.getDate()) +
    pad(gmt7Date.getHours()) +
    pad(gmt7Date.getMinutes()) +
    pad(gmt7Date.getSeconds())
  );
}

app.post('/api/create_payment_url', (req, res) => {
  try {
    const { amount, orderInfo, orderId } = req.body;
    
    const tmnCode = process.env.vnp_TmnCode;
    const secretKey = process.env.vnp_HashSecret.trim(); // VẤN ĐỀ 1: Trim khoảng trắng
    const vnpUrl = process.env.vnp_Url;
    const returnUrl = process.env.vnp_ReturnUrl;

    if (!tmnCode || !secretKey || !vnpUrl || !returnUrl) {
      return res.status(500).json({ error: 'Cấu hình VNPay không hợp lệ hoặc thiếu trong .env' });
    }

    const date = new Date();
    const createDate = formatVNPayDate(date);
    const expireDate = formatVNPayDate(new Date(date.getTime() + 15 * 60000)); // Hết hạn sau 15 phút
    
    let ipAddr = req.headers['x-forwarded-for'] || 
                 req.socket.remoteAddress || 
                 '127.0.0.1';
    if (ipAddr === '::1' || ipAddr === 'localhost') ipAddr = '127.0.0.1';

    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0'; // Bắt buộc 2.1.0
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = orderInfo;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = Math.round(amount * 100); 
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;
    vnp_Params['vnp_ExpireDate'] = expireDate;

    // VẤN ĐỀ 2: Đảm bảo không có trường thừa trước khi sort
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // Sắp xếp Alphabet
    vnp_Params = sortObject(vnp_Params);

    // VẤN ĐỀ 3: Nối chuỗi thủ công (Manual Concatenation)
    let signData = "";
    for (let key in vnp_Params) {
        if (vnp_Params.hasOwnProperty(key)) {
            signData += key + '=' + vnp_Params[key] + '&';
        }
    }
    signData = signData.slice(0, -1); // Xóa dấu '&' thừa ở cuối

    // VẤN ĐỀ 4: GẮN MÃ DEBUG
    console.log("=== VNPAY DEBUG: CHUỖI TRƯỚC KHI BĂM (signData) ===", signData);

    // VẤN ĐỀ 5: MÃ HÓA VÀ NỐI URL
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex"); 
    
    // SỬA LẠI: Tạo URL cuối cùng bằng cách nối tay để tránh "Mã hóa kép" (Double-Encoding)
    const paymentUrl = vnpUrl + '?' + signData + '&vnp_SecureHash=' + signed;
    
    res.status(200).json({ url: paymentUrl });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi tạo URL thanh toán: ' + err.message });
  }
});

function calculateShippingFee(distance) {
  if (distance <= 1) return 0;
  if (distance <= 3) return 10000;
  if (distance <= 6) return 15000;
  if (distance <= 10) return 18000;
  if (distance <= 15) return 22000;
  return -1; // Over 15km
}

app.post('/api/estimate-shipping', async (req, res) => {
  try {
     const { customerInfo, cart } = req.body;
     const { city, ward, address_detail, exactLat, exactLng } = customerInfo;
     
     let targetLat = exactLat ? parseFloat(exactLat) : null;
     let targetLng = exactLng ? parseFloat(exactLng) : null;
     let fallbackLevel = 0;

     if (!targetLat || !targetLng) {
         if (!city || !ward || !address_detail) return res.status(400).json({error: 'Chưa đủ địa chỉ'});
         const geoResult = await geocodeWithFallback(address_detail, ward, city);
         if (!geoResult) {
            return res.status(400).json({error: 'Không thể định vị địa chỉ này trên bản đồ.'});
         }
         targetLat = geoResult.lat;
         targetLng = geoResult.lng;
         fallbackLevel = geoResult.fallbackLevel;
     }

     const routingRes = await findBestBranch(targetLat, targetLng, cart, supabase);
     if (routingRes.error) {
        return res.status(400).json({ error: routingRes.error });
     }
     
     const { distance, branch } = routingRes;
     const fee = calculateShippingFee(distance);

     res.json({ success: true, distance: distance.toFixed(1), shippingFee: fee, branchId: branch.branchid, fallbackLevel: fallbackLevel, lat: targetLat, lng: targetLng });
  } catch(e) {
     res.status(500).json({error: e.message});
  }
});

app.get('/api/reviews/product/:productId', async (req, res) => {
  try {
     const { productId } = req.params;
     const { data, error } = await supabase
        .from('reviews')
        .select('*, customers(fullname)')
        .eq('productid', productId)
        .order('createdat', { ascending: false });

     if (error) throw error;

     // Lọc lấy các review có text hoặc có sao (thực tế schema đã yêu cầu rating rồi nên chỉ cần lọc trống comment nếu muốn, nhưng ở đây cứ lấy hết hoặc theo yêu cầu: "Chỉ hiển thị các review có text hoặc sao")
     const filtered = data.filter(r => r.comment || r.rating > 0);

     res.json(filtered);
  } catch (e) {
     res.status(500).json({ error: e.message });
  }
});

app.post('/api/checkout', async (req, res) => {
  try {
     const { orderId, cart, customerId, totalAmount, paymentMethod, status, isDelivery, customerInfo, voucherId, discountAmount, orderNote } = req.body;
     
     let branchId = null;
     let targetLat = null;
     let targetLng = null;
     let shippingFee = 0;

     if (isDelivery) {
        const { city, ward, address_detail, exactLat, exactLng } = customerInfo;
        
        if (exactLat && exactLng) {
           targetLat = parseFloat(exactLat);
           targetLng = parseFloat(exactLng);
        } else {
           const geoResult = await geocodeWithFallback(address_detail, ward, city);
           if (geoResult) {
              targetLat = geoResult.lat;
              targetLng = geoResult.lng;
           }
        }

        const routingRes = await findBestBranch(targetLat, targetLng, cart, supabase);
        if (routingRes.error) {
           return res.status(400).json({ error: routingRes.error });
        }
        
        branchId = routingRes.branch.branchid;
        const distance = routingRes.distance;
        shippingFee = calculateShippingFee(distance);
        if (shippingFee === -1) {
           return res.status(400).json({ error: 'Rất tiếc, khoảng cách giao hàng trên 15km Lam Trà không thể phục vụ.' });
        }

     } else {
        branchId = customerInfo.branchid;
        if (!branchId) return res.status(400).json({ error: 'Không đọc được mã chi nhánh.' });
        
        const { data: bStatus } = await supabase.from('branchproductstatus').select('*').eq('branchid', branchId);
        let missingItem = null;
        for (const item of cart) {
           const prodStatus = bStatus?.find(s => s.productid === item.productid);
           if (!prodStatus || prodStatus.status !== 'Còn món') {
              missingItem = item.name;
              break;
           }
        }
        if (missingItem) {
           return res.status(400).json({ error: `Cửa hàng này hiện đang tạm hết món [${missingItem}]. Vui lòng xóa môn khỏi giỏ hoặc chọn chi nhánh khác.` });
        }
     }

     const finalAmt = Math.max(0, totalAmount - (discountAmount || 0)) + shippingFee;

     const { error: orderError } = await supabase.from('orders').insert({
        orderid: orderId,
        totalamount: totalAmount,
        finalamount: finalAmt,
        discountamount: discountAmount || 0,
        paymentmethod: paymentMethod,
        status: status,
        orderdate: new Date().toISOString(),
        customerid: customerId,
        shippingfee: shippingFee,
        ordertype: isDelivery ? 'Giao hàng' : 'Tại chỗ',
        branchid: branchId,
        city: isDelivery ? (customerInfo.city || null) : null,
        ward: isDelivery ? (customerInfo.ward || null) : null,
        address_detail: isDelivery ? (customerInfo.address_detail || null) : null,
        customer_latitude: targetLat,
        customer_longitude: targetLng,
        voucherid: voucherId || null,
        note: orderNote || null
    });

    if (orderError) throw orderError;

    const orderDetails = cart.map(item => ({
      orderid: orderId,
      productid: item.productid,
      quantity: item.quantity,
      sugarlevel: item.sugar,
      icelevel: item.ice,
      priceatorder: item.baseprice,
      subtotal: item.itemTotal * item.quantity,
      note: item.note || ''
    }));

    const { error: detailError } = await supabase.from('orderdetails').insert(orderDetails);
    if (detailError) throw detailError;

    if (voucherId && customerId) {
       await supabase.from('customervouchers').update({ status: 'Đã sử dụng' }).eq('customerid', customerId).eq('voucherid', voucherId);
    }

    res.json({ success: true, branchId, orderId, finalAmount: finalAmt });
  } catch (error) {
     console.error(error);
     res.status(500).json({ error: 'System processing error: ' + error.message });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
