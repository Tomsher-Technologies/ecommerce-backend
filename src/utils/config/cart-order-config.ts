import { collections } from "../../constants/collections";

export const cartLookup = {
    $lookup: {
        from: 'cartorderproducts',
        localField: '_id',
        foreignField: 'cartId',
        as: 'products',

    }
};

export const customerLookup = {
    $lookup: {
        from: 'customers',
        localField: 'customerId',
        foreignField: '_id',
        as: 'customer',

    }
};

export const couponLookup = {
    $lookup: {
        from: 'coupons',
        localField: 'couponId',
        foreignField: '_id',
        as: 'couponId',

    }
};


export const objectLookup = {
    $addFields: {
        coupon: { $arrayElemAt: ['$couponId', 0] },
        paymentMethod: { $arrayElemAt: ['$paymentMethodId', 0] },
        billingAddress: { $arrayElemAt: ['$billingAddress', 0] },
        shippingAddress: { $arrayElemAt: ['$shippingAddress', 0] },
        pickupStore: { $arrayElemAt: ['$pickupStoreId', 0] }
    }
}

export const shippingLookup = {
    $lookup: {
        from: 'customeraddresses',
        let: { shippingId: '$shippingId' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$_id', '$$shippingId'] },
                            { $eq: ['$addressMode', 'shipping-address'] }
                        ]
                    }
                }
            }
        ],
        as: 'shippingAddress'
    }
};

export const billingLookup = {
    $lookup: {
        from: 'customeraddresses',
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

export const pickupStoreLookup = {
    $lookup: {
        from: 'stores',
        localField: 'pickupStoreId',
        foreignField: '_id',
        as: 'pickupStoreId',

    }
};

export const paymentMethodLookup = {
    $lookup: {
        from: 'paymentmethods',
        localField: 'paymentMethodId',
        foreignField: '_id',
        as: 'paymentMethodId',

    }
};

export const orderListObjectLookup = {
    $addFields: {
        paymentMethod: { $arrayElemAt: ['$paymentMethodId', 0] },
        customer: { $arrayElemAt: ['$customer', 0] },
    }
};

export const cartProject = {
    $project: {
        _id: 1,
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
        paymentMethod: '$paymentMethod',
        customer: '$customer',
        shippingAddress: '$shippingAddress',
        billingAddress: '$billingAddress'

    }

}

export const cartDeatilProject = {
    $project: {
        _id: 1,
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
        totalProductCount: { $size: '$products' }, // Calculate the size of the products array
        paymentMethod: '$paymentMethod',
        shippingAddress: '$shippingAddress',
        billingAddress: '$billingAddress'
    }

}

export const productBrandLookupValues = {

    $lookup: {
        from: `${collections.ecommerce.brands}`,
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


}