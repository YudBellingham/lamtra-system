/**
 * MENU TOOLS - Consolidated menu data queries
 * Gộp: search, category, bestseller, details, toppings, sizes, categories
 */

async function getMenuData(supabase, type, params = {}) {
  try {
    switch (type) {
      case "search": {
        const { keyword, limit = 10 } = params;
        if (!keyword) return { success: false, error: "Keyword required" };
        const { data } = await supabase
          .from("products")
          .select("productid, name, baseprice, saleprice, label, status")
          .ilike("name", `%${keyword}%`)
          .eq("status", "available")
          .limit(limit);
        return { success: !!data, data: data || [] };
      }

      case "category": {
        const { category_name, limit = 15 } = params;
        if (!category_name)
          return { success: false, error: "Category name required" };
        const { data: catData } = await supabase
          .from("categories")
          .select("categoryid")
          .ilike("name", `%${category_name}%`)
          .single();
        if (!catData)
          return { success: true, data: [], message: "Category not found" };
        const { data } = await supabase
          .from("products")
          .select("productid, name, baseprice, saleprice")
          .eq("categoryid", catData.categoryid)
          .eq("status", "available")
          .limit(limit);
        return { success: !!data, data: data || [] };
      }

      case "bestseller": {
        const { limit = 8 } = params;
        let { data } = await supabase
          .from("products")
          .select("productid, name, baseprice, saleprice")
          .in("label", ["bestseller", "popular"])
          .eq("status", "available")
          .limit(limit);
        if (!data || data.length < 3) {
          const { data: d } = await supabase
            .from("products")
            .select("productid, name, baseprice, saleprice")
            .not("saleprice", "is", null)
            .eq("status", "available")
            .limit(limit);
          data = d || [];
        }
        return { success: !!data, data: data || [] };
      }

      case "details": {
        const { product_name, productid } = params;
        let query = supabase
          .from("products")
          .select("productid, name, baseprice, saleprice, description, label");
        if (productid) query = query.eq("productid", productid);
        else if (product_name) query = query.ilike("name", `%${product_name}%`);
        else
          return {
            success: false,
            error: "productid or product_name required",
          };
        const { data } = await query.single();
        return { success: !!data, data };
      }

      case "toppings": {
        const { limit = 20 } = params;
        const { data } = await supabase
          .from("toppings")
          .select("toppingid, name, price, isavailable")
          .eq("isavailable", true)
          .limit(limit);
        return { success: !!data, data: data || [] };
      }

      case "sizes": {
        const { data } = await supabase
          .from("sizes")
          .select("sizeid, name, additionalprice");
        return { success: !!data, data: data || [] };
      }

      case "categories": {
        const { data } = await supabase
          .from("categories")
          .select("categoryid, name");
        return { success: !!data, data: data || [] };
      }

      default:
        return { success: false, error: `Unknown type: ${type}` };
    }
  } catch (err) {
    console.error(`❌ [menuData:${type}]`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { getMenuData };
