/**
 * AI TOOLS INDEX
 * Export tất cả các tool modules
 */

const customerTools = require("./customer_tools");
const menuTools = require("./menu_tools");
const orderTools = require("./order_tools");
const branchTools = require("./branch_tools");
const businessInfoTools = require("./business_info_tools");
const TOOLS = require("./tool_registry");

module.exports = {
  // Tools definition (JSON Schema)
  TOOLS,

  // Tool implementations (grouped by module)
  customerTools,
  menuTools,
  orderTools,
  branchTools,
  businessInfoTools,

  // Flat exports for easier access
  ...customerTools,
  ...menuTools,
  ...orderTools,
  ...branchTools,
  ...businessInfoTools,
};
