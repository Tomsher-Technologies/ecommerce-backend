export const cartStatus = {
    active: "1",
    order: "2",
    delivered: "3"
}

export const orderStatusArrayJson = {
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
    { value: orderStatusArrayJson.pending, label: "Pending" },
    { value: orderStatusArrayJson.processing, label: "Processing" },
    { value: orderStatusArrayJson.packed, label: "Packed" },
    { value: orderStatusArrayJson.shipped, label: "Shipped" },
    { value: orderStatusArrayJson.delivered, label: "Delivered" },
    { value: orderStatusArrayJson.canceled, label: "Canceled" },
    { value: orderStatusArrayJson.returned, label: "Returned" },
    { value: orderStatusArrayJson.refunded, label: "Refunded" },
    { value: orderStatusArrayJson.partiallyShipped, label: "Partially Shipped" },
    { value: orderStatusArrayJson.onHold, label: "On Hold" },
    { value: orderStatusArrayJson.failed, label: "Failed" },
    { value: orderStatusArrayJson.completed, label: "Completed" },
    { value: orderStatusArrayJson.pickup, label: "Pickup" },
    { value: orderStatusArrayJson.partiallyDelivered, label: "Partially Delivered" },
];

export const orderStatusMessages: { [key: string]: string } = {
    [orderStatusArrayJson.pending]: 'Order received successfully!',
    [orderStatusArrayJson.processing]: 'Order is now being processed!',
    [orderStatusArrayJson.packed]: 'Order has been packed!',
    [orderStatusArrayJson.shipped]: 'Order has been shipped!',
    [orderStatusArrayJson.delivered]: 'Order has been delivered!',
    [orderStatusArrayJson.canceled]: 'Order has been canceled!',
    [orderStatusArrayJson.returned]: 'Order has been returned!',
    [orderStatusArrayJson.refunded]: 'Order has been refunded!',
    [orderStatusArrayJson.partiallyShipped]: 'Order has been partially shipped!',
    [orderStatusArrayJson.onHold]: 'Order is on hold!',
    [orderStatusArrayJson.failed]: 'Order has failed!',
    [orderStatusArrayJson.completed]: 'Order has been completed!',
    [orderStatusArrayJson.pickup]: 'Order is ready for pickup!',
    [orderStatusArrayJson.partiallyDelivered]: 'Order has been delivered!',
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
    { value: orderProductStatusJson.canceled, label: "Cancelled" },
    { value: orderProductStatusJson.returned, label: "Returned" },
    { value: orderProductStatusJson.refunded, label: "Refunded" },
    { value: orderProductStatusJson.pickup, label: "Pickup" }
];

export const orderProductStatussMessages: { [key: string]: string } = {
    [orderProductStatusJson.pending]: 'Your product order is pending.',
    [orderProductStatusJson.processing]: 'Your product order is now being processed.',
    [orderProductStatusJson.packed]: 'Your product order has been packed and is ready for shipment.',
    [orderProductStatusJson.shipped]: 'Your product order has been shipped.',
    [orderProductStatusJson.delivered]: 'Your product order has been delivered successfully.',
    [orderProductStatusJson.canceled]: 'Your product order has been canceled.',
    [orderProductStatusJson.returned]: 'Your product has been returned.',
    [orderProductStatusJson.refunded]: 'Your product has been refunded.',
    [orderProductStatusJson.pickup]: 'Your product is ready for pickup.',
};

export const orderProductReturnStatusJson = {
    pending: "1",
    approved: "2",
    refunded: "3",
    received: "4",
    rejected: "5",
};

export const orderReturnStatusMessages: { [key: string]: string } = {
    [orderProductReturnStatusJson.pending]: 'Your product return has been received successfully.',
    [orderProductReturnStatusJson.approved]: 'Your product return request is now approved.',
    [orderProductReturnStatusJson.refunded]: 'Your product return has been successfully refunded.',
    [orderProductReturnStatusJson.rejected]: 'Your product return request has been rejected.',
    [orderProductReturnStatusJson.received]: 'Your product return has been received and is being processed.',
};

export const orderProductReturnStatusArray = [
    { value: orderProductReturnStatusJson.pending, label: "Pending" },
    { value: orderProductReturnStatusJson.approved, label: "Approved" },
    { value: orderProductReturnStatusJson.refunded, label: "Refunded" },
    { value: orderProductReturnStatusJson.received, label: "Received" },
    { value: orderProductReturnStatusJson.rejected, label: "Rejected" },
];

export const orderProductReturnQuantityStatusJson = {
    pending: "1",
    approved: "2",
    refunded: "3",
    received: "4",
    rejected: "5",
};

export const orderProductReturnQuantityStatusArray = [
    { value: orderProductReturnQuantityStatusJson.pending, label: "Pending" },
    { value: orderProductReturnQuantityStatusJson.approved, label: "Approved" },
    { value: orderProductReturnQuantityStatusJson.refunded, label: "Refunded" },
    { value: orderProductReturnStatusJson.received, label: "Received" },
    { value: orderProductReturnQuantityStatusJson.rejected, label: "Rejected" },
];

export const orderStatusMap = orderStatusArray.reduce((map, obj) => {
    map[obj.value] = obj;
    return map;
}, {} as Record<string, { value: string; label: string }>);

export const orderProductStatusMap = orderProductStatusArray.reduce((map, obj) => {
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
