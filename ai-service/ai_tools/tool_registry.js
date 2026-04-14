/**
 * FOCUSED TOOL REGISTRY - 15 single-purpose tools
 * PRINCIPLE: Each tool has EXPLICIT, MINIMAL parameters
 * NO ambiguity → Groq's validator will accept all calls
 *
 * Architecture:
 * - MENU: 5 tools (search, categories, bestsellers, details, extras)
 * - CUSTOMER: 4 tools (loyalty, orders, favorites, templates)
 * - ORDER: 2 tools (status, details)
 * - BRANCH: 3 tools (list, info, menu)
 * - POLICY: 2 tools (loyalty, shipping)
 */

const TOOLS = [
  // ═══════════════════════════════════════════════════════════════
  // MENU TOOLS (5)
  // ═══════════════════════════════════════════════════════════════
  {
    type: "function",
    function: {
      name: "menu_search",
      description: "Search for products by name or keyword",
      parameters: {
        type: "object",
        properties: {
          keyword: {
            type: "string",
            description:
              "Product name or keyword (e.g., 'trà chanh', 'cà phê')",
          },
          limit: {
            type: "integer",
            default: 10,
            description: "Maximum results to return",
          },
        },
        required: ["keyword"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "menu_categories",
      description: "Get all available product categories",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            default: 20,
            description: "Maximum categories to return",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "menu_bestsellers",
      description: "Get best-selling or popular products",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            default: 5,
            description: "Number of bestsellers to return",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "menu_product_details",
      description: "Get detailed information about a specific product",
      parameters: {
        type: "object",
        properties: {
          product_id: {
            type: "integer",
            description: "Product ID number",
          },
          product_name: {
            type: "string",
            description: "Product name to search for",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "menu_extras",
      description: "Get toppings or sizes available for drinks",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["toppings", "sizes"],
            description: "Type of extras to retrieve",
          },
          limit: {
            type: "integer",
            default: 20,
            description: "Maximum items to return",
          },
        },
        required: ["type"],
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // CUSTOMER TOOLS (4)
  // ═══════════════════════════════════════════════════════════════
  {
    type: "function",
    function: {
      name: "customer_loyalty",
      description: "Get customer loyalty points and membership information",
      parameters: {
        type: "object",
        properties: {
          customer_id: {
            type: "integer",
            description: "Customer ID",
          },
          phone_number: {
            type: "string",
            description: "Customer phone number (10 digits)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "customer_orders",
      description: "Get customer order history",
      parameters: {
        type: "object",
        properties: {
          customer_id: {
            type: "integer",
            description: "Customer ID",
          },
          order_status: {
            type: "string",
            enum: [
              "pending",
              "confirmed",
              "preparing",
              "ready",
              "delivering",
              "delivered",
              "cancelled",
            ],
            description: "Filter by order status",
          },
          limit: {
            type: "integer",
            default: 10,
            description: "Maximum orders to return",
          },
        },
        required: ["customer_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "customer_favorites",
      description: "Get customer's favorite products",
      parameters: {
        type: "object",
        properties: {
          customer_id: {
            type: "integer",
            description: "Customer ID",
          },
          limit: {
            type: "integer",
            default: 10,
            description: "Maximum favorites to return",
          },
        },
        required: ["customer_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "customer_templates",
      description: "Get customer's saved drink templates/combos",
      parameters: {
        type: "object",
        properties: {
          customer_id: {
            type: "integer",
            description: "Customer ID",
          },
          limit: {
            type: "integer",
            default: 10,
            description: "Maximum templates to return",
          },
        },
        required: ["customer_id"],
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // ORDER TOOLS (2)
  // ═══════════════════════════════════════════════════════════════
  {
    type: "function",
    function: {
      name: "order_status",
      description: "Get current status of an order",
      parameters: {
        type: "object",
        properties: {
          order_id: {
            type: "string",
            description: "Order ID or order number",
          },
          customer_id: {
            type: "integer",
            description: "Customer ID (optional, for verification)",
          },
        },
        required: ["order_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "order_details",
      description: "Get detailed information about an order with all items",
      parameters: {
        type: "object",
        properties: {
          order_id: {
            type: "string",
            description: "Order ID or order number",
          },
        },
        required: ["order_id"],
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // BRANCH TOOLS (3)
  // ═══════════════════════════════════════════════════════════════
  {
    type: "function",
    function: {
      name: "branch_list",
      description: "Get list of all Lam Trà branches",
      parameters: {
        type: "object",
        properties: {
          include_inactive: {
            type: "boolean",
            default: false,
            description: "Include closed branches",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "branch_info",
      description: "Get detailed information about a specific branch",
      parameters: {
        type: "object",
        properties: {
          branch_id: {
            type: "integer",
            description: "Branch ID number",
          },
          branch_name: {
            type: "string",
            description: "Branch name to search for",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "branch_menu",
      description: "Get products available at a specific branch",
      parameters: {
        type: "object",
        properties: {
          branch_id: {
            type: "integer",
            description: "Branch ID number",
          },
          branch_name: {
            type: "string",
            description: "Branch name",
          },
          product_status: {
            type: "string",
            enum: ["available", "unavailable", "all"],
            default: "available",
            description: "Filter by product availability",
          },
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // POLICY TOOLS (2)
  // ═══════════════════════════════════════════════════════════════
  {
    type: "function",
    function: {
      name: "policy_loyalty",
      description: "Get information about Lam Trà loyalty program",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "policy_shipping",
      description: "Get information about shipping and delivery",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];

module.exports = TOOLS;
