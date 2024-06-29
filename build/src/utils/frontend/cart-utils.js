"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tabbyPaymentGatwayDefaultValues = exports.tapPaymentGatwayDefaultValues = void 0;
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
            "transaction": cartData._id,
            "order": cartData._id
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
const tabbyPaymentGatwayDefaultValues = (countryData, cartData, customerDetails, paymentMethod, shippingAddressdetails) => {
    return {
        "payment": {
            "amount": cartData.totalAmount,
            "currency": countryData.currencyCode,
            "description": cartData?.orderComments,
            "buyer": {
                "phone": customerDetails.phone,
                "email": customerDetails.email,
                "name": customerDetails.firstName,
                "dob": "2000-08-24"
            },
            "buyer_history": {
                "registered_since": "2019-08-24T14:15:22Z",
                "loyalty_level": 10,
                "wishlist_count": 2,
                "is_social_networks_connected": true,
                "is_phone_number_verified": true,
                "is_email_verified": true
            },
            "order": {
                "tax_amount": cartData?.totalTaxAmount,
                "shipping_amount": cartData?.totalDiscountAmount,
                "discount_amount": cartData?.totalDiscountAmount,
                "updated_at": cartData.cartStatusAt,
                "reference_id": cartData._id,
                "items": cartData?.products?.map((product) => ({
                    "title": product.productDetails.productTitle,
                    "description": product.productDetails.description,
                    "quantity": product.quantity,
                    "unit_price": product.productAmount / product.quantity,
                    "discount_amount": "0.00",
                    "reference_id": product.productDetails.variantDetails._id, // variant Id
                    "image_url": product.productDetails.productImageUrl,
                    "product_url": "http://example.com",
                    "gender": "Male",
                    "category": "string",
                    "color": "string",
                    "product_material": "string",
                    "size_type": "string",
                    "size": "string",
                    "brand": "string"
                }))
            },
            "order_history": [
                {
                    "purchased_at": cartData.cartStatusAt,
                    "amount": cartData.totalAmount,
                    "payment_method": "card",
                    "status": "new",
                    "buyer": {
                        "phone": customerDetails.phone,
                        "email": customerDetails.email,
                        "name": customerDetails.firstName,
                        "dob": "2000-08-24"
                    },
                    "shipping_address": {
                        "city": shippingAddressdetails?.city,
                        "address": shippingAddressdetails?.address1,
                        "zip": shippingAddressdetails?.zipCode
                    },
                    "items": cartData?.products?.map((product) => ({
                        "title": product.productDetails.productTitle,
                        "description": product.productDetails.description,
                        "quantity": product.quantity,
                        "unit_price": product.productAmount / product.quantity,
                        "discount_amount": "0.00",
                        "reference_id": product.productDetails.variantDetails._id, // variant Id
                        "image_url": product.productDetails.productImageUrl,
                        "ordered": 0,
                        "captured": 0,
                        "shipped": 0,
                        "refunded": 0,
                        "gender": "Male",
                        "category": "string",
                        "color": "string",
                        "product_material": "string",
                        "size_type": "string",
                        "size": "string",
                        "brand": "string"
                    }))
                }
            ],
            "shipping_address": {
                "city": shippingAddressdetails?.city,
                "address": shippingAddressdetails?.address1,
                "zip": shippingAddressdetails?.zipCode
            },
            "meta": {
                "order_id": cartData._id,
                "customer": customerDetails._id
            },
            "attachment": {
                "body": "{\"flight_reservation_details\": {\"pnr\": \"TR9088999\",\"itinerary\": [...],\"insurance\": [...],\"passengers\": [...],\"affiliate_name\": \"some affiliate\"}}",
                "content_type": "application/vnd.tabby.v1+json"
            }
        },
        "lang": "en",
        "merchant_code": paymentMethod.paymentMethodValues?.merchantCode,
        "merchant_urls": {
            "success": "https://smadmin.staging-ecom.com/api/common/tap-success-response",
            "cancel": "https://smadmin.staging-ecom.com/api/common/tap-success-response",
            "failure": "https://smadmin.staging-ecom.com/api/common/tap-success-response"
        }
    };
};
exports.tabbyPaymentGatwayDefaultValues = tabbyPaymentGatwayDefaultValues;
