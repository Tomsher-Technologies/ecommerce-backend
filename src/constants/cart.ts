export const cartStatus = {
    active: "1",
    order: "2",
    delivered: "3"
}

export const orderStatusArray = [
    { value: '1', label: "Pending" },
    { value: '2', label: "Processing" },
    { value: '3', label: "Packed" },
    { value: '4', label: "Shipped" },
    { value: '5', label: "Delivered" },
    { value: '6', label: "Canceled" },
    { value: '7', label: "Returned" },
    { value: '8', label: "Refunded" },
    { value: '9', label: "Partially Shipped" },
    { value: '10', label: "On Hold" },
    { value: '11', label: "Failed" },
    { value: '12', label: "Completed" },
    { value: '13', label: "Pickup" }
];

export const orderStatusMessages: { [key: string]: string } = {
    '1': 'Order received successfully!',
    '2': 'Order is now being processed!',
    '3': 'Order has been packed!',
    '4': 'Order has been shipped!',
    '5': 'Order has been delivered!',
    '6': 'Order has been canceled!',
    '7': 'Order has been returned!',
    '8': 'Order has been refunded!',
    '9': 'Order has been partially shipped!',
    '10': 'Order is on hold!',
    '11': 'Order has failed!',
    '12': 'Order has been completed!',
    '13': 'Order is ready for pickup!'
};

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
