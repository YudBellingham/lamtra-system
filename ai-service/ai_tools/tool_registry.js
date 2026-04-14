/**
 * TOOL REGISTRY - Định nghĩa JSON Schema của tất cả tools
 * Format: Groq Function Calling (OpenAI compatible)
 * Các tools này sẽ được gửi cho LLM để AI tự động quyết định gọi hàm nào
 */

const TOOLS = [
  // ==================== CUSTOMER TOOLS ====================
  {
    type: "function",
    function: {
      name: "get_customer_loyalty_info",
      description:
        "Lấy thông tin tích điểm, hạng thẻ, điểm tích lũy của khách hàng. Dùng khi khách hỏi về hạng thẻ, có bao nhiêu điểm.",
      parameters: {
        type: "object",
        properties: {
          customerid: {
            type: "integer",
            description: "ID của khách hàng",
          },
          authid: {
            type: "string",
            description:
              "UUID của khách hàng (dùng nếu query bằng auth ID thay vì customerid)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_customer_orders",
      description:
        "Lấy lịch sử đơn hàng của khách hàng. Dùng khi khách hỏi về các đơn hàng trước đó, trạng thái đơn.",
      parameters: {
        type: "object",
        properties: {
          customerid: {
            type: "integer",
            description: "ID của khách hàng",
          },
          limit: {
            type: "integer",
            description: "Số lượng đơn hàng trả về (mặc định 5)",
            default: 5,
          },
          status_filter: {
            type: "string",
            enum: [
              "pending",
              "confirmed",
              "preparing",
              "completed",
              "cancelled",
            ],
            description: "Lọc theo trạng thái đơn hàng (optional)",
          },
        },
        required: ["customerid"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_customer_favorites",
      description:
        "Lấy danh sách sản phẩm yêu thích của khách hàng. Dùng khi khách hỏi về những sản phẩm yêu thích, đã lưu.",
      parameters: {
        type: "object",
        properties: {
          customerid: {
            type: "integer",
            description: "ID của khách hàng",
          },
          limit: {
            type: "integer",
            description: "Số lượng sản phẩm trả về (mặc định 10)",
            default: 10,
          },
        },
        required: ["customerid"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_customer_order_templates",
      description:
        "Lấy danh sách các đơn hàng mẫu/combo yêu thích của khách. Dùng khi khách muốn gọi lại combo cũ.",
      parameters: {
        type: "object",
        properties: {
          customerid: {
            type: "integer",
            description: "ID của khách hàng",
          },
          limit: {
            type: "integer",
            description: "Số lượng template trả về (mặc định 5)",
            default: 5,
          },
        },
        required: ["customerid"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_customer_by_phone",
      description:
        "Tìm khách hàng bằng số điện thoại. Dùng khi khách cung cấp SĐT để lấy thông tin cá nhân.",
      parameters: {
        type: "object",
        properties: {
          phone: {
            type: "string",
            description: "Số điện thoại 10 chữ số (VD: 0987654321)",
          },
        },
        required: ["phone"],
      },
    },
  },

  // ==================== MENU & PRODUCT TOOLS ====================
  {
    type: "function",
    function: {
      name: "search_products",
      description:
        "Tìm sản phẩm theo tên hoặc từ khóa. Dùng khi khách tìm một loại đồ uống cụ thể.",
      parameters: {
        type: "object",
        properties: {
          keyword: {
            type: "string",
            description:
              "Tên sản phẩm hoặc từ khóa tìm kiếm (VD: trà sữa, matcha)",
          },
          limit: {
            type: "integer",
            description: "Số lượng kết quả trả về (mặc định 10)",
            default: 10,
          },
        },
        required: ["keyword"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_products_by_category",
      description:
        "Lấy sản phẩm theo danh mục (Trà sữa, Trà trái cây, Cà phê...). Dùng khi khách hỏi có món nào trong danh mục nào đó.",
      parameters: {
        type: "object",
        properties: {
          category_name: {
            type: "string",
            description:
              "Tên danh mục (VD: Trà sữa, Trà trái cây, Cà phê, Đồ ăn)",
          },
          limit: {
            type: "integer",
            description: "Số lượng sản phẩm trả về (mặc định 15)",
            default: 15,
          },
        },
        required: ["category_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_bestseller_products",
      description:
        "Lấy danh sách sản phẩm bán chạy nhất/phổ biến nhất. Dùng khi khách hỏi gợi ý, món nào ngon nhất.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            description: "Số lượng bestseller trả về (mặc định 8)",
            default: 8,
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_product_details",
      description:
        "Lấy chi tiết sản phẩm: giá, mô tả, hình ảnh, sizes, kích thước. Dùng khi khách muốn xem thông tin chi tiết của một sản phẩm.",
      parameters: {
        type: "object",
        properties: {
          product_name: {
            type: "string",
            description: "Tên sản phẩm cần xem chi tiết",
          },
          productid: {
            type: "integer",
            description: "ID của sản phẩm (nếu biết)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_available_toppings",
      description:
        "Lấy danh sách đồ thêm/topping có sẵn (boba, thạch, trân châu...). Dùng khi khách hỏi có topping gì.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            description: "Số lượng topping trả về (mặc định 20)",
            default: 20,
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_available_sizes",
      description:
        "Lấy danh sách kích thước sẵn có (M, L...). Dùng khi khách hỏi có size nào.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_all_categories",
      description:
        "Lấy danh sách tất cả danh mục sản phẩm. Dùng khi khách hỏi Lam Trà có danh mục nào.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },

  // ==================== ORDER TOOLS ====================
  {
    type: "function",
    function: {
      name: "get_order_status",
      description:
        "Lấy trạng thái đơn hàng. Dùng khi khách hỏi đơn hàng của họ ở đâu rồi, tình trạng thế nào.",
      parameters: {
        type: "object",
        properties: {
          orderid: {
            type: "string",
            description: "ID của đơn hàng (VD: ORD-001)",
          },
          customerid: {
            type: "integer",
            description: "ID của khách hàng (để xác thực quyền truy cập)",
          },
        },
        required: ["orderid"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_order_details",
      description:
        "Lấy chi tiết đơn hàng (danh sách các sản phẩm, toppings, size, giá). Dùng khi khách muốn xem chi tiết những gì họ đã đặt.",
      parameters: {
        type: "object",
        properties: {
          orderid: {
            type: "string",
            description: "ID của đơn hàng",
          },
          customerid: {
            type: "integer",
            description: "ID của khách hàng (để xác thực)",
          },
        },
        required: ["orderid"],
      },
    },
  },

  // ==================== BRANCH & INVENTORY TOOLS ====================
  {
    type: "function",
    function: {
      name: "get_all_branches",
      description:
        "Lấy danh sách tất cả chi nhánh của Lam Trà. Dùng khi khách hỏi Lam Trà có chi nhánh ở đâu.",
      parameters: {
        type: "object",
        properties: {
          include_closed: {
            type: "boolean",
            description: "Có lấy chi nhánh đã đóng không (mặc định false)",
            default: false,
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_branch_info",
      description:
        "Lấy thông tin chi tiết của một chi nhánh (địa chỉ, phone, giờ mở cửa, tọa độ). Dùng khi khách hỏi chi nhánh cụ thể.",
      parameters: {
        type: "object",
        properties: {
          branch_name: {
            type: "string",
            description: "Tên chi nhánh (VD: Lam Trà Tây Hồ)",
          },
          branchid: {
            type: "integer",
            description: "ID của chi nhánh (nếu biết)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_branch_menu_status",
      description:
        "Lấy menu của một chi nhánh cụ thể (những sản phẩm có sẵn hoặc hết). Dùng khi khách hỏi chi nhánh X có món gì.",
      parameters: {
        type: "object",
        properties: {
          branchid: {
            type: "integer",
            description: "ID của chi nhánh",
          },
          branch_name: {
            type: "string",
            description: "Tên chi nhánh (nếu không biết ID)",
          },
          status_filter: {
            type: "string",
            enum: ["available", "unavailable", "all"],
            description:
              "Lọc theo trạng thái (mặc định: available = chỉ những món có sẵn)",
            default: "available",
          },
        },
        required: [],
      },
    },
  },

  // ==================== BUSINESS INFO TOOLS ====================
  {
    type: "function",
    function: {
      name: "get_loyalty_program_info",
      description:
        "Lấy thông tin chương trình loyalty/thành viên của Lam Trà (cách tích điểm, hạng thẻ, ưu đãi). Dùng khi khách hỏi về điểm, hạng thẻ như thế nào.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_shipping_policy",
      description:
        "Lấy chính sách giao hàng/vận chuyển của Lam Trà (freeship bao nhiêu, thời gian giao, phí). Dùng khi khách hỏi vận chuyển, giao hàng.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
];

module.exports = TOOLS;
