"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productBrandLookupValues = exports.cartProject = exports.paymentMethodObject = exports.paymentMethodLookup = exports.pickupStoreObject = exports.pickupStoreLookup = exports.billingObject = exports.billingLookup = exports.shippingObject = exports.shippingLookup = exports.couponObject = exports.couponLookup = exports.cartLookup = void 0;
const collections_1 = require("../../constants/collections");
exports.cartLookup = {
    $lookup: {
        from: 'cartorderproducts',
        localField: '_id',
        foreignField: 'cartId',
        as: 'products',
    }
};
exports.couponLookup = {
    $lookup: {
        from: 'coupons',
        localField: 'couponId',
        foreignField: '_id',
        as: 'couponId',
    }
};
exports.couponObject = {
    $addFields: {
        couponId: { $arrayElemAt: ['$couponId', 0] }
    }
};
exports.shippingLookup = {
    $lookup: {
        from: 'customeraddresses',
        localField: 'shippingId',
        foreignField: '_id',
        as: 'shippingId',
    }
};
exports.shippingObject = {
    $addFields: {
        shippingId: { $arrayElemAt: ['$shippingId', 0] }
    }
};
exports.billingLookup = {
    $lookup: {
        from: 'customeraddresses',
        localField: 'billingId',
        foreignField: '_id',
        as: 'billingId',
    }
};
exports.billingObject = {
    $addFields: {
        billingId: { $arrayElemAt: ['$billingId', 0] }
    }
};
exports.pickupStoreLookup = {
    $lookup: {
        from: 'stores',
        localField: 'pickupStoreId',
        foreignField: '_id',
        as: 'pickupStoreId',
    }
};
exports.pickupStoreObject = {
    $addFields: {
        pickupStoreId: { $arrayElemAt: ['$pickupStoreId', 0] }
    }
};
exports.paymentMethodLookup = {
    $lookup: {
        from: 'paymentmethods',
        localField: 'paymentMethodId',
        foreignField: '_id',
        as: 'paymentMethodId',
    }
};
exports.paymentMethodObject = {
    $addFields: {
        paymentMethodId: { $arrayElemAt: ['$paymentMethodId', 0] }
    }
};
exports.cartProject = {
    $project: {
        _id: 1,
        customerId: 1,
        countryId: 1,
        couponId: 1,
        guestUserId: 1,
        shippingId: 1,
        billingId: 1,
        pickupStoreId: 1,
        paymentMethodId: 1,
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
        products: { $size: '$products' } // Calculate the size of the products array
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
