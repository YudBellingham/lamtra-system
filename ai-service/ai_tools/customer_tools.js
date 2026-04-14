/**
 * CUSTOMER TOOLS - Consolidated customer data queries
 * Gộp: loyalty, orders, favorites, templates, search
 * FIX: Parameter name mapping, proper error handling
 */

async function getCustomerData(supabase, type, params = {}) {
  try {
    // Normalize parameter names
    const {
      customer_id = params.customerid,
      customerid = params.customer_id,
      auth_id = params.authid,
      authid = params.auth_id,
      phone_number = params.phone,
      phone = params.phone_number,
      order_status = params.status_filter,
      status_filter = params.order_status,
      limit = 10,
    } = params;

    const parsedCustomerId = customer_id || customerid;
    const parsedAuthId = auth_id || authid;
    const parsedPhone = phone_number || phone;
    const parsedStatus = order_status || status_filter;

    switch (type) {
      case "loyalty": {
        let q = supabase
          .from("customers")
          .select(
            "customerid, fullname, phone, email, membership, totalpoints, accumulated_points, birthday",
          );
        if (parsedCustomerId) {
          const custId = parseInt(parsedCustomerId);
          if (isNaN(custId))
            return {
              success: false,
              error:
                "Mã khách hàng không hợp lệ. Vui lòng cung cấp số điện thoại hoặc mã khách đúng.",
            };
          q = q.eq("customerid", custId);
        } else if (parsedAuthId) q = q.eq("authid", parsedAuthId);
        else
          return {
            success: false,
            error:
              "Để tra cứu thông tin, vui lòng cung cấp mã khách, ID auth, hoặc số điện thoại",
          };
        const { data } = await q.single();
        return { success: !!data, data };
      }

      case "orders": {
        let custId;
        if (parsedCustomerId) {
          custId = parseInt(parsedCustomerId);
          if (isNaN(custId))
            return {
              success: false,
              error:
                "Mã khách hàng không hợp lệ. Vui lòng cung cấp số điện thoại hoặc mã khách đúng.",
            };
        } else
          return {
            success: false,
            error:
              "Để xem lịch sử mua hàng, vui lòng cung cấp mã khách hoặc số điện thoại",
          };
        let q = supabase
          .from("orders")
          .select("orderid, status, finalamount, orderdate, paymentmethod")
          .eq("customerid", custId);
        if (parsedStatus) q = q.eq("status", parsedStatus);
        const { data } = await q
          .order("orderdate", { ascending: false })
          .limit(limit);
        return { success: !!data, data: data || [] };
      }

      case "favorites": {
        let custId;
        if (parsedCustomerId) {
          custId = parseInt(parsedCustomerId);
          if (isNaN(custId))
            return {
              success: false,
              error:
                "Mã khách hàng không hợp lệ. Vui lòng cung cấp số điện thoại hoặc mã khách đúng.",
            };
        } else
          return {
            success: false,
            error:
              "Để xem sản phẩm yêu thích, vui lòng cung cấp mã khách hoặc số điện thoại",
          };
        const { data } = await supabase
          .from("product_favorites")
          .select("productid, name, baseprice")
          .eq("customerid", custId)
          .limit(limit);
        return { success: !!data, data: data || [] };
      }

      case "templates": {
        let custId;
        if (parsedCustomerId) {
          custId = parseInt(parsedCustomerId);
          if (isNaN(custId))
            return {
              success: false,
              error:
                "Mã khách hàng không hợp lệ. Vui lòng cung cấp số điện thoại hoặc mã khách đúng.",
            };
        } else
          return {
            success: false,
            error:
              "Để xem danh sách combo đã lưu, vui lòng cung cấp mã khách hoặc số điện thoại",
          };
        const { data } = await supabase
          .from("order_templates")
          .select("templateid, templatename, createddate")
          .eq("customerid", custId)
          .limit(limit);
        return { success: !!data, data: data || [] };
      }

      case "search": {
        if (!parsedPhone)
          return { success: false, error: "phone_number là bắt buộc" };
        if (!/^\d{10}$/.test(parsedPhone))
          return {
            success: false,
            error: "Số điện thoại phải là 10 chữ số",
          };
        const { data } = await supabase
          .from("customers")
          .select("customerid, fullname, phone, email, membership, totalpoints")
          .eq("phone", parsedPhone)
          .single();
        return { success: !!data, data };
      }

      default:
        return { success: false, error: `Unknown type: ${type}` };
    }
  } catch (err) {
    console.error(`❌ [customerData:${type}]`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { getCustomerData };
