**Workflow 1: Customer Ordering Flow**

### Actor
- Customer (using the Customer Website)

### Trigger
- Customer selects products and branches on the website

### Step-by-step Logic:

1. **Product Selection**: Customer adds items to their cart.
2. **Branch Selection**: Customer selects a branch for pickup or delivery.
3. **Order Review**: Customer reviews their order details.
4. **Payment Selection**: Customer chooses payment method (COD or online transfer).
5. **Payment Processing**: If online transfer, redirect to payment gateway.

### Conditional Branches:

- If COD is chosen:
  - No further action needed; proceed with order creation.
- If online transfer is chosen:
  - Redirect to payment gateway for processing.

### Final Result
- Successful order creation and processing.

---

**Workflow 2: Branch Selection Logic**

### Actor
- Customer (using the Customer Website)

### Trigger
- Customer attempts to place an order

### Step-by-step Logic:

1. **Get Available Branches**: System retrieves a list of available branches.
2. **Filter by Location**: If customer enters location, filter branches based on proximity.
3. **Display Branch Options**: Display available branches with their respective addresses and operating hours.

### Conditional Branches:
- None needed as the system displays all relevant information for customer choice.

### Final Result
- Customer selects a branch to proceed with order.

---

**Workflow 3: Order Processing Flow (Staff Side)**

### Actor
- Staff Member (using Staff Order Management)

### Trigger
- New order is received from the backend API

### Step-by-step Logic:

1. **Notify Staff**: System notifies staff of new order via notifications or dashboard updates.
2. **Order Review**: Staff reviews order details for accuracy.
3. **Prepare Order**: Staff prepares order according to customer specifications.
4. **Mark as Ready**: Once prepared, mark the order as ready for collection.

### Conditional Branches:
- None needed as this is a straightforward process for staff.

### Final Result
- Order is successfully processed and marked as ready.

---

**Workflow 4: Payment Flow (COD and Online Transfer)**

### Actor
- Customer (using the Customer Website) or Staff Member (using Staff Order Management)

### Trigger
- Customer chooses payment method while placing an order, or staff member processes COD at branch

### Step-by-step Logic:

#### For Online Transfer:
1. **Redirect to Payment Gateway**: Redirect customer to a secure payment gateway for processing.
2. **Verify Payment Success**: After payment is made, the payment gateway redirects back to Lamtra with success status.

#### For Cash on Delivery (COD):
1. **Staff Verification**: When order is collected by staff, they verify the COD amount and process accordingly.

### Conditional Branches:

- If online transfer fails:
  - Display error message and allow customer to try again.
- If COD payment is successful (staff verifies):
  - Mark order as paid and proceed with order creation.

### Final Result
- Successful transaction processing for both payment methods.

---

**Workflow 5: Loyalty Point Accumulation Flow**

### Actor
- Customer (using the Customer Website)

### Trigger
- Order is successfully completed

### Step-by-step Logic:

1. **Check Eligibility**: System checks if customer has made a purchase and meets loyalty program criteria.
2. **Accumulate Points**: If eligible, add points to customer's account based on purchase amount or type.

### Conditional Branches:
- None needed as this is a straightforward accumulation process based on conditions met by the customer.

### Final Result
- Customer's loyalty point balance is updated accordingly.

---

**Workflow 6: Order Status Lifecycle**

### Actor
- System (automatically updating order status)

### Trigger
- Various actions throughout order processing (e.g., order received, prepared, collected)

### Step-by-step Logic:

1. **Order Received**: Mark as "Received" when customer places an order.
2. **Order Prepared**: Update to "Prepared" once staff prepares the order.
3. **Order Collected**: Update to "Collected" when order is collected by customer.
4. **Order Paid**: Update to "Paid" when payment is successfully processed.

### Conditional Branches:
- None needed as this workflow is based on system updates triggered by various events.

### Final Result
- Order status accurately reflects its current state throughout the process.

---

**Workflow 7: Review and Feedback Flow**

### Actor
- Customer (using the Customer Website)

### Trigger
- After order completion

### Step-by-step Logic:

1. **Display Review Form**: Show a review form for customers to leave feedback.
2. **Submit Feedback**: Customer submits their review, which can include rating and comments.

### Conditional Branches:
- None needed as this is an optional process for customer satisfaction feedback.

### Final Result
- Customers have the opportunity to provide feedback on their experience with Lamtra.