/**
 * MENU TOOLS - Consolidated menu data queries
 * Gộp: search, category, bestseller, details, toppings, sizes, categories
 * FIX: Parameter name mapping, proper error handling
 */

async function getMenuData(supabase, type, params = {}) {
  try {
    // Normalize parameter names (support both old and new)
    const {
      search_keyword = params.keyword,
      keyword = params.search_keyword,
      category_name,
      product_name,
      product_id = params.productid,
      productid = params.product_id,
      limit = 10,
    } = params;

    switch (type) {
      case "search": {
        const searchTerm = search_keyword || keyword;
        if (!searchTerm)
          return {
            success: false,
            error: "search_keyword hoặc keyword là bắt buộc",
          };
        const { data } = await supabase
          .from("products")
          .select("productid, name, baseprice, saleprice, label, status")
          .ilike("name", `%${searchTerm}%`)
          .limit(limit);
        return { success: !!data, data: data || [] };
      }

      case "category": {
        if (!category_name)
          return {
            success: false,
            error: "category_name là bắt buộc",
          };
        const { data: catData } = await supabase
          .from("categories")
          .select("categoryid")
          .ilike("name", `%${category_name}%`)
          .single();
        if (!catData)
          return {
            success: true,
            data: [],
            message: "Không tìm thấy danh mục",
          };
        const { data } = await supabase
          .from("products")
          .select("productid, name, baseprice, saleprice")
          .eq("categoryid", catData.categoryid)
          .limit(limit);
        return { success: !!data, data: data || [] };
      }

      case "bestseller": {
        let { data } = await supabase
          .from("products")
          .select("productid, name, baseprice, saleprice")
          .in("label", ["bestseller", "popular"])
          .limit(limit);
        if (!data || data.length < 3) {
          const { data: d } = await supabase
            .from("products")
            .select("productid, name, baseprice, saleprice")
            .not("saleprice", "is", null)
            .limit(limit);
          data = d || [];
        }
        return { success: !!data, data: data || [] };
      }

      case "details": {
        const prodId = product_id || productid;
        let query = supabase
          .from("products")
          .select(
            "productid, name, baseprice, saleprice, description, label, subtitle, imageurl",
          );
        if (prodId) query = query.eq("productid", prodId);
        else if (product_name) query = query.ilike("name", `%${product_name}%`);
        else
          return {
            success: false,
            error: "product_id hoặc product_name là bắt buộc",
          };
        const { data } = await query.single();
        return { success: !!data, data };
      }

      case "toppings": {
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
