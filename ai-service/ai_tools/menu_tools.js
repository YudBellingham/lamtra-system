/**
 * MENU TOOLS - Xử lý products, categories, toppings, sizes
 * Chứa các hàm query Supabase để lấy dữ liệu menu
 */

/**
 * Tìm sản phẩm theo keyword
 */
async function searchProducts(supabase, keyword, limit = 10) {
  try {
    if (!keyword || keyword.trim().length === 0) {
      return {
        success: false,
        error: "Vui lòng cung cấp từ khóa tìm kiếm",
      };
    }

    const searchTerm = `%${keyword.toLowerCase()}%`;

    const { data, error } = await supabase
      .from("products")
      .select(
        "productid, name, baseprice, saleprice, description, label, status",
      )
      .ilike("name", searchTerm)
      .eq("status", "available")
      .limit(limit);

    if (error) {
      console.error(
        `❌ Lỗi tìm sản phẩm với keyword "${keyword}":`,
        error.message,
      );
      return {
        success: false,
        error: "Lỗi tìm kiếm sản phẩm",
      };
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        data: [],
        message: `Không tìm thấy sản phẩm với từ khóa "${keyword}"`,
      };
    }

    return {
      success: true,
      data: data.map((p) => ({
        productid: p.productid,
        name: p.name,
        baseprice: p.baseprice,
        saleprice: p.saleprice,
        description: p.description,
        label: p.label,
        price_display:
          p.saleprice && p.saleprice < p.baseprice
            ? `${p.saleprice}đ (giảm từ ${p.baseprice}đ)`
            : `${p.baseprice}đ`,
      })),
    };
  } catch (err) {
    console.error("❌ [FATAL] Lỗi trong searchProducts:", err.message);
    return {
      success: false,
      error: `Lỗi hệ thống: ${err.message}`,
    };
  }
}

/**
 * Lấy sản phẩm theo danh mục
 */
async function getProductsByCategory(supabase, categoryName, limit = 15) {
  try {
    if (!categoryName || categoryName.trim().length === 0) {
      return {
        success: false,
        error: "Vui lòng cung cấp tên danh mục",
      };
    }

    // Tìm category ID trước
    const { data: categoryData, error: catError } = await supabase
      .from("categories")
      .select("categoryid, name")
      .ilike("name", `%${categoryName}%`)
      .single();

    if (catError || !categoryData) {
      console.error("❌ Không tìm thấy danh mục:", categoryName);
      return {
        success: true,
        data: [],
        message: `Danh mục "${categoryName}" không tồn tại`,
      };
    }

    // Lấy sản phẩm của danh mục đó
    const { data: products, error: prodError } = await supabase
      .from("products")
      .select(
        "productid, name, baseprice, saleprice, description, label, status",
      )
      .eq("categoryid", categoryData.categoryid)
      .eq("status", "available")
      .limit(limit);

    if (prodError) {
      console.error(
        `❌ Lỗi lấy sản phẩm của danh mục ${categoryName}:`,
        prodError.message,
      );
      return {
        success: false,
        error: "Lỗi lấy sản phẩm",
      };
    }

    if (!products || products.length === 0) {
      return {
        success: true,
        data: [],
        message: `Danh mục "${categoryName}" hiện không có sản phẩm nào`,
      };
    }

    return {
      success: true,
      category: categoryData.name,
      data: products.map((p) => ({
        productid: p.productid,
        name: p.name,
        baseprice: p.baseprice,
        saleprice: p.saleprice,
        description: p.description,
        label: p.label,
        price_display:
          p.saleprice && p.saleprice < p.baseprice
            ? `${p.saleprice}đ (giảm từ ${p.baseprice}đ)`
            : `${p.baseprice}đ`,
      })),
    };
  } catch (err) {
    console.error("❌ [FATAL] Lỗi trong getProductsByCategory:", err.message);
    return {
      success: false,
      error: `Lỗi hệ thống: ${err.message}`,
    };
  }
}

/**
 * Lấy sản phẩm bán chạy nhất (bestseller)
 */
async function getBestsellerProducts(supabase, limit = 8) {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(
        "productid, name, baseprice, saleprice, description, label, status",
      )
      .in("label", ["bestseller", "popular"])
      .eq("status", "available")
      .limit(limit);

    if (error) {
      console.error("❌ Lỗi lấy bestseller products:", error.message);
      return {
        success: false,
        error: "Lỗi lấy sản phẩm bán chạy",
      };
    }

    if (!data || data.length === 0) {
      // Fallback: lấy những sản phẩm có giá sale
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("products")
        .select(
          "productid, name, baseprice, saleprice, description, label, status",
        )
        .not("saleprice", "is", null)
        .eq("status", "available")
        .limit(limit);

      if (fallbackError || !fallbackData || fallbackData.length === 0) {
        return {
          success: true,
          data: [],
          message: "Hiện tại danh sách bestseller chưa được cập nhật",
        };
      }

      return {
        success: true,
        data: fallbackData.map((p) => ({
          productid: p.productid,
          name: p.name,
          baseprice: p.baseprice,
          saleprice: p.saleprice,
          description: p.description,
          label: "sale",
          price_display: `${p.saleprice}đ (giảm từ ${p.baseprice}đ)`,
        })),
        message: "Danh sách sản phẩm đang sale",
      };
    }

    return {
      success: true,
      data: data.map((p) => ({
        productid: p.productid,
        name: p.name,
        baseprice: p.baseprice,
        saleprice: p.saleprice,
        description: p.description,
        label: p.label,
        price_display:
          p.saleprice && p.saleprice < p.baseprice
            ? `${p.saleprice}đ (giảm từ ${p.baseprice}đ)`
            : `${p.baseprice}đ`,
      })),
      message: "Những sản phẩm bán chạy nhất của Lam Trà",
    };
  } catch (err) {
    console.error("❌ [FATAL] Lỗi trong getBestsellerProducts:", err.message);
    return {
      success: false,
      error: `Lỗi hệ thống: ${err.message}`,
    };
  }
}

/**
 * Lấy chi tiết sản phẩm
 */
async function getProductDetails(
  supabase,
  productName = null,
  productid = null,
) {
  try {
    let productData = null;

    if (productid) {
      const { data, error } = await supabase
        .from("products")
        .select(
          "productid, name, baseprice, saleprice, description, label, status, has_size_l, categoryid",
        )
        .eq("productid", parseInt(productid))
        .single();

      if (error || !data) {
        return {
          success: false,
          error: `Không tìm thấy sản phẩm với ID ${productid}`,
        };
      }
      productData = data;
    } else if (productName) {
      const { data, error } = await supabase
        .from("products")
        .select(
          "productid, name, baseprice, saleprice, description, label, status, has_size_l, categoryid",
        )
        .ilike("name", `%${productName}%`)
        .eq("status", "available")
        .single();

      if (error || !data) {
        return {
          success: true,
          data: null,
          message: `Không tìm thấy sản phẩm "${productName}"`,
        };
      }
      productData = data;
    } else {
      return {
        success: false,
        error: "Cần cung cấp productid hoặc productName",
      };
    }

    // Lấy sizes có sẵn
    const { data: sizes, error: sizesError } = await supabase
      .from("sizes")
      .select("sizeid, name, additionalprice")
      .limit(10);

    const sizeList = sizes || [];

    return {
      success: true,
      data: {
        productid: productData.productid,
        name: productData.name,
        baseprice: productData.baseprice,
        saleprice: productData.saleprice,
        description: productData.description,
        label: productData.label,
        has_size_l: productData.has_size_l,
        price_display:
          productData.saleprice && productData.saleprice < productData.baseprice
            ? `${productData.saleprice}đ (giảm từ ${productData.baseprice}đ)`
            : `${productData.baseprice}đ`,
        available_sizes: sizeList.map((s) => ({
          name: s.name,
          additional_price: s.additionalprice,
        })),
      },
    };
  } catch (err) {
    console.error("❌ [FATAL] Lỗi trong getProductDetails:", err.message);
    return {
      success: false,
      error: `Lỗi hệ thống: ${err.message}`,
    };
  }
}

/**
 * Lấy danh sách topping có sẵn
 */
async function getAvailableToppings(supabase, limit = 20) {
  try {
    const { data, error } = await supabase
      .from("toppings")
      .select("toppingid, name, price, isavailable")
      .eq("isavailable", true)
      .limit(limit);

    if (error) {
      console.error("❌ Lỗi lấy toppings:", error.message);
      return {
        success: false,
        error: "Lỗi lấy danh sách topping",
      };
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        data: [],
        message: "Hiện tại không có topping nào có sẵn",
      };
    }

    return {
      success: true,
      data: data.map((t) => ({
        toppingid: t.toppingid,
        name: t.name,
        price: t.price,
        price_display: `+${t.price}đ`,
      })),
      message: `Có ${data.length} loại topping có sẵn`,
    };
  } catch (err) {
    console.error("❌ [FATAL] Lỗi trong getAvailableToppings:", err.message);
    return {
      success: false,
      error: `Lỗi hệ thống: ${err.message}`,
    };
  }
}

/**
 * Lấy danh sách sizes có sẵn
 */
async function getAvailableSizes(supabase) {
  try {
    const { data, error } = await supabase
      .from("sizes")
      .select("sizeid, name, additionalprice")
      .limit(10);

    if (error) {
      console.error("❌ Lỗi lấy sizes:", error.message);
      return {
        success: false,
        error: "Lỗi lấy danh sách kích thước",
      };
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        data: [],
        message: "Không có kích thước nào có sẵn",
      };
    }

    return {
      success: true,
      data: data.map((s) => ({
        sizeid: s.sizeid,
        name: s.name,
        additional_price: s.additionalprice,
        price_display:
          s.additionalprice > 0 ? `+${s.additionalprice}đ` : "Không tăng giá",
      })),
    };
  } catch (err) {
    console.error("❌ [FATAL] Lỗi trong getAvailableSizes:", err.message);
    return {
      success: false,
      error: `Lỗi hệ thống: ${err.message}`,
    };
  }
}

/**
 * Lấy danh sách tất cả danh mục
 */
async function getAllCategories(supabase) {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("categoryid, name, description")
      .limit(50);

    if (error) {
      console.error("❌ Lỗi lấy categories:", error.message);
      return {
        success: false,
        error: "Lỗi lấy danh sách danh mục",
      };
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        data: [],
        message: "Không có danh mục nào",
      };
    }

    return {
      success: true,
      data: data.map((c) => ({
        categoryid: c.categoryid,
        name: c.name,
        description: c.description,
      })),
    };
  } catch (err) {
    console.error("❌ [FATAL] Lỗi trong getAllCategories:", err.message);
    return {
      success: false,
      error: `Lỗi hệ thống: ${err.message}`,
    };
  }
}

module.exports = {
  searchProducts,
  getProductsByCategory,
  getBestsellerProducts,
  getProductDetails,
  getAvailableToppings,
  getAvailableSizes,
  getAllCategories,
};
