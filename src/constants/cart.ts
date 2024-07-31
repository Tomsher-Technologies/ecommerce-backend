export const cartStatus = {
    active: "1",
    order: "2",
    delivered: "3"
}

export const orderStatusArrayJason = {
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

export const orderStatusArray = [
    { value: orderStatusArrayJason.pending, label: "Pending" },
    { value: orderStatusArrayJason.processing, label: "Processing" },
    { value: orderStatusArrayJason.packed, label: "Packed" },
    { value: orderStatusArrayJason.shipped, label: "Shipped" },
    { value: orderStatusArrayJason.delivered, label: "Delivered" },
    { value: orderStatusArrayJason.canceled, label: "Canceled" },
    { value: orderStatusArrayJason.returned, label: "Returned" },
    { value: orderStatusArrayJason.refunded, label: "Refunded" },
    { value: orderStatusArrayJason.partiallyShipped, label: "Partially Shipped" },
    { value: orderStatusArrayJason.onHold, label: "On Hold" },
    { value: orderStatusArrayJason.failed, label: "Failed" },
    { value: orderStatusArrayJason.completed, label: "Completed" },
    { value: orderStatusArrayJason.pickup, label: "Pickup" },
    { value: orderStatusArrayJason.partiallyDelivered, label: "Partially Delivered" },
];

export const orderStatusMessages: { [key: string]: string } = {
    [orderStatusArrayJason.pending]: 'Order received successfully!',
    [orderStatusArrayJason.processing]: 'Order is now being processed!',
    [orderStatusArrayJason.packed]: 'Order has been packed!',
    [orderStatusArrayJason.shipped]: 'Order has been shipped!',
    [orderStatusArrayJason.delivered]: 'Order has been delivered!',
    [orderStatusArrayJason.canceled]: 'Order has been canceled!',
    [orderStatusArrayJason.returned]: 'Order has been returned!',
    [orderStatusArrayJason.refunded]: 'Order has been refunded!',
    [orderStatusArrayJason.partiallyShipped]: 'Order has been partially shipped!',
    [orderStatusArrayJason.onHold]: 'Order is on hold!',
    [orderStatusArrayJason.failed]: 'Order has failed!',
    [orderStatusArrayJason.completed]: 'Order has been completed!',
    [orderStatusArrayJason.pickup]: 'Order is ready for pickup!',
    [orderStatusArrayJason.partiallyDelivered]: 'Order has been delivered!',
};

export const orderProductStatusJson = {
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
export const orderProductStatusArray = [
    { value: orderProductStatusJson.pending, label: "Pending" },
    { value: orderProductStatusJson.processing, label: "Processing" },
    { value: orderProductStatusJson.packed, label: "Packed" },
    { value: orderProductStatusJson.shipped, label: "Shipped" },
    { value: orderProductStatusJson.delivered, label: "Delivered" },
    { value: orderProductStatusJson.canceled, label: "Canceled" },
    { value: orderProductStatusJson.returned, label: "Returned" },
    { value: orderProductStatusJson.refunded, label: "Refunded" },
    { value: orderProductStatusJson.pickup, label: "Pickup" }
];
export const orderStatusMap = orderStatusArray.reduce((map, obj) => {
    map[obj.value] = obj;
    return map;
}, {} as Record<string, { value: string; label: string }>);


export const couponTypes = {
    entireOrders: "entire-orders",
    forProduct: "for-product",
    forCategory: "for-category",
    forBrand: "for-brand",
    // cashback: "cashback",
}

export const couponDeviceType = {
    desktop: "desktop",
    mobile: "mobile"
}

export const paymentMethods = {
    cashOnDelivery: "cash-on-delivery",
    cardOnDelivery: "card-on-delivery",
    tap: "tap",
    tabby: "tabby",
    tamara: "tamara",
    network: "network"
}

export const couponDiscountType = {
    percentage: 'percentage',
    amount: 'amount',
};

export const orderPaymentStatus = {
    pending: "1",
    success: "2",
    failure: "3",
    cancelled: "4",
    expired: "5",
}

export const orderTypes = {
    tap: "tap",
    network: "network",
    tabby: "tabby",
    tamara: "tamara",
    cashOnDelivery: "cash-on-delivery",
    cardOnDelivery: "card-on-delivery",
}

export const tapPaymentGatwayStatus = {
    initiated: 'INITIATED', // Tap will provide the payment URL(transaction.url) to process the payment. The customer should be redirected to this URL to complete the payment.
    authorized: 'AUTHORIZED', // The amount is successfully authorized.
    captured: 'CAPTURED', //The authorized amount is successfully captured.
    void: 'VOID',// The authorized amount is successfully voided.
    cancelled: 'CANCELLED'
}

export const tabbyPaymentGatwayStatus = {
    created: 'created',
    rejected: 'rejected',
    expired: 'expired',
    approved: 'approved',
}

export const tabbyPaymentGatwaySuccessStatus = {
    created: 'CREATED', // means that the payment is created successfully, but not finished yet
    authorized: 'AUTHORIZED', // "authorized" and "closed" mark the succesfully approved and captured payments accordingly
    closed: 'CLOSED', // "authorized" and "closed" mark the succesfully approved and captured payments accordingly
    rejected: 'REJECTED', //is retuned when a customer is rejected during Tabby Checkout 
    expired: 'EXPIRED', // is used when a customer cancels a payment or when Tabby doesn't receive a successfully paid transaction after timeout.
}
export const networkPaymentGatwayStatus = {
    purchased: 'PURCHASED',
    failed: 'FAILED',
}

export const tamaraPaymentGatwayStatus = {
    new: 'new',
    declined: 'declined',
    expired: 'expired',
    approved: 'approved',
    authorised: 'authorised',
}
