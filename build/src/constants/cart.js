"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tamaraPaymentGatwayStatus = exports.networkPaymentGatwayStatus = exports.tabbyPaymentGatwaySuccessStatus = exports.tabbyPaymentGatwayStatus = exports.tapPaymentGatwayStatus = exports.orderTypes = exports.orderPaymentStatus = exports.couponDiscountType = exports.paymentMethods = exports.couponDeviceType = exports.couponTypes = exports.orderStatusMap = exports.orderProductStatusArray = exports.orderProductStatusJson = exports.orderStatusMessages = exports.orderStatusArray = exports.orderStatusArrayJason = exports.cartStatus = void 0;
exports.cartStatus = {
    active: "1",
    order: "2",
    delivered: "3"
};
exports.orderStatusArrayJason = {
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
};
exports.orderStatusArray = [
    { value: exports.orderStatusArrayJason.pending, label: "Pending" },
    { value: exports.orderStatusArrayJason.processing, label: "Processing" },
    { value: exports.orderStatusArrayJason.packed, label: "Packed" },
    { value: exports.orderStatusArrayJason.shipped, label: "Shipped" },
    { value: exports.orderStatusArrayJason.delivered, label: "Delivered" },
    { value: exports.orderStatusArrayJason.canceled, label: "Canceled" },
    { value: exports.orderStatusArrayJason.returned, label: "Returned" },
    { value: exports.orderStatusArrayJason.refunded, label: "Refunded" },
    { value: exports.orderStatusArrayJason.partiallyShipped, label: "Partially Shipped" },
    { value: exports.orderStatusArrayJason.onHold, label: "On Hold" },
    { value: exports.orderStatusArrayJason.failed, label: "Failed" },
    { value: exports.orderStatusArrayJason.completed, label: "Completed" },
    { value: exports.orderStatusArrayJason.pickup, label: "Pickup" },
    { value: exports.orderStatusArrayJason.partiallyDelivered, label: "Partially Delivered" },
];
exports.orderStatusMessages = {
    [exports.orderStatusArrayJason.pending]: 'Order received successfully!',
    [exports.orderStatusArrayJason.processing]: 'Order is now being processed!',
    [exports.orderStatusArrayJason.packed]: 'Order has been packed!',
    [exports.orderStatusArrayJason.shipped]: 'Order has been shipped!',
    [exports.orderStatusArrayJason.delivered]: 'Order has been delivered!',
    [exports.orderStatusArrayJason.canceled]: 'Order has been canceled!',
    [exports.orderStatusArrayJason.returned]: 'Order has been returned!',
    [exports.orderStatusArrayJason.refunded]: 'Order has been refunded!',
    [exports.orderStatusArrayJason.partiallyShipped]: 'Order has been partially shipped!',
    [exports.orderStatusArrayJason.onHold]: 'Order is on hold!',
    [exports.orderStatusArrayJason.failed]: 'Order has failed!',
    [exports.orderStatusArrayJason.completed]: 'Order has been completed!',
    [exports.orderStatusArrayJason.pickup]: 'Order is ready for pickup!',
    [exports.orderStatusArrayJason.partiallyDelivered]: 'Order has been delivered!',
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
    { value: exports.orderProductStatusJson.canceled, label: "Canceled" },
    { value: exports.orderProductStatusJson.returned, label: "Returned" },
    { value: exports.orderProductStatusJson.refunded, label: "Refunded" },
    { value: exports.orderProductStatusJson.pickup, label: "Pickup" }
];
exports.orderStatusMap = exports.orderStatusArray.reduce((map, obj) => {
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
