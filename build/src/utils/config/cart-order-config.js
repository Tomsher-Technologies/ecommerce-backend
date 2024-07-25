"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartOrderProductsGroupSumAggregate = exports.cartOrderGroupSumAggregate = exports.buildOrderPipeline = exports.productBrandLookupValues = exports.cartDeatilProject = exports.cartProject = exports.orderListObjectLookup = exports.paymentMethodLookup = exports.pickupStoreLookup = exports.billingLookup = exports.shippingAndBillingLookup = exports.objectLookup = exports.couponLookup = exports.customerLookup = exports.cartProductsLookup = void 0;
const collections_1 = require("../../constants/collections");
const product_config_1 = require("./product-config");
const wishlist_config_1 = require("./wishlist-config");
exports.cartProductsLookup = {
    $lookup: {
        from: `${collections_1.collections.cart.cartorderproducts}`,
        localField: '_id',
        foreignField: 'cartId',
        as: 'products',
    }
};
exports.customerLookup = {
    $lookup: {
        from: `${collections_1.collections.customer.customers}`,
        localField: 'customerId',
        foreignField: '_id',
        as: 'customer',
    }
};
exports.couponLookup = {
    $lookup: {
        from: `${collections_1.collections.marketing.coupons}`,
        localField: 'couponId',
        foreignField: '_id',
        as: 'couponDetails',
    }
};
exports.objectLookup = {
    $addFields: {
        coupon: { $arrayElemAt: ['$couponId', 0] },
        paymentMethod: { $arrayElemAt: ['$paymentMethodId', 0] },
        billingAddress: { $arrayElemAt: ['$billingAddress', 0] },
        shippingAddress: { $arrayElemAt: ['$shippingAddress', 0] },
        pickupStore: { $arrayElemAt: ['$pickupStoreId', 0] }
    }
};
const shippingAndBillingLookup = (localField, alias) => [
    {
        $lookup: {
            from: `${collections_1.collections.customer.customeraddresses}`,
            localField: localField,
            foreignField: '_id',
            as: alias
        }
    },
    {
        $unwind: {
            path: `$${alias}`,
            preserveNullAndEmptyArrays: true
        }
    },
];
exports.shippingAndBillingLookup = shippingAndBillingLookup;
exports.billingLookup = {
    $lookup: {
        from: `${collections_1.collections.customer.customeraddresses}`,
        let: { billingId: '$billingId' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$_id', '$$billingId'] },
                            { $eq: ['$addressMode', 'billing-address'] }
                        ]
                    }
                }
            }
        ],
        as: 'billingAddress'
    }
};
exports.pickupStoreLookup = {
    $lookup: {
        from: `${collections_1.collections.stores.stores}`,
        localField: 'pickupStoreId',
        foreignField: '_id',
        as: 'pickupStoreId',
    }
};
exports.paymentMethodLookup = {
    $lookup: {
        from: `${collections_1.collections.cart.paymentmethods}`,
        localField: 'paymentMethodId',
        foreignField: '_id',
        as: 'paymentMethodId',
    }
};
exports.orderListObjectLookup = {
    $addFields: {
        paymentMethod: { $arrayElemAt: ['$paymentMethodId', 0] },
        customer: { $arrayElemAt: ['$customer', 0] },
    }
};
exports.cartProject = {
    $project: {
        _id: 1,
        orderId: 1,
        customerId: 1,
        // countryId: 1,
        couponId: 1,
        guestUserId: 1,
        // shippingId: 1,
        // billingId: 1,
        pickupStoreId: 1,
        // paymentMethodId: 1,
        paymentMethodCharge: 1,
        rewardPoints: 1,
        rewardAmount: 1,
        totalReturnedProduct: 1,
        totalDiscountAmount: 1,
        totalShippingAmount: 1,
        totalCouponAmount: 1,
        totalWalletAmount: 1,
        totalTaxAmount: 1,
        totalProductAmount: 1,
        couponAmount: 1,
        totalGiftWrapAmount: 1,
        totalAmount: 1,
        orderComments: 1,
        cartStatus: 1,
        orderStatus: 1,
        orderStatusAt: 1,
        processingStatusAt: 1,
        packedStatusAt: 1,
        shippedStatusAt: 1,
        deliveredStatusAt: 1,
        canceledStatusAt: 1,
        returnedStatusAt: 1,
        refundedStatusAt: 1,
        partiallyShippedStatusAt: 1,
        onHoldStatusAt: 1,
        failedStatusAt: 1,
        completedStatusAt: 1,
        pickupStatusAt: 1,
        deliverStatusAt: 1,
        cartStatusAt: 1,
        createdAt: 1,
        updatedAt: 1,
        __v: 1,
        totalProductCount: { $size: '$products' }, // Calculate the size of the products array
        paymentMethod: {
            $ifNull: ['$paymentMethod', null]
        },
        customer: {
            $ifNull: ['$customer', null]
        },
        country: {
            $ifNull: ['$country', null]
        },
        shippingAddress: {
            $ifNull: ['$shippingAddress', null]
        },
        billingAddress: {
            $ifNull: ['$billingAddress', null]
        }
    }
};
exports.cartDeatilProject = {
    $project: {
        _id: 1,
        orderId: 1,
        // customerId: 1,
        // countryId: 1,
        couponId: 1,
        guestUserId: 1,
        // shippingId: 1,
        // billingId: 1,
        pickupStoreId: 1,
        paymentMethodCharge: 1,
        rewardPoints: 1,
        rewardAmount: 1,
        totalReturnedProduct: 1,
        totalDiscountAmount: 1,
        totalShippingAmount: 1,
        totalCouponAmount: 1,
        totalWalletAmount: 1,
        totalTaxAmount: 1,
        totalProductAmount: 1,
        couponAmount: 1,
        totalGiftWrapAmount: 1,
        totalAmount: 1,
        orderComments: 1,
        cartStatus: 1,
        orderStatus: 1,
        orderStatusAt: 1,
        processingStatusAt: 1,
        packedStatusAt: 1,
        shippedStatusAt: 1,
        deliveredStatusAt: 1,
        canceledStatusAt: 1,
        returnedStatusAt: 1,
        refundedStatusAt: 1,
        partiallyShippedStatusAt: 1,
        onHoldStatusAt: 1,
        failedStatusAt: 1,
        completedStatusAt: 1,
        pickupStatusAt: 1,
        deliverStatusAt: 1,
        cartStatusAt: 1,
        createdAt: 1,
        updatedAt: 1,
        __v: 1,
        products: 1,
        totalProductCount: { $size: '$products' }, // Calculate the size of the products array
        paymentMethod: {
            $ifNull: ['$paymentMethod', null]
        },
        shippingAddress: {
            $ifNull: ['$shippingAddress', null]
        },
        couponDetails: {
            $ifNull: ['$couponDetails', null]
        },
        customer: {
            $ifNull: ['$customer', null]
        },
        country: {
            $ifNull: ['$country', null]
        },
        billingAddress: {
            $ifNull: ['$billingAddress', null]
        }
    }
};
exports.productBrandLookupValues = {
    $lookup: {
        from: `${collections_1.collections.ecommerce.brands}`,
        localField: '$productDetails.brand',
        foreignField: '_id',
        as: '$productDetails.brand',
        pipeline: [
            {
                $project: {
                    _id: 1,
                    brandTitle: 1,
                    description: 1,
                    brandBannerImageUrl: 1,
                    slug: 1,
                    brandImageUrl: 1,
                    status: 1,
                }
            },
        ],
    },
};
const buildOrderPipeline = (paymentMethodDetails, customerDetails, cartDetails) => {
    let query = { _id: { $exists: true } };
    query._id = cartDetails?._id;
    const modifiedPipeline = {
        $lookup: {
            ...exports.cartProductsLookup.$lookup,
            pipeline: [
                product_config_1.productLookup,
                { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
                (0, wishlist_config_1.productVariantsLookupValues)("1"),
                { $unwind: { path: "$productDetails.variantDetails", preserveNullAndEmptyArrays: true } },
            ]
        }
    };
    const pipeline = [
        modifiedPipeline,
        ...(paymentMethodDetails === null
            ? [
                exports.paymentMethodLookup,
                {
                    $addFields: {
                        paymentMethod: { $ifNull: [{ $arrayElemAt: ['$paymentMethodId', 0] }, null] }
                    }
                }
            ]
            : []),
        ...(customerDetails === null
            ? [
                exports.customerLookup,
                {
                    $addFields: {
                        customer: { $ifNull: [{ $arrayElemAt: ['$customer', 0] }, null] }
                    }
                }
            ]
            : []),
        { $match: query },
        {
            $project: {
                _id: 1,
                orderId: 1,
                customerId: 1,
                countryId: 1,
                couponId: 1,
                guestUserId: 1,
                products: 1,
                orderComments: 1,
                ...(paymentMethodDetails === null ? { paymentMethod: 1 } : {}),
                ...(customerDetails === null ? { customer: 1 } : {}),
            }
        }
    ];
    return pipeline;
};
exports.buildOrderPipeline = buildOrderPipeline;
const cartOrderGroupSumAggregate = (customerCart, guestUserCartId) => {
    return [
        {
            $match: {
                $or: [
                    { _id: guestUserCartId },
                    { _id: customerCart }
                ]
            }
        },
        {
            $group: {
                _id: null,
                totalProductAmount: { $sum: "$totalProductAmount" },
                totalProductOriginalPrice: { $sum: "$totalProductOriginalPrice" },
                totalGiftWrapAmount: { $sum: "$totalGiftWrapAmount" },
                totalDiscountAmount: { $sum: "$totalDiscountAmount" },
                totalAmount: { $sum: { $add: ["$totalDiscountAmount", "$totalGiftWrapAmount", "$totalProductAmount"] } }
            }
        },
        {
            $project: {
                _id: 0,
                totalProductOriginalPrice: 1,
                totalProductAmount: 1,
                totalGiftWrapAmount: 1,
                totalDiscountAmount: 1,
                totalAmount: 1
            }
        }
    ];
};
exports.cartOrderGroupSumAggregate = cartOrderGroupSumAggregate;
const cartOrderProductsGroupSumAggregate = (customerCart, guestUserCartId) => {
    return [
        {
            $match: {
                $or: [
                    { cartId: guestUserCartId },
                    { cartId: customerCart }
                ]
            }
        },
        {
            $group: {
                _id: {
                    cartId: "$cartId",
                    variantId: "$variantId"
                },
                cartId: { $first: "$cartId" },
                slug: { $first: "$slug" },
                quantity: { $sum: "$quantity" },
                productOriginalPrice: { $sum: "$productOriginalPrice" },
                productAmount: { $sum: "$productAmount" },
                productDiscountAmount: { $sum: "$productDiscountAmount" },
                productCouponAmount: { $sum: "$productCouponAmount" },
                giftWrapAmount: { $sum: "$giftWrapAmount" }
            }
        },
        {
            $group: {
                _id: "$_id.variantId",
                cartId: { $first: "$cartId" },
                slug: { $first: "$slug" },
                quantity: { $sum: "$quantity" },
                productOriginalPrice: { $sum: "$productOriginalPrice" },
                productAmount: { $sum: "$productAmount" },
                productDiscountAmount: { $sum: "$productDiscountAmount" },
                productCouponAmount: { $sum: "$productCouponAmount" },
                giftWrapAmount: { $sum: "$giftWrapAmount" }
            }
        },
        {
            $project: {
                _id: 0,
                cartId: 1,
                variantId: "$_id",
                slug: 1,
                quantity: 1,
                productOriginalPrice: 1,
                productAmount: 1,
                productDiscountAmount: 1,
                productCouponAmount: 1,
                giftWrapAmount: 1
            }
        }
    ];
};
exports.cartOrderProductsGroupSumAggregate = cartOrderProductsGroupSumAggregate;
