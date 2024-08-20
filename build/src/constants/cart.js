"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tamaraPaymentGatwayStatus = exports.networkPaymentGatwayStatus = exports.tabbyPaymentGatwaySuccessStatus = exports.tabbyPaymentGatwayStatus = exports.tapPaymentGatwayStatus = exports.orderTypes = exports.orderPaymentStatus = exports.couponDiscountType = exports.paymentMethods = exports.couponDeviceType = exports.couponTypes = exports.orderProductStatusMap = exports.orderStatusMap = exports.orderProductReturnQuantityStatusArray = exports.orderProductReturnQuantityStatusJson = exports.orderProductReturnStatusArray = exports.orderReturnStatusMessages = exports.orderProductReturnStatusJson = exports.orderProductCancelStatusMessages = exports.orderProductCancelStatusJson = exports.orderProductStatussMessages = exports.orderProductStatusArray = exports.orderProductStatusJson = exports.orderStatusMessages = exports.orderStatusArray = exports.orderStatusArrayJson = exports.cartStatus = void 0;
exports.cartStatus = {
    active: "1",
    order: "2",
    delivered: "3"
};
exports.orderStatusArrayJson = {
    pending: "1",
    processing: "2",
    packed: "3",
    shipped: "4",
    delivered: "5",
    canceled: "6",
    returned: "7",
    refunded: "8",
    partiallyShipped: "9",
    onHold: "10",
    failed: "11",
    completed: "12",
    pickup: "13",
    partiallyDelivered: "14",
    partiallyCanceled: "15",
    partiallyReturned: "16",
    partiallyRefunded: "17",
};
exports.orderStatusArray = [
    { value: exports.orderStatusArrayJson.pending, label: "Pending" },
    { value: exports.orderStatusArrayJson.processing, label: "Processing" },
    { value: exports.orderStatusArrayJson.packed, label: "Packed" },
    { value: exports.orderStatusArrayJson.shipped, label: "Shipped" },
    { value: exports.orderStatusArrayJson.delivered, label: "Delivered" },
    { value: exports.orderStatusArrayJson.canceled, label: "Canceled" },
    { value: exports.orderStatusArrayJson.returned, label: "Returned" },
    { value: exports.orderStatusArrayJson.refunded, label: "Refunded" },
    { value: exports.orderStatusArrayJson.partiallyShipped, label: "Partially Shipped" },
    { value: exports.orderStatusArrayJson.onHold, label: "On Hold" },
    { value: exports.orderStatusArrayJson.failed, label: "Failed" },
    { value: exports.orderStatusArrayJson.completed, label: "Completed" },
    { value: exports.orderStatusArrayJson.pickup, label: "Pickup" },
    { value: exports.orderStatusArrayJson.partiallyDelivered, label: "Partially Delivered" },
    { value: exports.orderStatusArrayJson.partiallyCanceled, label: "Partially Canceled" },
    { value: exports.orderStatusArrayJson.partiallyReturned, label: "Partially Returned" },
    { value: exports.orderStatusArrayJson.partiallyRefunded, label: "Partially Refunded" },
];
exports.orderStatusMessages = {
    [exports.orderStatusArrayJson.pending]: 'Order received successfully!',
    [exports.orderStatusArrayJson.processing]: 'Order is now being processed!',
    [exports.orderStatusArrayJson.packed]: 'Order has been packed!',
    [exports.orderStatusArrayJson.shipped]: 'Order has been shipped!',
    [exports.orderStatusArrayJson.delivered]: 'Order has been delivered!',
    [exports.orderStatusArrayJson.canceled]: 'Order has been canceled!',
    [exports.orderStatusArrayJson.returned]: 'Order has been returned!',
    [exports.orderStatusArrayJson.refunded]: 'Order has been refunded!',
    [exports.orderStatusArrayJson.partiallyShipped]: 'Order has been partially shipped!',
    [exports.orderStatusArrayJson.onHold]: 'Order is on hold!',
    [exports.orderStatusArrayJson.failed]: 'Order has failed!',
    [exports.orderStatusArrayJson.completed]: 'Order has been completed!',
    [exports.orderStatusArrayJson.pickup]: 'Order is ready for pickup!',
    [exports.orderStatusArrayJson.partiallyDelivered]: 'Order has been partially delivered!',
    [exports.orderStatusArrayJson.partiallyCanceled]: 'Order has been partially canceled!',
    [exports.orderStatusArrayJson.partiallyReturned]: 'Order has been partially returned!',
    [exports.orderStatusArrayJson.partiallyRefunded]: 'Order has been partially refunded!',
};
exports.orderProductStatusJson = {
    pending: "1",
    processing: "2",
    packed: "3",
    shipped: "4",
    delivered: "5",
    canceled: "6",
    returned: "7",
    refunded: "8",
    pickup: "13"
};
exports.orderProductStatusArray = [
    { value: exports.orderProductStatusJson.pending, label: "Pending" },
    { value: exports.orderProductStatusJson.processing, label: "Processing" },
    { value: exports.orderProductStatusJson.packed, label: "Packed" },
    { value: exports.orderProductStatusJson.shipped, label: "Shipped" },
    { value: exports.orderProductStatusJson.delivered, label: "Delivered" },
    { value: exports.orderProductStatusJson.canceled, label: "Cancelled" },
    { value: exports.orderProductStatusJson.returned, label: "Returned" },
    { value: exports.orderProductStatusJson.refunded, label: "Refunded" },
    { value: exports.orderProductStatusJson.pickup, label: "Pickup" }
];
exports.orderProductStatussMessages = {
    [exports.orderProductStatusJson.pending]: 'Your product order is pending.',
    [exports.orderProductStatusJson.processing]: 'Your product order is now being processed.',
    [exports.orderProductStatusJson.packed]: 'Your product order has been packed and is ready for shipment.',
    [exports.orderProductStatusJson.shipped]: 'Your product order has been shipped.',
    [exports.orderProductStatusJson.delivered]: 'Your product order has been delivered successfully.',
    [exports.orderProductStatusJson.canceled]: 'Your product order has been canceled.',
    [exports.orderProductStatusJson.returned]: 'Your product has been returned.',
    [exports.orderProductStatusJson.refunded]: 'Your product has been refunded.',
    [exports.orderProductStatusJson.pickup]: 'Your product is ready for pickup.',
};
exports.orderProductCancelStatusJson = {
    pending: "1",
    refunded: "2",
};
exports.orderProductCancelStatusMessages = {
    [exports.orderProductCancelStatusJson.pending]: 'Your product cancel has been received successfully.',
    [exports.orderProductCancelStatusJson.refunded]: 'Your product cancel request is now refunded.',
};
exports.orderProductReturnStatusJson = {
    pending: "1",
    approved: "2",
    refunded: "3",
    received: "4",
    rejected: "5",
};
exports.orderReturnStatusMessages = {
    [exports.orderProductReturnStatusJson.pending]: 'Your product return has been received successfully.',
    [exports.orderProductReturnStatusJson.approved]: 'Your product return request is now approved.',
    [exports.orderProductReturnStatusJson.refunded]: 'Your product return has been successfully refunded.',
    [exports.orderProductReturnStatusJson.rejected]: 'Your product return request has been rejected.',
    [exports.orderProductReturnStatusJson.received]: 'Your product return has been received and is being processed.',
};
exports.orderProductReturnStatusArray = [
    { value: exports.orderProductReturnStatusJson.pending, label: "Pending" },
    { value: exports.orderProductReturnStatusJson.approved, label: "Approved" },
    { value: exports.orderProductReturnStatusJson.refunded, label: "Refunded" },
    { value: exports.orderProductReturnStatusJson.received, label: "Received" },
    { value: exports.orderProductReturnStatusJson.rejected, label: "Rejected" },
];
exports.orderProductReturnQuantityStatusJson = {
    pending: "1",
    approved: "2",
    refunded: "3",
    received: "4",
    rejected: "5",
};
exports.orderProductReturnQuantityStatusArray = [
    { value: exports.orderProductReturnQuantityStatusJson.pending, label: "Pending" },
    { value: exports.orderProductReturnQuantityStatusJson.approved, label: "Approved" },
    { value: exports.orderProductReturnQuantityStatusJson.refunded, label: "Refunded" },
    { value: exports.orderProductReturnStatusJson.received, label: "Received" },
    { value: exports.orderProductReturnQuantityStatusJson.rejected, label: "Rejected" },
];
exports.orderStatusMap = exports.orderStatusArray.reduce((map, obj) => {
    map[obj.value] = obj;
    return map;
}, {});
exports.orderProductStatusMap = exports.orderProductStatusArray.reduce((map, obj) => {
    map[obj.value] = obj;
    return map;
}, {});
exports.couponTypes = {
    entireOrders: "entire-orders",
    forProduct: "for-product",
    forCategory: "for-category",
    forBrand: "for-brand",
    // cashback: "cashback",
};
exports.couponDeviceType = {
    desktop: "desktop",
    mobile: "mobile"
};
exports.paymentMethods = {
    cashOnDelivery: "cash-on-delivery",
    cardOnDelivery: "card-on-delivery",
    tap: "tap",
    tabby: "tabby",
    tamara: "tamara",
    network: "network"
};
exports.couponDiscountType = {
    percentage: 'percentage',
    amount: 'amount',
};
exports.orderPaymentStatus = {
    pending: "1",
    success: "2",
    failure: "3",
    cancelled: "4",
    expired: "5",
};
exports.orderTypes = {
    tap: "tap",
    network: "network",
    tabby: "tabby",
    tamara: "tamara",
    cashOnDelivery: "cash-on-delivery",
    cardOnDelivery: "card-on-delivery",
};
exports.tapPaymentGatwayStatus = {
    initiated: 'INITIATED', // Tap will provide the payment URL(transaction.url) to process the payment. The customer should be redirected to this URL to complete the payment.
    authorized: 'AUTHORIZED', // The amount is successfully authorized.
    captured: 'CAPTURED', //The authorized amount is successfully captured.
    void: 'VOID', // The authorized amount is successfully voided.
    cancelled: 'CANCELLED'
};
exports.tabbyPaymentGatwayStatus = {
    created: 'created',
    rejected: 'rejected',
    expired: 'expired',
    approved: 'approved',
};
exports.tabbyPaymentGatwaySuccessStatus = {
    created: 'CREATED', // means that the payment is created successfully, but not finished yet
    authorized: 'AUTHORIZED', // "authorized" and "closed" mark the succesfully approved and captured payments accordingly
    closed: 'CLOSED', // "authorized" and "closed" mark the succesfully approved and captured payments accordingly
    rejected: 'REJECTED', //is retuned when a customer is rejected during Tabby Checkout 
    expired: 'EXPIRED', // is used when a customer cancels a payment or when Tabby doesn't receive a successfully paid transaction after timeout.
};
exports.networkPaymentGatwayStatus = {
    purchased: 'PURCHASED',
    failed: 'FAILED',
};
exports.tamaraPaymentGatwayStatus = {
    new: 'new',
    declined: 'declined',
    expired: 'expired',
    approved: 'approved',
    authorised: 'authorised',
};
