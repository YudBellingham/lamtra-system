/**
 * BUSINESS INFO TOOLS - Consolidated static policy info
 * Gộp: loyalty program, shipping policy
 */

function getBusinessPolicy(type, params = {}) {
  try {
    switch (type) {
      case "loyalty": {
        return {
          success: true,
          data: {
            program: "Chương Trình Thành Viên Lam Trà",
            tiers: [
              { tier: "Thành viên", min_points: 0, discount: "0%" },
              { tier: "Hạng Bạc", min_points: 100, discount: "2%" },
              { tier: "Hạng Vàng", min_points: 500, discount: "5%" },
            ],
            earning: "100k = 200 điểm",
            join: "Miễn phí trên app/website",
          },
        };
      }

      case "shipping": {
        return {
          success: true,
          data: {
            policy: "Chính Sách Giao Hàng Lam Trà",
            hours: "8:00-22:00",
            min_order: { standard: "30k", free: "100k+" },
            fee: "15k-20k",
            time: { normal: "30-45 phút", peak: "1-2 giờ" },
            areas: [
              "Hoàn Kiếm",
              "Ba Đình",
              "Hà Đông",
              "Thanh Xuân",
              "Cầu Giấy",
            ],
            promo: "10% khách mới",
            payment: ["COD", "Transfer", "E-wallet"],
          },
        };
      }

      default:
        return { success: false, error: `Unknown type: ${type}` };
    }
  } catch (err) {
    console.error(`❌ [policy:${type}]`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { getBusinessPolicy };
