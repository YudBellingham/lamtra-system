/**
 * ORDER TOOLS - Xử lý orders, orderdetails, tracking
 * Chứa các hàm query Supabase để lấy dữ liệu đơn hàng
 */

/**
 * Lấy trạng thái đơn hàng
 */
async function getOrderStatus(supabase, orderid, customerid = null) {
  try {
    if (!orderid) {
      return {
        success: false,
        error: "Vui lòng cung cấp mã đơn hàng",
      };
    }

    let query = supabase
      .from("orders")
      .select(
        "orderid, status, finalamount, orderdate, paymentmethod, branchid",
      )
      .eq("orderid", orderid);

    if (customerid) {
      query = query.eq("customerid", parseInt(customerid));
    }

    const { data, error } = await query.single();

    if (error || !data) {
      console.error(`❌ Lỗi lấy trạng thái đơn ${orderid}:`, error?.message);
      return {
        success: false,
        error: `Không tìm thấy đơn hàng ${orderid}`,
      };
    }

    // Map status sang text tiếng Việt
    const statusMap = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      preparing: "Đang chuẩn bị",
      ready: "Sẵn sàng lấy",
      shipping: "Đang giao",
      delivered: "Đã giao",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
    };

    return {
      success: true,
      data: {
        orderid: data.orderid,
        status_code: data.status,
        status: statusMap[data.status] || data.status,
        totalamount: data.finalamount,
        orderdate: new Date(data.orderdate).toLocaleDateString("vi-VN"),
        paymentmethod: data.paymentmethod,
        branchid: data.branchid,
      },
    };
  } catch (err) {
    console.error("❌ [FATAL] Lỗi trong getOrderStatus:", err.message);
    return {
      success: false,
      error: `Lỗi hệ thống: ${err.message}`,
    };
  }
}

/**
 * Lấy chi tiết đơn hàng (danh sách items, toppings, sizes, giá)
 */
async function getOrderDetails(supabase, orderid, customerid = null) {
  try {
    if (!orderid) {
      return {
        success: false,
        error: "Vui lòng cung cấp mã đơn hàng",
      };
    }

    // Lấy thông tin đơn hàng
    let orderQuery = supabase
      .from("orders")
      .select(
        "orderid, status, finalamount, discountamount, shippingfee, orderdate, paymentmethod",
      )
      .eq("orderid", orderid);

    if (customerid) {
      orderQuery = orderQuery.eq("customerid", parseInt(customerid));
    }

    const { data: orderData, error: orderError } = await orderQuery.single();

    if (orderError || !orderData) {
      console.error(`❌ Lỗi lấy đơn ${orderid}:`, orderError?.message);
      return {
        success: false,
        error: `Không tìm thấy đơn hàng ${orderid}`,
      };
    }

    // Lấy chi tiết items trong đơn
    const { data: orderDetails, error: detailsError } = await supabase
      .from("orderdetails")
      .select(
        "orderdetailid, productid, quantity, sugarlevel, icelevel, subtotal, note, sizeid",
      )
      .select(
        `*,
        products(name, baseprice),
        sizes(name)`,
      )
      .eq("orderid", orderid);

    if (detailsError) {
      console.error(
        `❌ Lỗi lấy chi tiết đơn ${orderid}:`,
        detailsError.message,
      );
      return {
        success: false,
        error: "Không thể lấy chi tiết đơn hàng",
      };
    }

    // Lấy toppings cho mỗi item
    const itemsWithToppings = await Promise.all(
      (orderDetails || []).map(async (item) => {
        const { data: toppings, error: topError } = await supabase
          .from("ordertoppings")
          .select("toppingid, quantity, ordertoppings(name, price)")
          .eq("orderdetailid", item.orderdetailid);

        return {
          orderdetailid: item.orderdetailid,
          product_name: item.products?.name || "N/A",
          quantity: item.quantity,
          size: item.sizes?.name || "M (default)",
          sugar_level: item.sugarlevel || "100%",
          ice_level: item.icelevel || "Bình thường",
          subtotal: item.subtotal,
          note: item.note,
          toppings: toppings || [],
        };
      }),
    );

    const statusMap = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      preparing: "Đang chuẩn bị",
      ready: "Sẵn sàng lấy",
      shipping: "Đang giao",
      delivered: "Đã giao",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
    };

    return {
      success: true,
      data: {
        orderid: orderData.orderid,
        status: statusMap[orderData.status] || orderData.status,
        orderdate: new Date(orderData.orderdate).toLocaleDateString("vi-VN"),
        paymentmethod: orderData.paymentmethod,
        items: itemsWithToppings,
        pricing: {
          subtotal:
            orderData.finalamount +
            (orderData.discountamount || 0) -
            (orderData.shippingfee || 0),
          discount: orderData.discountamount || 0,
          shippingfee: orderData.shippingfee || 0,
          total: orderData.finalamount,
        },
      },
    };
  } catch (err) {
    console.error("❌ [FATAL] Lỗi trong getOrderDetails:", err.message);
    return {
      success: false,
      error: `Lỗi hệ thống: ${err.message}`,
    };
  }
}

module.exports = {
  getOrderStatus,
  getOrderDetails,
};
