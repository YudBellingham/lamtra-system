/**
 * ORDER TOOLS - Consolidated order queries
 * Gộp: status, details
 * FIX: Parameter name mapping
 */

async function getOrderInfo(supabase, type, params = {}) {
  try {
    // Normalize parameter names
    const {
      order_id = params.orderid,
      orderid = params.order_id,
      customer_id = params.customerid,
      customerid = params.customer_id,
    } = params;

    const parsedOrderId = order_id || orderid;
    const parsedCustomerId = customer_id || customerid;

    if (!parsedOrderId)
      return { success: false, error: "order_id là bắt buộc" };

    switch (type) {
      case "status": {
        let q = supabase
          .from("orders")
          .select("orderid, status, finalamount, orderdate, paymentmethod")
          .eq("orderid", parsedOrderId);
        if (parsedCustomerId)
          q = q.eq("customerid", parseInt(parsedCustomerId));
        const { data } = await q.single();
        if (!data)
          return {
            success: false,
            error: `Không tìm thấy đơn hàng ${parsedOrderId}`,
          };
        const statusMap = {
          pending: "Chờ xác nhận",
          confirmed: "Đã xác nhận",
          preparing: "Đang chuẩn bị",
          ready: "Sẵn sàng",
          shipping: "Đang giao",
          delivered: "Đã giao",
          completed: "Hoàn thành",
          cancelled: "Đã hủy",
        };
        return {
          success: true,
          data: {
            orderid: data.orderid,
            status: statusMap[data.status] || data.status,
            totalamount: data.finalamount,
            orderdate: new Date(data.orderdate).toLocaleDateString("vi-VN"),
            paymentmethod: data.paymentmethod,
          },
        };
      }

      case "details": {
        let oq = supabase
          .from("orders")
          .select(
            "orderid, status, finalamount, discountamount, shippingfee, orderdate",
          )
          .eq("orderid", parsedOrderId);
        if (parsedCustomerId)
          oq = oq.eq("customerid", parseInt(parsedCustomerId));
        const { data: orderData } = await oq.single();
        if (!orderData)
          return { success: false, error: "Không tìm thấy đơn hàng" };

        const { data: items } = await supabase
          .from("orderdetails")
          .select(`*, products(name), sizes(name)`)
          .eq("orderid", parsedOrderId);

        const itemsWithToppings = await Promise.all(
          (items || []).map(async (item) => {
            const { data: toppings } = await supabase
              .from("ordertoppings")
              .select("toppingid, quantity")
              .eq("orderdetailid", item.orderdetailid);
            return {
              product: item.products?.name || "Unknown",
              qty: item.quantity,
              size: item.sizes?.name || "M",
              toppings: toppings || [],
            };
          }),
        );

        return {
          success: true,
          data: {
            orderid: orderData.orderid,
            status: orderData.status,
            items: itemsWithToppings,
            pricing: {
              subtotal: orderData.finalamount + orderData.discountamount,
              discount: orderData.discountamount,
              shipping: orderData.shippingfee,
              total: orderData.finalamount,
            },
            orderdate: new Date(orderData.orderdate).toLocaleDateString(
              "vi-VN",
            ),
          },
        };
      }

      default:
        return { success: false, error: `Unknown type: ${type}` };
    }
  } catch (err) {
    console.error(`❌ [orderInfo:${type}]`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { getOrderInfo };
