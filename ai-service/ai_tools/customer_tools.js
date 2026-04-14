/**
 * CUSTOMER TOOLS - Xử lý thông tin khách hàng, điểm, đơn hàng
 * Chứa các hàm query Supabase để lấy dữ liệu khách hàng
 */

/**
 * Lấy thông tin loyalty: điểm, hạng thẻ, điểm tích lũy
 */
async function getCustomerLoyaltyInfo(supabase, customerid, authid = null) {
  try {
    let customer = null;

    if (customerid) {
      const { data, error } = await supabase
        .from("customers")
        .select(
          "customerid, fullname, phone, email, membership, totalpoints, accumulated_points, birthday",
        )
        .eq("customerid", parseInt(customerid))
        .single();

      if (error) {
        console.error(
          `❌ Lỗi lấy customer info (by ID ${customerid}):`,
          error.message,
        );
        return {
          success: false,
          error: "Không tìm thấy khách hàng với ID này",
        };
      }
      customer = data;
    } else if (authid) {
      const { data, error } = await supabase
        .from("customers")
        .select(
          "customerid, fullname, phone, email, membership, totalpoints, accumulated_points, birthday",
        )
        .eq("authid", authid)
        .single();

      if (error) {
        console.error(
          `❌ Lỗi lấy customer info (by authid ${authid}):`,
          error.message,
        );
        return {
          success: false,
          error: "Không tìm thấy khách hàng với authid này",
        };
      }
      customer = data;
    } else {
      return {
        success: false,
        error: "Cần cung cấp customerid hoặc authid",
      };
    }

    if (!customer) {
      return {
        success: false,
        error: "Khách hàng không tồn tại",
      };
    }

    return {
      success: true,
      data: {
        customerid: customer.customerid,
        fullname: customer.fullname,
        phone: customer.phone,
        email: customer.email,
        membership: customer.membership || "Chưa có",
        totalpoints: customer.totalpoints || 0,
        accumulated_points: customer.accumulated_points || 0,
        birthday: customer.birthday || null,
      },
    };
  } catch (err) {
    console.error("❌ [FATAL] Lỗi trong getCustomerLoyaltyInfo:", err.message);
    return {
      success: false,
      error: `Lỗi hệ thống: ${err.message}`,
    };
  }
}

/**
 * Lấy lịch sử đơn hàng của khách
 */
async function getCustomerOrders(
  supabase,
  customerid,
  limit = 5,
  statusFilter = null,
) {
  try {
    let query = supabase
      .from("orders")
      .select("orderid, status, finalamount, orderdate, paymentmethod")
      .eq("customerid", parseInt(customerid))
      .order("orderdate", { ascending: false })
      .limit(limit);

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error(
        `❌ Lỗi lấy đơn hàng của customer ${customerid}:`,
        error.message,
      );
      return {
        success: false,
        error: "Không thể lấy lịch sử đơn hàng",
      };
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        data: [],
        message: "Khách hàng chưa có đơn hàng nào",
      };
    }

    return {
      success: true,
      data: data.map((o) => ({
        orderid: o.orderid,
        status: o.status,
        finalamount: o.finalamount,
        orderdate: new Date(o.orderdate).toLocaleDateString("vi-VN"),
        paymentmethod: o.paymentmethod,
      })),
    };
  } catch (err) {
    console.error("❌ [FATAL] Lỗi trong getCustomerOrders:", err.message);
    return {
      success: false,
      error: `Lỗi hệ thống: ${err.message}`,
    };
  }
}

/**
 * Lấy sản phẩm yêu thích của khách
 */
async function getCustomerFavorites(supabase, customerid, limit = 10) {
  try {
    const { data, error } = await supabase
      .from("product_favorites")
      .select("productid, name, baseprice, description, createdat")
      .eq("customerid", parseInt(customerid))
      .order("createdat", { ascending: false })
      .limit(limit);

    if (error) {
      console.error(
        `❌ Lỗi lấy yêu thích của customer ${customerid}:`,
        error.message,
      );
      return {
        success: false,
        error: "Không thể lấy danh sách yêu thích",
      };
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        data: [],
        message: "Khách hàng chưa lưu sản phẩm yêu thích nào",
      };
    }

    return {
      success: true,
      data: data.map((fav) => ({
        productid: fav.productid,
        name: fav.name,
        baseprice: fav.baseprice,
        description: fav.description,
        savedDate: new Date(fav.createdat).toLocaleDateString("vi-VN"),
      })),
    };
  } catch (err) {
    console.error("❌ [FATAL] Lỗi trong getCustomerFavorites:", err.message);
    return {
      success: false,
      error: `Lỗi hệ thống: ${err.message}`,
    };
  }
}

/**
 * Lấy đơn hàng mẫu/combo yêu thích của khách
 */
async function getCustomerOrderTemplates(supabase, customerid, limit = 5) {
  try {
    const { data, error } = await supabase
      .from("order_templates")
      .select("templateid, templatename, createddate, orderid")
      .eq("customerid", parseInt(customerid))
      .order("createddate", { ascending: false })
      .limit(limit);

    if (error) {
      console.error(
        `❌ Lỗi lấy order templates của customer ${customerid}:`,
        error.message,
      );
      return {
        success: false,
        error: "Không thể lấy danh sách đơn mẫu",
      };
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        data: [],
        message:
          "Khách hàng chưa lưu đơn hàng mẫu nào. Hãy lưu combo yêu thích!",
      };
    }

    return {
      success: true,
      data: data.map((tpl) => ({
        templateid: tpl.templateid,
        templatename: tpl.templatename,
        createddate: new Date(tpl.createddate).toLocaleDateString("vi-VN"),
        linkedOrderid: tpl.orderid,
      })),
    };
  } catch (err) {
    console.error(
      "❌ [FATAL] Lỗi trong getCustomerOrderTemplates:",
      err.message,
    );
    return {
      success: false,
      error: `Lỗi hệ thống: ${err.message}`,
    };
  }
}

/**
 * Tìm khách hàng bằng số điện thoại
 */
async function searchCustomerByPhone(supabase, phone) {
  try {
    // Validate phone format
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return {
        success: false,
        error: "Số điện thoại không hợp lệ. Hãy cung cấp 10 chữ số.",
      };
    }

    const { data, error } = await supabase
      .from("customers")
      .select(
        "customerid, fullname, phone, email, membership, totalpoints, accumulated_points",
      )
      .eq("phone", phone)
      .single();

    if (error) {
      console.error(`❌ Lỗi tìm customer bằng phone ${phone}:`, error.message);
      return {
        success: false,
        error: "Không tìm thấy khách hàng với số điện thoại này",
      };
    }

    if (!data) {
      return {
        success: false,
        error: "Khách hàng không tồn tại",
      };
    }

    return {
      success: true,
      data: {
        customerid: data.customerid,
        fullname: data.fullname,
        phone: data.phone,
        email: data.email,
        membership: data.membership || "Chưa có",
        totalpoints: data.totalpoints || 0,
        accumulated_points: data.accumulated_points || 0,
      },
    };
  } catch (err) {
    console.error("❌ [FATAL] Lỗi trong searchCustomerByPhone:", err.message);
    return {
      success: false,
      error: `Lỗi hệ thống: ${err.message}`,
    };
  }
}

module.exports = {
  getCustomerLoyaltyInfo,
  getCustomerOrders,
  getCustomerFavorites,
  getCustomerOrderTemplates,
  searchCustomerByPhone,
};
