export const cartStatus = [
    { value: '1', label: "Active" },
    { value: '2', label: "Order" },
    { value: '3', label: "Delivered" },


]

export const OrderStatus = [
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
    tap: "tap",
    tabby: "tabby"
}

export const couponDiscountType = {
    percentage: 'percentage',
    amount: 'amount',
};