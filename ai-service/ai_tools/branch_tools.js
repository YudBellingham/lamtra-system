/**
 * BRANCH TOOLS - Consolidated branch queries
 * Gộp: list, info, menu status
 */

async function getBranchData(supabase, type, params = {}) {
  try {
    const {
      include_closed = false,
      branch_name,
      branchid,
      status_filter = "available",
    } = params;

    switch (type) {
      case "list": {
        let q = supabase
          .from("branches")
          .select(
            "branchid, name, address, phone, opentime, closetime, latitude, longitude, isactive",
          );
        if (!include_closed) q = q.eq("isactive", true);
        const { data } = await q.order("name");
        return {
          success: !!data,
          data:
            data?.map((b) => ({
              branchid: b.branchid,
              name: b.name,
              address: b.address,
              phone: b.phone,
              hours: `${b.opentime}-${b.closetime}`,
            })) || [],
        };
      }

      case "info": {
        let q = supabase
          .from("branches")
          .select("branchid, name, address, phone, opentime, closetime");
        if (branchid) q = q.eq("branchid", parseInt(branchid));
        else if (branch_name) q = q.ilike("name", `%${branch_name}%`);
        else
          return { success: false, error: "branchid or branch_name required" };
        const { data } = await q.single();
        return {
          success: !!data,
          data: data
            ? {
                branchid: data.branchid,
                name: data.name,
                address: data.address,
                phone: data.phone,
                hours: `${data.opentime}-${data.closetime}`,
              }
            : null,
        };
      }

      case "menu": {
        if (!branchid && !branch_name)
          return { success: false, error: "branchid or branch_name required" };
        let bid = branchid;
        if (!bid && branch_name) {
          const { data: bData } = await supabase
            .from("branches")
            .select("branchid")
            .ilike("name", `%${branch_name}%`)
            .single();
          if (!bData) return { success: false, error: "Branch not found" };
          bid = bData.branchid;
        }
        let q = supabase
          .from("branchproductstatus")
          .select("*, products(name, baseprice)")
          .eq("branchid", bid);
        if (status_filter !== "all") q = q.eq("status", status_filter);
        const { data } = await q;
        return {
          success: !!data,
          data:
            data?.map((p) => ({
              name: p.products?.name,
              price: p.products?.baseprice,
              status: p.status,
            })) || [],
        };
      }

      default:
        return { success: false, error: `Unknown type: ${type}` };
    }
  } catch (err) {
    console.error(`❌ [branchData:${type}]`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { getBranchData };
