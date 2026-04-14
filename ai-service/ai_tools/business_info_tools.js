/**
 * BUSINESS INFO TOOLS - Xử lý thông tin kinh doanh chung
 * Các hàm cung cấp thông tin về chương trình loyalty, chính sách vận chuyển, etc.
 */

/**
 * Lấy thông tin chương trình loyalty/thành viên
 */
function getLoyaltyProgramInfo() {
  try {
    const loyaltyInfo = {
      success: true,
      data: {
        program_name: "Chương Trình Thành Viên Lam Trà",
        membership_tiers: [
          {
            tier_name: "Thành viên thường",
            min_points: 0,
            discount: "0%",
            benefits: ["Tích điểm cho mỗi đơn hàng"],
          },
          {
            tier_name: "Hạng Bạc",
            min_points: 100,
            required_total: "100 điểm tích lũy",
            discount: "2%",
            benefits: ["Giảm 2% trên mỗi đơn", "Tích điểm nhanh hơn"],
          },
          {
            tier_name: "Hạng Vàng",
            min_points: 500,
            required_total: "500 điểm tích lũy",
            discount: "5%",
            benefits: [
              "Giảm 5% trên mỗi đơn",
              "Ưu tiên hỗ trợ",
              "Voucher độc quyền",
            ],
          },
        ],
        points_earning: {
          rule: "Mỗi 100k đơn hàng = 200 điểm",
          can_redeem: true,
          redemption: "Điểm có thể dùng để giảm giá hoặc đổi quà",
        },
        how_to_join: "Đăng ký thành viên miễn phí trên app hoặc website",
      },
    };

    return loyaltyInfo;
  } catch (err) {
    console.error("❌ [FATAL] Lỗi trong getLoyaltyProgramInfo:", err.message);
    return {
      success: false,
      error: `Lỗi hệ thống: ${err.message}`,
    };
  }
}

/**
 * Lấy thông tin chính sách giao hàng
 */
function getShippingPolicyInfo() {
  try {
    const shippingPolicy = {
      success: true,
      data: {
        policy_name: "Chính Sách Giao Hàng Lam Trà",
        business_hours: "8:00 - 22:00 (hàng ngày)",
        minimum_order: {
          with_shipping_fee: "Từ 30k trở lên",
          free_shipping: "Từ 100k trở lên",
          default_fee: "15k - 20k (Tùy khu vực)",
        },
        delivery_time: {
          normal: "30 - 45 phút (Tùy khu vực)",
          peak_hours: "Có thể lâu hơn 1 - 2 giờ vào giờ cao điểm",
        },
        delivery_areas: [
          "Quận Hoàn Kiếm",
          "Quận Ba Đình",
          "Quận Hà Đông",
          "Quận Thanh Xuân",
          "Quận Cầu Giấy",
          "Quận Bắc Từ Liêm",
          "Khu vực khác: Liên hệ hotline",
        ],
        promotions: {
          new_customer: "Voucher 10% cho đơn hàng đầu tiên",
          requirements: "Có điều kiện và thời hạn áp dụng",
        },
        payment_methods: [
          "Thanh toán trực tiếp (COD)",
          "Transfer ngân hàng",
          "Ví điện tử",
        ],
      },
    };

    return shippingPolicy;
  } catch (err) {
    console.error("❌ [FATAL] Lỗi trong getShippingPolicyInfo:", err.message);
    return {
      success: false,
      error: `Lỗi hệ thống: ${err.message}`,
    };
  }
}

/**
 * Lấy thông tin chung về Lam Trà
 */
function getLamTraAboutInfo() {
  try {
    const aboutInfo = {
      success: true,
      data: {
        brand_name: "Lam Trà",
        tagline: "Trà Sữa Việt Nam - Hương vị truyền thống kết hợp hiện đại",
        specialty:
          "Chuyên về Trà Sữa Việt Nam với nguyên liệu tươi, không hóa chất",
        values: [
          "Nguyên liệu tươi và sạch",
          "Không sử dụng hóa chất",
          "Dịch vụ thân thiện, tư vấn 24/7",
          "Giá cả hợp lý, chất lượng cao",
        ],
        operating_hours: "8:00 - 22:00 (hàng ngày, 7 ngày/tuần)",
        contact_info: {
          note: "Để cược liên hệ chi nhánh gần nhất",
          use_tool: "get_all_branches để xem danh sách chi nhánh",
        },
      },
    };

    return aboutInfo;
  } catch (err) {
    console.error("❌ [FATAL] Lỗi trong getLamTraAboutInfo:", err.message);
    return {
      success: false,
      error: `Lỗi hệ thống: ${err.message}`,
    };
  }
}

module.exports = {
  getLoyaltyProgramInfo,
  getShippingPolicyInfo,
  getLamTraAboutInfo,
};
