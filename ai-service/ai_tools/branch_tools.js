/**
 * BRANCH & INVENTORY TOOLS - Xử lý branches, menu status, inventory
 * Chứa các hàm query Supabase để lấy dữ liệu chi nhánh và kho
 */

/**
 * Lấy danh sách tất cả chi nhánh
 */
async function getAllBranches(supabase, includeClosed = false) {
  try {
    let query = supabase
      .from("branches")
      .select(
        "branchid, name, address, phone, opentime, closetime, latitude, longitude, isactive",
      );

    if (!includeClosed) {
      query = query.eq("isactive", true);
    }

    const { data, error } = await query.order("name");

    if (error) {
      console.error("❌ Lỗi lấy danh sách branches:", error.message);
      return {
        success: false,
        error: "Lỗi lấy danh sách chi nhánh",
      };
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        data: [],
        message: "Không có chi nhánh nào",
      };
    }

    return {
      success: true,
      data: data.map((b) => ({
        branchid: b.branchid,
        name: b.name,
        address: b.address,
        phone: b.phone,
        opentime: b.opentime,
        closetime: b.closetime,
        latitude: b.latitude,
        longitude: b.longitude,
        is_active: b.isactive,
        business_hours: `${b.opentime} - ${b.closetime}`,
      })),
    };
  } catch (err) {
    console.error("❌ [FATAL] Lỗi trong getAllBranches:", err.message);
    return {
      success: false,
      error: `Lỗi hệ thống: ${err.message}`,
    };
  }
}

/**
 * Lấy thông tin chi tiết của một chi nhánh
 */
async function getBranchInfo(supabase, branchName = null, branchid = null) {
  try {
    let branchData = null;

    if (branchid) {
      const { data, error } = await supabase
        .from("branches")
        .select(
          "branchid, name, address, phone, opentime, closetime, latitude, longitude, isactive",
        )
        .eq("branchid", parseInt(branchid))
        .single();

      if (error || !data) {
        return {
          success: false,
          error: `Không tìm thấy chi nhánh với ID ${branchid}`,
        };
      }
      branchData = data;
    } else if (branchName) {
      const { data, error } = await supabase
        .from("branches")
        .select(
          "branchid, name, address, phone, opentime, closetime, latitude, longitude, isactive",
        )
        .ilike("name", `%${branchName}%`)
        .single();

      if (error || !data) {
        return {
          success: true,
          data: null,
          message: `Không tìm thấy chi nhánh "${branchName}"`,
        };
      }
      branchData = data;
    } else {
      return {
        success: false,
        error: "Cần cung cấp branchid hoặc branchName",
      };
    }

    return {
      success: true,
      data: {
        branchid: branchData.branchid,
        name: branchData.name,
        address: branchData.address,
        phone: branchData.phone,
        opentime: branchData.opentime,
        closetime: branchData.closetime,
        latitude: branchData.latitude,
        longitude: branchData.longitude,
        business_hours: `${branchData.opentime} - ${branchData.closetime}`,
        is_active: branchData.isactive,
      },
    };
  } catch (err) {
    console.error("❌ [FATAL] Lỗi trong getBranchInfo:", err.message);
    return {
      success: false,
      error: `Lỗi hệ thống: ${err.message}`,
    };
  }
}

/**
 * Lấy menu status của một chi nhánh (những sản phẩm nào còn, nào hết)
 */
async function getBranchMenuStatus(
  supabase,
  branchid = null,
  branchName = null,
  statusFilter = "available",
) {
  try {
    let actualBranchid = branchid;

    // Tìm branchid từ branchName nếu cần
    if (!actualBranchid && branchName) {
      const { data: branchData, error: branchError } = await supabase
        .from("branches")
        .select("branchid")
        .ilike("name", `%${branchName}%`)
        .single();

      if (branchError || !branchData) {
        return {
          success: true,
          data: [],
          message: `Không tìm thấy chi nhánh "${branchName}"`,
        };
      }
      actualBranchid = branchData.branchid;
    }

    if (!actualBranchid) {
      return {
        success: false,
        error: "Cần cung cấp branchid hoặc branchName",
      };
    }

    // Lấy menu status của chi nhánh
    let query = supabase
      .from("branchproductstatus")
      .select(
        `status,
        products(productid, name, baseprice, saleprice, description)`,
      )
      .eq("branchid", parseInt(actualBranchid));

    if (statusFilter === "available") {
      query = query.eq("status", "Còn món");
    } else if (statusFilter === "unavailable") {
      query = query.eq("status", "Hết món");
    }
    // Nếu statusFilter === "all", không lọc

    const { data, error } = await query;

    if (error) {
      console.error(
        `❌ Lỗi lấy menu status của branch ${actualBranchid}:`,
        error.message,
      );
      return {
        success: false,
        error: "Lỗi lấy menu của chi nhánh",
      };
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        data: [],
        message: `Chi nhánh không có thông tin menu`,
      };
    }

    return {
      success: true,
      branchid: actualBranchid,
      data: data
        .filter((item) => item.products) // Lọc những mục có product data
        .map((item) => ({
          productid: item.products.productid,
          product_name: item.products.name,
          baseprice: item.products.baseprice,
          saleprice: item.products.saleprice,
          description: item.products.description,
          status: item.status,
          price_display:
            item.products.saleprice &&
            item.products.saleprice < item.products.baseprice
              ? `${item.products.saleprice}đ (giảm từ ${item.products.baseprice}đ)`
              : `${item.products.baseprice}đ`,
        })),
    };
  } catch (err) {
    console.error("❌ [FATAL] Lỗi trong getBranchMenuStatus:", err.message);
    return {
      success: false,
      error: `Lỗi hệ thống: ${err.message}`,
    };
  }
}

module.exports = {
  getAllBranches,
  getBranchInfo,
  getBranchMenuStatus,
};
