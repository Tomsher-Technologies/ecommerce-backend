"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tapPaymentGatwayDefaultValues = void 0;
const tapPaymentGatwayDefaultValues = (countryData, cartData, customerDetails) => {
    return {
        "amount": cartData.totalAmount,
        "currency": countryData.currencyCode,
        "customer_initiated": "true",
        "threeDSecure": true,
        "save_card": false,
        "statement_descriptor": "sample",
        "metadata": {
            "udf1": "test_data_1",
            "udf2": "test_data_2",
            "udf3": "test_data_3"
        },
        "reference": {
            "transaction": "txn_0001",
            "order": "ord_0001"
        },
        "receipt": {
            "email": true,
            "sms": true
        },
        "customer": {
            "first_name": customerDetails.firstName,
            "email": customerDetails.email,
            "phone": {
                "country_code": countryData.countryCode,
                "number": customerDetails.phone
            }
        },
        "merchant": {
            "id": cartData._id
        },
        "source": {
            "id": "src_card"
        },
        "authorize_debit": false,
        "auto": {
            "type": "VOID",
            "time": 100
        },
        "post": {
            "url": "https://smadmin.staging-ecom.com/api/common/tap-success-response"
        },
        "redirect": {
            "url": "https://smadmin.staging-ecom.com/api/common/tap-success-response"
        }
    };
};
exports.tapPaymentGatwayDefaultValues = tapPaymentGatwayDefaultValues;
