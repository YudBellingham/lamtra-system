/**
 * OPTIMIZED TOOL REGISTRY - 5 consolidated tools
 * Reduced from 19 → 5 tools (73% reduction in schema size)
 * Schema: ~1200 tokens (vs 5000+ before)
 */

const TOOLS = [
  {
    type: "function",
    function: {
      name: "query_menu",
      description:
        "Menu data: search, categories, bestsellers, sizes, toppings, details",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: [
              "search",
              "category",
              "bestseller",
              "details",
              "toppings",
              "sizes",
              "categories",
            ],
            description: "Query type",
          },
          keyword: { type: "string", description: "Search term" },
          category_name: { type: "string", description: "Category name" },
          product_name: { type: "string", description: "Product name" },
          productid: { type: "integer", description: "Product ID" },
          limit: { type: "integer", description: "Result limit" },
        },
        required: ["type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_customer",
      description:
        "Customer data: loyalty, orders, favorites, templates, phone search",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["loyalty", "orders", "favorites", "templates", "search"],
            description: "Query type",
          },
          customerid: { type: "integer", description: "Customer ID" },
          authid: { type: "string", description: "Auth UUID" },
          phone: { type: "string", description: "Phone (10 digits)" },
          status_filter: { type: "string", description: "Order status" },
          limit: { type: "integer", description: "Result limit" },
        },
        required: ["type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_order",
      description: "Order data: status, detailed info with items",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["status", "details"],
            description: "Query type",
          },
          orderid: { type: "string", description: "Order ID" },
          customerid: { type: "integer", description: "Customer ID (verify)" },
        },
        required: ["type", "orderid"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_branch",
      description: "Branch data: list all, info, menu status",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["list", "info", "menu"],
            description: "Query type",
          },
          branch_name: { type: "string", description: "Branch name" },
          branchid: { type: "integer", description: "Branch ID" },
          status_filter: {
            type: "string",
            enum: ["available", "unavailable", "all"],
            description: "Product filter",
          },
          include_closed: {
            type: "boolean",
            description: "Include closed branches",
          },
        },
        required: ["type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_policy",
      description: "Business policies: loyalty program, shipping info",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["loyalty", "shipping"],
            description: "Policy type",
          },
        },
        required: ["type"],
      },
    },
  },
];

module.exports = TOOLS;
