"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productBrandLookupValues = exports.cartDeatilProject = exports.cartProject = exports.orderListObjectLookup = exports.paymentMethodLookup = exports.pickupStoreLookup = exports.billingLookup = exports.shippingAndBillingLookup = exports.objectLookup = exports.couponLookup = exports.customerLookup = exports.cartLookup = void 0;
const collections_1 = require("../../constants/collections");
exports.cartLookup = {
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
    // Optionally unwin if you expect a single address
    {
        $unwind: {
            path: '$shippingAddress',
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
        countryId: 1,
        couponId: 1,
        guestUserId: 1,
        // shippingId: 1,
        // billingId: 1,
        pickupStoreId: 1,
        // paymentMethodId: 1,
        orderComments: 1,
        paymentMethodCharge: 1,
        rewardPoints: 1,
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
        customerId: 1,
        countryId: 1,
        couponId: 1,
        guestUserId: 1,
        // shippingId: 1,
        // billingId: 1,
        pickupStoreId: 1,
        orderComments: 1,
        paymentMethodCharge: 1,
        rewardPoints: 1,
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
