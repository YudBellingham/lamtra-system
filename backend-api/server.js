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

async function getGoongDistanceMatrix(targetLat, targetLng, branches) {
   const apiKey = process.env.GOONG_API_KEY;
   if (!apiKey) return branches.map(b => ({ branch: b, distanceKm: Infinity })); // Safe fallback if no key
   
   const validBranches = branches.filter(b => b.latitude && b.longitude);
   if (validBranches.length === 0) return [];
   
   const origins = `${targetLat},${targetLng}`;
   const destinations = validBranches.map(b => `${b.latitude},${b.longitude}`).join('|');
   
   try {
       const url = `https://rsapi.goong.io/DistanceMatrix?origins=${origins}&destinations=${destinations}&vehicle=bike&api_key=${apiKey}`;
       const response = await axios.get(url);
       
       if (response.data && response.data.rows && response.data.rows.length > 0) {
          const elements = response.data.rows[0].elements;
          return validBranches.map((b, index) => {
              const el = elements[index];
              let distanceKm = Infinity;
              if (el.status === "OK" && el.distance) {
                  distanceKm = el.distance.value / 1000.0;
              }
              return { branch: b, distanceKm };
          });
       }
   } catch (e) {
       console.error("Lỗi Goong Distance Matrix:", e.message);
   }
   return validBranches.map(b => ({ branch: b, distanceKm: Infinity }));
}

async function calculateIngredients(cart, supabaseClient) {
    const requiredIngredients = {};
    const productIds = [];
    const toppingIds = [];

    for (const item of cart) {
        if (item.productid && !productIds.includes(item.productid)) productIds.push(item.productid);
        if (item.toppings && Array.isArray(item.toppings)) {
            for (const t of item.toppings) {
                if (t.toppingid && !toppingIds.includes(t.toppingid)) toppingIds.push(t.toppingid);
            }
        }
    }

    if (productIds.length === 0 && toppingIds.length === 0) return requiredIngredients;

    let allRecipes = [];
    if (productIds.length > 0) {
        const { data: pGroup } = await supabaseClient.from('recipes').select('productid, ingredientid, amount').in('productid', productIds);
        if (pGroup) allRecipes.push(...pGroup);
    }
    if (toppingIds.length > 0) {
        const { data: tGroup } = await supabaseClient.from('recipes').select('toppingid, ingredientid, amount').in('toppingid', toppingIds);
        if (tGroup) allRecipes.push(...tGroup);
    }

    for (const item of cart) {
        const pRecipes = allRecipes.filter(r => r.productid === item.productid);
        for (const r of pRecipes) {
            requiredIngredients[r.ingredientid] = (requiredIngredients[r.ingredientid] || 0) + (r.amount * item.quantity);
        }
        
        if (item.toppings && Array.isArray(item.toppings)) {
            for (const t of item.toppings) {
                const tRecipes = allRecipes.filter(r => r.toppingid === t.toppingid);
                for (const r of tRecipes) {
                    requiredIngredients[r.ingredientid] = (requiredIngredients[r.ingredientid] || 0) + (r.amount * (t.quantity || 1) * item.quantity);
                }
            }
        }
    }
    return requiredIngredients;
}

async function checkBranchCapability(branchId, cart, requiredIngredients, supabaseClient) {
    const outOfStockItems = [];
    
    // Lớp 1: Kiểm tra branchproductstatus (Bật/tắt món thủ công)
    const { data: bStatus } = await supabaseClient.from('branchproductstatus').select('*').eq('branchid', branchId);
    
    // Lớp 2: Kiểm tra branchinventory (Dựa vào requiredIngredients)
    const ingIds = Object.keys(requiredIngredients);
    let allInventory = [];
    if (ingIds.length > 0) {
        const { data: inv } = await supabaseClient.from('branchinventory').select('ingredientid, currentstock').eq('branchid', branchId).in('ingredientid', ingIds);
        if (inv) allInventory = inv;
    }

    for (const item of cart) {
        const prodStatus = bStatus?.find(s => s.productid === item.productid);
        if (!prodStatus || prodStatus.status !== 'Còn món') {
            if (!outOfStockItems.includes(item.name)) outOfStockItems.push(item.name);
        }
    }

    let hasEnoughIngredients = true;
    for (const ingId of ingIds) {
        const stockRecord = allInventory.find(i => i.ingredientid == ingId);
        const currentStock = stockRecord ? stockRecord.currentstock : 0;
        if (currentStock < requiredIngredients[ingId]) {
             hasEnoughIngredients = false;
             break;
        }
    }

    if (!hasEnoughIngredients) {
         if (outOfStockItems.length === 0) outOfStockItems.push("Nguyên liệu theo công thức pha chế");
    }

    // Lớp 3: Quá tải (Pending orders)
    const { count } = await supabaseClient
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('branchid', branchId)
        .in('status', ['Chờ xác nhận', 'Đang làm']);
    
    const pendingCount = count || 0;
    const isOverloaded = pendingCount > 10;
    const estimatedTime = isOverloaded ? "> 45 phút" : "15-20 phút";

    return {
        available: outOfStockItems.length === 0,
        outOfStockItems,
        pendingCount,
        estimatedTime,
        isOverloaded
    };
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
    let keys = Object.keys(obj).sort();
    
    for (let key of keys) {
        if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
            sorted[encodeURIComponent(key)] = encodeURIComponent(obj[key].toString()).replace(/%20/g, "+");
        }
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
    Object.keys(vnp_Params).forEach(key => {
        signData += key + '=' + vnp_Params[key] + '&';
    });
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
         return res.status(400).json({error: 'Không nhận được tọa độ địa chỉ. Vui lòng chọn địa chỉ từ gợi ý.'});
     }

     const requiredIngredients = await calculateIngredients(cart, supabase);
     const { data: allBranches } = await supabase.from('branches').select('*').eq('isactive', true);
     
     // Gọi Goong Distance Matrix 1 lần để quét tất cả branches
     const distanceResults = await getGoongDistanceMatrix(targetLat, targetLng, allBranches);
     
     const branchesMeta = [];

     for (const dr of distanceResults) {
         const b = dr.branch;
         const distance = dr.distanceKm;
         if (distance <= 15 && distance !== Infinity) {
             const capability = await checkBranchCapability(b.branchid, cart, requiredIngredients, supabase);
             const fee = calculateShippingFee(distance);
             branchesMeta.push({
                 branch: b,
                 distance: distance,
                 shippingFee: fee,
                 capability
             });
         }
     }

     if (branchesMeta.length === 0) {
         return res.status(400).json({ error: 'Rất tiếc, khoảng cách giao hàng trên 15km hoặc không có chi nhánh đang mở cửa gần bạn.' });
     }

     branchesMeta.sort((a,b) => a.distance - b.distance);

     res.json({ success: true, branchesInfo: branchesMeta, fallbackLevel, lat: targetLat, lng: targetLng });
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
        const { address_detail, exactLat, exactLng } = customerInfo;
        
        if (exactLat && exactLng) {
           targetLat = parseFloat(exactLat);
           targetLng = parseFloat(exactLng);
        } else {
           return res.status(400).json({ error: 'Không nhận được tọa độ giao hàng hợp lệ.' });
        }

        const requiredIngredients = await calculateIngredients(cart, supabase);
        branchId = customerInfo.deliveryBranchId;
        if (!branchId) return res.status(400).json({ error: 'Vui lòng chọn chi nhánh giao hàng.' });

        const { data: bInfo } = await supabase.from('branches').select('*').eq('branchid', branchId).single();
        if (!bInfo) return res.status(400).json({ error: 'Chi nhánh giao hàng không tồn tại.' });

        const matrixResult = await getGoongDistanceMatrix(targetLat, targetLng, [bInfo]);
        const distance = matrixResult.length > 0 ? matrixResult[0].distanceKm : Infinity;
        
        if (distance === Infinity) {
           return res.status(400).json({ error: 'Không thể định tuyến đường đi bằng xe máy tới địa điểm này.' });
        }
        
        shippingFee = calculateShippingFee(distance);
        if (shippingFee === -1) {
           return res.status(400).json({ error: 'Rất tiếc, khoảng cách giao hàng trên 15km Lam Trà không thể phục vụ.' });
        }

        const capability = await checkBranchCapability(branchId, cart, requiredIngredients, supabase);
        if (!capability.available) {
           return res.status(400).json({ error: `Chi nhánh đã chọn hiện tại hết hàng (${capability.outOfStockItems.join(', ')}). Vui lòng chọn lại chi nhánh khác.` });
        }
     } else {
        branchId = customerInfo.branchid;
        if (!branchId) return res.status(400).json({ error: 'Không đọc được mã chi nhánh.' });
        
        const requiredIngredients = await calculateIngredients(cart, supabase);
        const capability = await checkBranchCapability(branchId, cart, requiredIngredients, supabase);
        if (!capability.available) {
             return res.status(400).json({ error: `Cửa hàng này hiện đang tạm hết nguyên liệu cho đơn hàng của bạn (${capability.outOfStockItems.join(', ')}). Vui lòng điều chỉnh giỏ hàng hoặc chọn chi nhánh khác.` });
        }
     }

      let calculatedDiscount = discountAmount || 0;
      if (voucherId) {
         const { data: vInfo } = await supabase.from('vouchers').select('*').eq('voucherid', voucherId).single();
         if (vInfo) {
            if (totalAmount < (vInfo.minordervalue || 0)) {
               return res.status(400).json({ error: `Đơn hàng chưa đủ giá trị tối thiểu ${vInfo.minordervalue}đ để dùng mã này.` });
            }
            if (vInfo.discounttype === '%') {
               calculatedDiscount = (totalAmount * vInfo.discountvalue) / 100;
               if (vInfo.maxdiscount && calculatedDiscount > vInfo.maxdiscount) {
                  calculatedDiscount = vInfo.maxdiscount;
               }
            } else {
               calculatedDiscount = vInfo.discountvalue;
            }
         }
      }

      const finalAmt = Math.max(0, totalAmount - calculatedDiscount) + shippingFee;

      const { error: orderError } = await supabase.from('orders').insert({
         orderid: orderId,
         totalamount: totalAmount,
         finalamount: finalAmt,
         discountamount: calculatedDiscount,
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
       await supabase.from('customervouchers').update({ status: 'Đang dùng' }).eq('customerid', customerId).eq('voucherid', voucherId);
    }

    res.json({ success: true, branchId, orderId, finalAmount: finalAmt });
  } catch (error) {
     console.error(error);
     res.status(500).json({ error: 'System processing error: ' + error.message });
  }
});

app.post('/api/orders/reorder', async (req, res) => {
  try {
     const { orderid } = req.body;
     if (!orderid) return res.status(400).json({ error: 'Missing orderid' });

     // 1. Kiểm tra đơn hàng gốc
     const { data: originalOrder, error: oErr } = await supabase.from('orders').select('*').eq('orderid', orderid).single();
     if (oErr || !originalOrder) return res.status(404).json({ error: 'Không tìm thấy đơn hàng gốc.' });
     
     if (originalOrder.status !== 'Hoàn thành') {
        return res.status(400).json({ error: 'Chỉ có thể đặt lại các đơn hàng đã hoàn thành.' });
     }

     const branchId = originalOrder.branchid;

     // 2. Lấy chi tiết món
     const { data: orderDetails, error: odErr } = await supabase.from('orderdetails').select('*').eq('orderid', orderid);
     if (odErr || !orderDetails || orderDetails.length === 0) return res.status(400).json({ error: 'Không tìm thấy chi tiết đơn hàng cũ.' });

     const odIds = orderDetails.map(od => od.orderdetailid);
     let orderToppings = [];
     if (odIds.length > 0) {
        const { data: otData } = await supabase.from('ordertoppings').select('*').in('orderdetailid', odIds);
        if (otData) orderToppings = otData;
     }

     const productIds = orderDetails.map(od => od.productid);
     const toppingIds = orderToppings.map(ot => ot.toppingid);

     const { data: products } = await supabase.from('products').select('*').in('productid', productIds);
     let availableProducts = products ? products.filter(p => p.status === 'Đang bán') : [];

     let availableToppings = [];
     if (toppingIds.length > 0) {
        const { data: tops } = await supabase.from('toppings').select('*').in('toppingid', toppingIds);
        if (tops) availableToppings = tops.filter(t => t.isavailable === true);
     }

     let hasMissingItems = false;
     const reorderCart = [];

     for (const od of orderDetails) {
        const product = availableProducts.find(p => p.productid === od.productid);
        if (!product) {
           hasMissingItems = true;
           continue;
        }

        const itemToppingsObj = orderToppings.filter(ot => ot.orderdetailid === od.orderdetailid);
        let validToppings = [];
        
        for (const ot of itemToppingsObj) {
           const topInfo = availableToppings.find(t => t.toppingid === ot.toppingid);
           if (!topInfo) {
              hasMissingItems = true;
           } else {
              validToppings.push({
                  name: topInfo.name,
                  price: topInfo.price,
                  toppingid: topInfo.toppingid,
                  quantity: ot.quantity || 1
              });
           }
        }

        const priceToUse = product.saleprice ? product.saleprice : product.baseprice;
        let itemTotal = priceToUse;
        validToppings.forEach(t => itemTotal += t.price * t.quantity);
        
        reorderCart.push({
            id: `reorder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            productid: product.productid,
            name: product.name,
            imageurl: product.imageurl,
            baseprice: priceToUse,
            quantity: od.quantity,
            size: 'M',
            sugar: od.sugarlevel || '100%',
            ice: od.icelevel || '100%',
            toppings: validToppings,
            note: od.note || '',
            itemTotal: itemTotal
        });
     }

     if (reorderCart.length === 0) {
        return res.status(400).json({ error: 'Tất cả các món trong đơn hàng này hiện đã ngừng kinh doanh.' });
     }

     // 3. Kiểm tra Kho và Tải trọng tại chi nhánh phát sinh đơn cũ
     const requiredIngredients = await calculateIngredients(reorderCart, supabase);
     const capability = await checkBranchCapability(branchId, reorderCart, requiredIngredients, supabase);

     if (!capability.available) {
        return res.status(400).json({ 
            error: `Cửa hàng gốc hiện không đủ nguyên liệu để đặt lại combo này (Thiếu: ${capability.outOfStockItems.join(', ')}). Vui lòng đặt lẻ từng món còn hàng.` 
        });
     }

     if (capability.isOverloaded) {
        return res.status(400).json({ 
            error: `Chi nhánh hiện đang quá tải (>10 đơn chờ). Để đảm bảo chất lượng, vui lòng đợi ít phút hoặc chọn món mới tại chi nhánh khác.` 
        });
     }

     res.json({ success: true, reorderCart, hasMissingItems });
  } catch (error) {
     res.status(500).json({ error: error.message });
  }
});

// --- API NÂNG CẤP VALIDATION & ERROR HANDLING ---

// 1. Kiểm tra tồn tại Email/SĐT (Dùng cho Đăng ký)
app.post('/api/auth/check-existence', async (req, res) => {
    try {
        const { email, phone } = req.body;
        
        const { data: emailData } = await supabase.from('customers').select('email').eq('email', email).maybeSingle();
        const { data: phoneData } = await supabase.from('customers').select('phone').eq('phone', phone).maybeSingle();

        res.json({
            emailExists: !!emailData,
            phoneExists: !!phoneData
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 2. Cập nhật Profile (Bắt lỗi trùng SĐT chi tiết)
app.post('/api/customers/update-profile', async (req, res) => {
    try {
        const { customerId, fullname, email, phone, birthday } = req.body;
        
        // Regex kiểm tra lại ở Server cho an toàn
        const phoneRegex = /^0\d{9}$/;
        const emailRegex = /^[a-zA-Z0-9._%+-]+@(?!(gmai|yaho|hotmai)\.com$)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!fullname || !phone || !email) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin.' });
        }
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ error: 'Số điện thoại không hợp lệ (phải có đủ 10 chữ số và bắt đầu bằng số 0).' });
        }
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Email không hợp lệ hoặc sai chính tả (vd: @gmail.com).' });
        }

        const { error } = await supabase
            .from('customers')
            .update({ fullname, email, phone, birthday })
            .eq('customerid', customerId);

        if (error) {
            // Bắt lỗi Unique Constraint từ PostgreSQL (23505)
            if (error.code === '23505') {
                if (error.details.includes('phone')) {
                    return res.status(400).json({ error: 'Số điện thoại đã tồn tại, vui lòng nhập số điện thoại khác.' });
                }
                if (error.details.includes('email')) {
                    return res.status(400).json({ error: 'Email đã tồn tại trong hệ thống.' });
                }
            }
            throw error;
        }

        res.json({ success: true, message: 'Cập nhật thông tin thành công!' });
    } catch (e) {
        res.status(500).json({ error: 'Lỗi cập nhật: ' + e.message });
    }
});

app.get('/api/customers/point-history', async (req, res) => {
  try {
     const token = req.headers.authorization?.split(' ')[1];
     if (!token) return res.status(401).json({ error: 'Unauthorized' });
     
     const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
     if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

     const { data: cust } = await supabase.from('customers').select('customerid').eq('authid', user.id).single();
     if (!cust) return res.status(404).json({ error: 'Customer not found' });

     const { data, error } = await supabase.from('pointhistory').select('*').eq('customerid', cust.customerid).order('createddate', { ascending: false });
     if (error) throw error;
     res.json(data || []);
  } catch (error) {
     res.status(500).json({ error: error.message });
  }
});

// 3. Toggle Yêu thích sản phẩm
app.post('/api/favorites/toggle', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
        if (authErr || !user) return res.status(401).json({ error: 'Auth failed' });

        const { productId } = req.body;
        const { data: cust } = await supabase.from('customers').select('customerid').eq('authid', user.id).single();
        
        const { data: existing } = await supabase.from('product_favorites')
            .select('*').eq('customerid', cust.customerid).eq('productid', productId).maybeSingle();

        if (existing) {
            await supabase.from('product_favorites').delete().eq('id', existing.id);
            res.json({ success: true, isFavorite: false });
        } else {
            await supabase.from('product_favorites').insert({ customerid: cust.customerid, productid: productId });
            res.json({ success: true, isFavorite: true });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 4. Lưu đơn mẫu
app.post('/api/orders/template/save', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
        if (authErr || !user) return res.status(401).json({ error: 'Auth failed' });

        const { orderId, templateName } = req.body;
        const { data: cust } = await supabase.from('customers').select('customerid').eq('authid', user.id).single();
        
        const { data, error } = await supabase.from('order_templates').insert({
            customerid: cust.customerid,
            orderid: orderId,
            templatename: templateName || `Đơn mẫu ngày ${new Date().toLocaleDateString('vi-VN')}`
        }).select();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 5. Lấy danh sách Yêu thích & Đơn mẫu
app.get('/api/customers/favorites', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
        if (authErr || !user) return res.status(401).json({ error: 'Auth failed' });

        const { data: cust } = await supabase.from('customers').select('customerid').eq('authid', user.id).single();
        
        const [favProducts, favTemplates] = await Promise.all([
            supabase.from('product_favorites').select('*, products(*)').eq('customerid', cust.customerid),
            supabase.from('order_templates').select('*, orders(*)').eq('customerid', cust.customerid)
        ]);

        res.json({
            products: favProducts.data || [],
            templates: favTemplates.data || []
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/vouchers/available', async (req, res) => {
  try {
     const token = req.headers.authorization?.split(' ')[1];
     let customerId = null;

     if (token && token !== 'null' && token !== 'undefined') {
        const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
        if (!authErr && user) {
           const { data: cust } = await supabase.from('customers').select('customerid').eq('authid', user.id).single();
           if (cust) customerId = cust.customerid;
        }
     }

     const { data: publicVouchers, error: pubErr } = await supabase.from('vouchers')
         .select('*')
         .eq('is_active', true)
         .or('pointsrequired.eq.0,pointsrequired.is.null');

     let finalVouchers = publicVouchers || [];

     if (customerId) {
        const { data: customVouchers, error: custErr } = await supabase.from('customervouchers')
            .select('*, vouchers(*)')
            .eq('customerid', customerId)
            .in('status', ['Chưa dùng', 'Active']);
        
        if (customVouchers) {
            const myVouchers = customVouchers.map(v => ({ ...v.vouchers, cvId: v.custvoucherid }));
            finalVouchers = [...finalVouchers, ...myVouchers];
        }
     }

     finalVouchers = finalVouchers.filter(v => v != null);
     const uniqueVouchers = Array.from(new Map(finalVouchers.map(item => [item.voucherid, item])).values());

     res.json(uniqueVouchers);
  } catch (error) {
     res.status(500).json({ error: error.message });
  }
});

app.post('/api/checkout/capability', async (req, res) => {
   try {
       const { branchId, cart } = req.body;
       if (!branchId || !cart) return res.status(400).json({ error: 'Thiếu dữ liệu' });
       
       const requiredIngredients = await calculateIngredients(cart, supabase);
       const capability = await checkBranchCapability(branchId, cart, requiredIngredients, supabase);
       res.json({ success: true, capability });
   } catch(e) {
       res.status(500).json({ error: e.message });
   }
});

app.post('/api/orders/update-status', async (req, res) => {
    try {
        const { orderId, newStatus } = req.body;
        if (!orderId || !newStatus) return res.status(400).json({ error: 'Thiếu dữ liệu' });

        const { data: order, error: findError } = await supabase.from('orders').select('*').eq('orderid', orderId).single();
        if (findError || !order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });

        const { error: updateOrderError } = await supabase.from('orders').update({ status: newStatus }).eq('orderid', orderId);
        if (updateOrderError) throw updateOrderError;

        if (newStatus === 'Hoàn thành' && order.voucherid && order.customerid) {
            const { data: cvToUpdate } = await supabase.from('customervouchers')
                 .select('custvoucherid')
                 .eq('customerid', order.customerid)
                 .eq('voucherid', order.voucherid)
                 .in('status', ['Chưa dùng', 'Đang dùng'])
                 .order('receiveddate', { ascending: true })
                 .limit(1)
                 .single();

            if (cvToUpdate) {
                 await supabase.from('customervouchers').update({
                     status: 'Đã sử dụng',
                     useddate: new Date().toISOString()
                 }).eq('custvoucherid', cvToUpdate.custvoucherid);
            }
        }

        res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
