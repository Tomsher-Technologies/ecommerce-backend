import { ObjectId } from "mongoose"
import { CustomrProps } from "../../model/frontend/customers-model"
import { PaymentMethodProps } from "../../model/admin/setup/payment-methods-model"
import { CustomerAddressProps } from "../../model/frontend/customer-address-model"
import { formatAmount } from "../helpers"

export const tapPaymentGatwayDefaultValues = (countryData: any, cartData: { orderId: number; totalAmount: number, _id: ObjectId }, customerDetails: CustomrProps, paymentMethodValues: { merchantCode: string; }) => {

    return {
        "amount": cartData.totalAmount,
        "currency": countryData.currencyCode,
        "customer_initiated": true,
        "threeDSecure": true,
        "save_card": false,
        "description": "",
        "metadata": {
            "udf1": "Metadata 1"
        },
        "reference": {
            "transaction": cartData._id,
            "order": cartData?.orderId || 0
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
            "id": "src_card" //src_all
        },
        "post": {
            "url": `${process.env.APP_API_URL}/api/common/tap-success-response`
        },
        "redirect": {
            "url": `${process.env.APP_API_URL}/api/common/tap-success-response`
        }
    }
}

export const tabbyPaymentGatwayDefaultValues = (countryData: any,
    cartData: {
        orderId: number,
        totalAmount: number,
        totalTaxAmount: number,
        totalDiscountAmount: number,
        totalShippingAmount: number,
        _id: ObjectId,
        orderComments: string;
        cartStatusAt: Date | null;
        products: any,
        totalCustomerBuyedCount: number;
    },
    customerDetails: CustomrProps,
    paymentMethod: PaymentMethodProps,
    shippingAddressdetails: CustomerAddressProps) => {

    return {
        "payment": {
            "amount": cartData.totalAmount,
            "currency": countryData.currencyCode,
            "description": cartData?.orderComments,
            "buyer": {
                "phone": customerDetails.phone,
                "email": customerDetails.email,
                "name": customerDetails.firstName,
            },
            "buyer_history": {
                "registered_since": "2019-08-24T14:15:22Z",
                "loyalty_level": cartData?.totalCustomerBuyedCount || 0,
                "wishlist_count": 0,
                "is_social_networks_connected": true,
                "is_phone_number_verified": true,
                "is_email_verified": true
            },
            "order": {
                "tax_amount": cartData?.totalTaxAmount,
                "shipping_amount": cartData?.totalShippingAmount,
                "discount_amount": cartData?.totalDiscountAmount,
                "updated_at": cartData.cartStatusAt,
                "reference_id": `${cartData.orderId}`,
                "items": cartData?.products?.map((product: any) => (
                    {
                        "title": product.productDetails?.variantDetails?.extraProductTitle !== '' ? product.productDetails.variantDetails.extraProductTitle : product.productDetails.productTitle,
                        "description": product.productDetails?.variantDetails?.variantDescription !== '' ? product.productDetails.variantDetails.variantDescription : product.productDetails.description,
                        "quantity": product.quantity,
                        "unit_price": product.productAmount / product.quantity,
                        "discount_amount": "0.00",
                        "reference_id": product.productDetails.variantDetails._id, // variant Id
                        "image_url": product.productDetails.productImageUrl,
                        "category": "string",
                        // "color": "string",
                        // "product_material": "string",
                        // "size_type": "string",
                        // "size": "string",
                        // "brand": "string"
                    }
                ))

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
                    "items": cartData?.products?.map((product: any) => (
                        {
                            "title": product.productDetails?.variantDetails?.extraProductTitle !== '' ? product.productDetails.variantDetails.extraProductTitle : product.productDetails.productTitle,
                            "description": product.productDetails?.variantDetails?.variantDescription !== '' ? product.productDetails.variantDetails.variantDescription : product.productDetails.description,
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
                        }
                    ))
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
    }
}

export const tabbyPaymentCaptureGatwayDefaultValues = (orderDetails: any) => {

    return {
        "amount": orderDetails.amount,
        "reference_id": orderDetails.reference_id,
        tax_amount: formatAmount(orderDetails?.tax_amount),
        shipping_amount: formatAmount(orderDetails?.shipping_amount),
        discount_amount: formatAmount(orderDetails?.discount_amount),
        items: orderDetails.items.map((item: any) => ({
            reference_id: item.reference_id,
            title: item.title,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            image_url: item.image_url,
            product_url: item.product_url || "",
            gender: item.gender || "",
            category: item.category || "",
            color: item.color || "",
            product_material: item.product_material || "",
            size_type: item.size_type || "",
            size: item.size || "",
            brand: item.brand || "",
            is_refundable: item.is_refundable ?? true
        }))
    }
}

export const networkPaymentGatwayDefaultValues = (countryData: any, cartData: { orderId: number; totalAmount: number, _id: ObjectId }, customerDetails: CustomrProps) => {
    return {
        "action": "PURCHASE",
        "amount": {
            "currencyCode": countryData.currencyCode,
            "value": Math.round(cartData.totalAmount * 100)
        },
        "emailAddress": customerDetails.email,
        "billingAddress": {
            "firstName": customerDetails.firstName
        },
        "merchantOrderReference": `${cartData.orderId}` || 0,
        "merchantAttributes": {
            "redirectUrl": `${process.env.APP_API_URL}/api/common/network-payment-response`,
            "skipConfirmationPage": true
        }
    }
}


export const tamaraPaymentGatwayDefaultValues = (
    countryData: any,
    cartData: {
        orderId: number,
        totalAmount: number,
        totalTaxAmount: number,
        totalDiscountAmount: number,
        totalShippingAmount: number,
        _id: ObjectId,
        orderComments: string;
        cartStatusAt: Date | null;
        products: any,
    },
    customerDetails: CustomrProps,
    shippingAddressdetails: CustomerAddressProps,
    billingAddressdetails: CustomerAddressProps,
) => {
    return {
        "total_amount": {
            "amount": cartData.totalAmount,
            "currency": countryData.currencyCode
        },
        "shipping_amount": {
            "amount": cartData.totalShippingAmount,
            "currency": countryData.currencyCode
        },
        "tax_amount": {
            "amount": cartData.totalTaxAmount,
            "currency": countryData.currencyCode
        },
        "order_reference_id": cartData._id,
        "order_number": `${cartData.orderId}` || 0,
        "discount": {
            "amount": {
                "amount": cartData.totalDiscountAmount,
                "currency": countryData.currencyCode
            },
            "name": "Christmas 2020"
        },
        "items": cartData?.products?.map((product: any) => (
            {
                "name": product.productDetails?.variantDetails?.extraProductTitle !== '' ? product.productDetails.variantDetails.extraProductTitle : product.productDetails.productTitle,
                "type": "Digital",
                "reference_id": product._id, // order product id
                "sku": product.productDetails?.variantDetails?.variantSku,
                "quantity": product.quantity,
                "discount_amount": {
                    "amount": product.productDetails?.variantDetails?.price - (product.productAmount / product.quantity),
                    "currency": countryData.currencyCode
                },
                "tax_amount": {
                    "amount": 0,
                    "currency": countryData.currencyCode
                },
                "unit_price": {
                    "amount": product.productDetails?.variantDetails?.price,
                    "currency": countryData.currencyCode
                },
                "total_amount": {
                    "amount": product.productAmount,
                    "currency": countryData.currencyCode
                }
            }
        )),
        "consumer": {
            "email": customerDetails.email,
            "first_name": customerDetails.firstName,
            "last_name": customerDetails.firstName,
            "phone_number": customerDetails.phone
        },
        "country_code": "AE",
        "description": "lorem ipsum dolor",
        "merchant_url": {
            "success": `${process.env.APP_API_URL}/api/common/tamara-payment-response`,
            "cancel": `${process.env.APP_API_URL}/api/common/tamara-payment-response`,
            "failure": `${process.env.APP_API_URL}/api/common/tamara-payment-response`,
            "notification": "https://store-demo.com/payments/tamarapay"
        },
        "payment_type": "PAY_BY_INSTALMENTS",
        "instalments": 3,
        "billing_address": {
            "city": billingAddressdetails?.city,
            "country_code": "AE",
            "first_name": billingAddressdetails?.name,
            "last_name": billingAddressdetails?.name,
            "line1": billingAddressdetails?.address1,
            "line2": billingAddressdetails?.address2,
            "phone_number": billingAddressdetails?.phoneNumber,
            "region": billingAddressdetails?.street
        },
        "shipping_address": {
            "city": shippingAddressdetails?.city,
            "country_code": "AE",
            "first_name": shippingAddressdetails?.name,
            "last_name": shippingAddressdetails?.name,
            "line1": shippingAddressdetails?.address1,
            "line2": shippingAddressdetails?.address2,
            "phone_number": shippingAddressdetails?.phoneNumber,
            "region": shippingAddressdetails?.street
        },
        "platform": "Time House",
        "is_mobile": false,
        "locale": "en_US"
    }
}


export const cartPriceUpdateValueSet = async (options: {
    cartDetails: any;
    variant: any;
    cartOrderProductUpdateOperations: any[];
    errorArray?: any[];
    productTitle?: string;

}) => {
    const { cartDetails, variant, cartOrderProductUpdateOperations, errorArray, productTitle } = options;
    const cartProduct = cartDetails.products.find((product: any) => product.variantId.toString() === variant._id.toString());
    if (variant._id.toString() === cartProduct?.variantId.toString()) {
        let currentProductPrice = variant.discountPrice > 0 ? variant.discountPrice : variant.price;
        if (cartProduct.productDetails.offer) {
            if (cartProduct.productDetails.offer.offerType === 'amount-off') {
                currentProductPrice = currentProductPrice - cartProduct.productDetails.offer.offerIN;
            } else {
                currentProductPrice = currentProductPrice - (currentProductPrice * (cartProduct.productDetails.offer.offerIN / 100));
            }
        }

        const previousProductPrice = cartProduct.productAmount / cartProduct.quantity;
        if (previousProductPrice !== currentProductPrice) {
            const productOriginalPrice = variant.price * cartProduct.quantity;
            const productAmount = currentProductPrice * cartProduct.quantity;
            cartOrderProductUpdateOperations.push({
                updateOne: {
                    filter: { cartId: cartDetails._id, variantId: variant._id },
                    update: {
                        $set: {
                            productOriginalPrice,
                            productAmount,
                            productDiscountAmount: (productOriginalPrice - productAmount)
                        }
                    }
                }
            });

            if (Array.isArray(errorArray) && productTitle) {
                errorArray.push({
                    isRefresh: true,
                    productTitle: productTitle,
                    message: `The price of ${productTitle} in your cart has changed.Please review your cart to see the update pricing.`
                });
            }
        }
    }
}

