"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tamaraPaymentGatwayDefaultValues = exports.networkPaymentGatwayDefaultValues = exports.tabbyPaymentGatwayDefaultValues = exports.tapPaymentGatwayDefaultValues = void 0;
const tapPaymentGatwayDefaultValues = (countryData, cartData, customerDetails, paymentMethodValues) => {
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
            "id": paymentMethodValues.merchantCode
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
            "url": `${process.env.APP_API_URL}/api/common/tap-success-response`
        },
        "redirect": {
            "url": `${process.env.APP_API_URL}/api/common/tap-success-response`
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
                "shipping_amount": cartData?.totalShippingAmount,
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
        "merchant_code": paymentMethod.paymentMethodValues?.merchantCode?.toUpperCase(),
        "merchant_urls": {
            "success": `${process.env.APP_API_URL}/api/common/tabby-success-response`,
            "cancel": `${process.env.APP_API_URL}/api/common/tabby-success-response`,
            "failure": `${process.env.APP_API_URL}/api/common/tabby-success-response`
        }
    };
};
exports.tabbyPaymentGatwayDefaultValues = tabbyPaymentGatwayDefaultValues;
const networkPaymentGatwayDefaultValues = (countryData, cartData, customerDetails) => {
    return {
        "action": "PURCHASE",
        "amount": {
            "currencyCode": countryData.currencyCode,
            "value": cartData.totalAmount
        },
        "emailAddress": customerDetails.email,
        "billingAddress": {
            "firstName": customerDetails.firstName,
        },
        "merchantAttributes": {
            "redirectUrl": `${process.env.APP_API_URL}/api/common/network-payment-response`
        }
    };
};
exports.networkPaymentGatwayDefaultValues = networkPaymentGatwayDefaultValues;
const tamaraPaymentGatwayDefaultValues = (countryData, cartData, customerDetails) => {
    return {
        "total_amount": {
            "amount": 300,
            "currency": countryData.currencyCode
        },
        "shipping_amount": {
            "amount": 0,
            "currency": countryData.currencyCode
        },
        "tax_amount": {
            "amount": 0,
            "currency": countryData.currencyCode
        },
        "order_reference_id": "1231234123-abda-fdfe--afd31241",
        "order_number": "S12356",
        "discount": {
            "amount": {
                "amount": 200,
                "currency": countryData.currencyCode
            },
            "name": "Christmas 2020"
        },
        "items": [
            {
                "name": "Lego City 8601",
                "type": "Digital",
                "reference_id": "123",
                "sku": "SA-12436",
                "quantity": 1,
                "discount_amount": {
                    "amount": 100,
                    "currency": countryData.currencyCode
                },
                "tax_amount": {
                    "amount": 10,
                    "currency": countryData.currencyCode
                },
                "unit_price": {
                    "amount": 490,
                    "currency": countryData.currencyCode
                },
                "total_amount": {
                    "amount": 100,
                    "currency": countryData.currencyCode
                }
            }
        ],
        "consumer": {
            "email": "customer@email.com",
            "first_name": "Mona",
            "last_name": "Lisa",
            "phone_number": "0568982559"
        },
        "country_code": "AE",
        "description": "lorem ipsum dolor",
        "merchant_url": {
            "cancel": "http://awesome-qa-tools.s3-website.me-south-1.amazonaws.com/#/cancel",
            "failure": "http://awesome-qa-tools.s3-website.me-south-1.amazonaws.com/#/fail",
            "success": "http://awesome-qa-tools.s3-website.me-south-1.amazonaws.com/#/success",
            "notification": "https://store-demo.com/payments/tamarapay"
        },
        "payment_type": "PAY_BY_INSTALMENTS",
        "instalments": 3,
        "billing_address": {
            "city": "Dubai",
            "country_code": "AE",
            "first_name": "Mona",
            "last_name": "Lisa",
            "line1": "3764 Al Urubah Rd",
            "line2": "string",
            "phone_number": "0568982559",
            "region": "As Sulimaniyah"
        },
        "shipping_address": {
            "city": "Riyadh",
            "country_code": "AE",
            "first_name": "Mona",
            "last_name": "Lisa",
            "line1": "3764 Al Urubah Rd",
            "line2": "string",
            "phone_number": "0568982559",
            "region": "As Sulimaniyah"
        },
        "platform": "platform name here",
        "is_mobile": false,
        "locale": "en_US",
        "risk_assessment": {
            "customer_age": 22,
            "customer_dob": "31-01-2000",
            "customer_gender": "Male",
            "customer_nationality": "AE",
            "is_premium_customer": true,
            "is_existing_customer": true,
            "is_guest_user": true,
            "account_creation_date": "31-01-2019",
            "platform_account_creation_date": "string",
            "date_of_first_transaction": "31-01-2019",
            "is_card_on_file": true,
            "is_COD_customer": true,
            "has_delivered_order": true,
            "is_phone_verified": true,
            "is_fraudulent_customer": true,
            "total_ltv": 501.5,
            "total_order_count": 12,
            "order_amount_last3months": 301.5,
            "order_count_last3months": 2,
            "last_order_date": "31-01-2021",
            "last_order_amount": 301.5,
            "reward_program_enrolled": true,
            "reward_program_points": 300,
            "phone_verified": false
        },
        "additional_data": {
            "delivery_method": "home delivery",
            "pickup_store": "Store A",
            "store_code": "Store code A",
            "vendor_amount": 0,
            "merchant_settlement_amount": 0,
            "vendor_reference_code": "AZ1234"
        }
    };
};
exports.tamaraPaymentGatwayDefaultValues = tamaraPaymentGatwayDefaultValues;
