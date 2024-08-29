
export interface OrderQueryParams {
    _id?: string;
    page_size?: string;
    limit?: string;
    status?: string;
    sortby?: string;
    sortorder?: string;
    keyword?: string;
    countryId?: string;
    stateId?: string;
    cityId?: string;
    customerId?: string;
    pickupStoreId?: string;
    paymentMethodId?: string;
    couponId?: string;
    cartStatus?: string;
    orderProductReturnStatusFromDate?: string;
    orderProductReturnStatusEndDate?: string;
    orderProductReturnStatus?: string;
    isExcel?: string;
    fromDate?: string;
    endDate?: string;
    orderStatus?: string;
    paymentTransactionId?: string;
    paymentFromDate?: string;
    paymentEndDate?: string;
    isInvoicePDF?: string;
    deliveryType?: string;
}