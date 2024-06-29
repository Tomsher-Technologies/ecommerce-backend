"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tabbyPaymentGatwaySuccessStatus = exports.tabbyPaymentGatwayStatus = exports.tapPaymentGatwayStatus = exports.orderTypes = exports.orderPaymentStatus = exports.couponDiscountType = exports.paymentMethods = exports.couponDeviceType = exports.couponTypes = exports.orderStatus = exports.cartStatus = void 0;
exports.cartStatus = {
    active: "1",
    order: "2",
    delivered: "3"
};
exports.orderStatus = [
    { value: '1', label: "Pending" },
    { value: '2', label: "Processing" },
    { value: '3', label: "Shipped" },
    { value: '4', label: "Delivered" },
    { value: '5', label: "Canceled" },
    { value: '6', label: "Returned" },
    { value: '7', label: "Refunded" },
    { value: '8', label: "Awaiting Payment" },
    { value: '9', label: "Awaiting Fulfillment" },
    { value: '10', label: "Awaiting Shipment" },
    { value: '11', label: "Partially Shipped" },
    { value: '12', label: "Partially Refunded" },
    { value: '13', label: "On Hold" },
    { value: '14', label: "Failed" },
    { value: '15', label: "Completed" },
    { value: '16', label: "Pickup" },
];
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
    tap: "tap",
    tabby: "tabby"
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
    tabby: "tabby",
    cashOnDelivery: "cash-on-delivery",
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
