import { collections } from "../../constants/collections";
import { productLookup } from "./product-config";
import { productVariantsLookupValues } from "./wishlist-config";

export const cartProductsLookup = {
    $lookup: {
        from: `${collections.cart.cartorderproducts}`,
        localField: '_id',
        foreignField: 'cartId',
        as: 'products',

    }
};

export const customerLookup = {
    $lookup: {
        from: `${collections.customer.customers}`,
        localField: 'customerId',
        foreignField: '_id',
        as: 'customer',

    }
};

export const couponLookup = {
    $lookup: {
        from: `${collections.marketing.coupons}`,
        localField: 'couponId',
        foreignField: '_id',
        as: 'couponDetails',

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

export const shippingAndBillingLookup = (localField: string, alias: string) => [
    {
        $lookup: {
            from: `${collections.customer.customeraddresses}`,
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


export const billingLookup = {
    $lookup: {
        from: `${collections.customer.customeraddresses}`,
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
        from: `${collections.stores.stores}`,
        localField: 'pickupStoreId',
        foreignField: '_id',
        as: 'pickupStoreId',

    }
};

export const paymentMethodLookup = {
    $lookup: {
        from: `${collections.cart.paymentmethods}`,
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

}

export const cartDeatilProject = {
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

export const buildOrderPipeline = (paymentMethodDetails: any, customerDetails: any, cartDetails: any) => {
    let query: any = { _id: { $exists: true } };
    query._id = cartDetails?._id;

    const modifiedPipeline = {
        $lookup: {
            ...cartProductsLookup.$lookup,
            pipeline: [
                productLookup,
                { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
                productVariantsLookupValues("1"),
                { $unwind: { path: "$productDetails.variantDetails", preserveNullAndEmptyArrays: true } },
            ]
        }
    };

    const pipeline: any[] = [
        modifiedPipeline,
        ...(paymentMethodDetails === null
            ? [
                paymentMethodLookup,
                {
                    $addFields: {
                        paymentMethod: { $ifNull: [{ $arrayElemAt: ['$paymentMethodId', 0] }, null] }
                    }
                }
            ]
            : []
        ),
        ...(customerDetails === null
            ? [
                customerLookup,
                {
                    $addFields: {
                        customer: { $ifNull: [{ $arrayElemAt: ['$customer', 0] }, null] }
                    }
                }
            ]
            : []
        ),
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


export const cartOrderGroupSumAggregate = (customerCart: string, guestUserCartId: string) => {

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
    ]
}

export const cartOrderProductsGroupSumAggregate = (customerCart: string, guestUserCartId: string) => {
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
}
