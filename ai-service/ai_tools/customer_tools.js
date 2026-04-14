/**
 * CUSTOMER TOOLS - Consolidated customer data queries
 * Gộp: loyalty, orders, favorites, templates, search
 */

async function getCustomerData(supabase, type, params = {}) {
  try {
    const { customerid, authid, phone, limit = 10, status_filter } = params;

    switch (type) {
      case "loyalty": {
        let q = supabase
          .from("customers")
          .select(
            "customerid, fullname, phone, email, membership, totalpoints, accumulated_points, birthday",
          );
        if (customerid) q = q.eq("customerid", parseInt(customerid));
        else if (authid) q = q.eq("authid", authid);
        else return { success: false, error: "customerid or authid required" };
        const { data } = await q.single();
        return { success: !!data, data };
      }

      case "orders": {
        if (!customerid)
          return { success: false, error: "customerid required" };
        let q = supabase
          .from("orders")
          .select("orderid, status, finalamount, orderdate, paymentmethod")
          .eq("customerid", parseInt(customerid));
        if (status_filter) q = q.eq("status", status_filter);
        const { data } = await q
          .order("orderdate", { ascending: false })
          .limit(limit);
        return { success: !!data, data: data || [] };
      }

      case "favorites": {
        if (!customerid)
          return { success: false, error: "customerid required" };
        const { data } = await supabase
          .from("product_favorites")
          .select("productid, name, baseprice")
          .eq("customerid", parseInt(customerid))
          .limit(limit);
        return { success: !!data, data: data || [] };
      }

      case "templates": {
        if (!customerid)
          return { success: false, error: "customerid required" };
        const { data } = await supabase
          .from("order_templates")
          .select("templateid, templatename, createddate")
          .eq("customerid", parseInt(customerid))
          .limit(limit);
        return { success: !!data, data: data || [] };
      }

      case "search": {
        if (!phone) return { success: false, error: "phone required" };
        if (!/^\d{10}$/.test(phone))
          return { success: false, error: "Phone must be 10 digits" };
        const { data } = await supabase
          .from("customers")
          .select("customerid, fullname, phone, email, membership, totalpoints")
          .eq("phone", phone)
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
