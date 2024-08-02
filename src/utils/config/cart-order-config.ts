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
        totalProductOriginalPrice: 1,
        totalReturnedProductAmount: 1,
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
        returnReson: 1,
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
        partiallyDeliveredStatusAt: 1,
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
        totalProductOriginalPrice: 1,
        totalReturnedProductAmount: 1,
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
        returnReson: 1,
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
        partiallyDeliveredStatusAt: 1,
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
        totalProductCount: { $size: '$products' },
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


export const cartOrderGroupSumAggregate = (customerCart: any, guestUserCart: any) => {
    const totalProductAmount = (customerCart?.totalProductAmount || 0) + (guestUserCart?.totalProductAmount || 0);
    const totalProductOriginalPrice = (customerCart?.totalProductOriginalPrice || 0) + (guestUserCart?.totalProductOriginalPrice || 0);
    const totalGiftWrapAmount = (customerCart?.totalGiftWrapAmount || 0) + (guestUserCart?.totalGiftWrapAmount || 0);
    const totalDiscountAmount = (customerCart?.totalDiscountAmount || 0) + (guestUserCart?.totalDiscountAmount || 0);
    const totalAmount = totalProductAmount + totalGiftWrapAmount;

    return {
        totalProductOriginalPrice,
        totalProductAmount,
        totalGiftWrapAmount,
        totalDiscountAmount,
        totalAmount
    };
    // return [
    //     {
    //         $match: {
    //             $or: [
    //                 { _id: guestUserCartId },
    //                 { _id: customerCart }
    //             ]
    //         }
    //     },
    //     {
    //         $group: {
    //             _id: null,
    //             totalProductAmount: { $sum: "$totalProductAmount" },
    //             totalProductOriginalPrice: { $sum: "$totalProductOriginalPrice" },
    //             totalGiftWrapAmount: { $sum: "$totalGiftWrapAmount" },
    //             totalDiscountAmount: { $sum: "$totalDiscountAmount" },
    //             totalAmount: { $sum: { $add: ["$totalGiftWrapAmount", "$totalProductAmount"] } }
    //         }
    //     },
    //     {
    //         $project: {
    //             _id: 0,
    //             totalProductOriginalPrice: 1,
    //             totalProductAmount: 1,
    //             totalGiftWrapAmount: 1,
    //             totalDiscountAmount: 1,
    //             totalAmount: 1
    //         }
    //     }
    // ]
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

// export const getOrderReturnProductsWithCart = (query: any, notCallLookups: boolean) => {
//     const pipeline: any[] = [
//         { $match: query },
//         {
//             $lookup: {
//                 from: `${collections.cart.cartorders}`,
//                 localField: 'cartId',
//                 foreignField: '_id',
//                 as: 'cartDetails'
//             }
//         },
//         { $unwind: '$cartDetails' },
//         {
//             $lookup: {
//                 from: `${collections.ecommerce.products.products}`,
//                 localField: 'productId',
//                 foreignField: '_id',
//                 as: 'productsDetails'
//             }
//         },
//         { $unwind: '$productsDetails' },
//           {
//                 $lookup: {
//                     from: `${collections.ecommerce.products.productvariants.productvariants}`,
//                     localField: 'variantId',
//                     foreignField: '_id',
//                     as: 'productvariants'
//                 }
//             },
//             {
//                 $addFields: {
//                     'productsDetails.productvariants': {
//                         $arrayElemAt: ['$productvariants', 0]
//                     }
//                 }
//             }
//     ];

//     if (notCallLookups) {
//         pipeline.push(
//             {
//                 $lookup: {
//                     from: `${collections.customer.customers}`,
//                     localField: 'cartDetails.customerId',
//                     foreignField: '_id',
//                     as: 'customerDetails'
//                 }
//             },
//             { $unwind: '$customerDetails' },
//             {
//                 $lookup: {
//                     from: `${collections.cart.paymentmethods}`,
//                     localField: 'cartDetails.paymentMethodId',
//                     foreignField: '_id',
//                     as: 'paymentMethod'
//                 }
//             },
//             { $unwind: '$paymentMethod' },
//             {
//                 $lookup: {
//                     from: `${collections.setup.countries}`,
//                     localField: 'cartDetails.countryId',
//                     foreignField: '_id',
//                     as: 'country'
//                 }
//             },
//             {
//                 $unwind: {
//                     path: "$country",
//                     preserveNullAndEmptyArrays: true
//                 }
//             }
//         );
//     }

//     pipeline.push({
//         $project: {
//             _id: 1,
//             cartId: 1,
//             quantity: 1,
//             productOriginalPrice: 1,
//             productAmount: 1,
//             productDiscountAmount: 1,
//             orderProductStatus: 1,
//             'cartDetails._id': 1,
//             'cartDetails.customerId': 1,
//             'cartDetails.countryId': 1,
//             'cartDetails.isGuest': 1,
//             'cartDetails.cartStatus': 1,
//             'cartDetails.totalProductOriginalPrice': 1,
//             'cartDetails.totalReturnedProductAmount': 1,
//             'cartDetails.totalDiscountAmount': 1,
//             'cartDetails.totalShippingAmount': 1,
//             'cartDetails.totalCouponAmount': 1,
//             'cartDetails.totalWalletAmount': 1,
//             'cartDetails.totalTaxAmount': 1,
//             'cartDetails.totalProductAmount': 1,
//             'cartDetails.couponAmount': 1,
//             'cartDetails.totalGiftWrapAmount': 1,
//             'cartDetails.totalAmount': 1,
//             'cartDetails.orderStatusAt': 1,
//             'cartDetails.deliveredStatusAt': 1,
//             'customerDetails._id': 1,
//             'customerDetails.firstName': 1,
//             'customerDetails.email': 1,
//             'customerDetails.isGuest': 1,
//             'paymentMethod._id': 1,
//             'paymentMethod.paymentMethodTitle': 1,
//             'paymentMethod.slug': 1,
//             'productsDetails': 1,
//             'country': 1
//         }
//     });

//     return pipeline;
// };

export const getOrderReturnProductsWithCart = (query: any, notCallLookups: boolean) => {
    const pipeline: any[] = [
        {
            $lookup: {
                from: `${collections.cart.cartorders}`,
                localField: 'cartId',
                foreignField: '_id',
                as: 'cartDetails'
            }
        },
        { $unwind: '$cartDetails' },
        {
            $lookup: {
                from: `${collections.ecommerce.products.products}`,
                localField: 'productId',
                foreignField: '_id',
                as: 'productsDetails'
            }
        },
        { $unwind: '$productsDetails' },
        { $match: query },

    ];

    if (notCallLookups) {
        pipeline.push(
            {
                $lookup: {
                    from: `${collections.ecommerce.products.productvariants.productvariants}`,
                    localField: 'variantId',
                    foreignField: '_id',
                    as: 'productvariants'
                }
            },
            {
                $addFields: {
                    'productsDetails.productvariants': {
                        $arrayElemAt: ['$productvariants', 0]
                    }
                }
            },
            {
                $lookup: {
                    from: `${collections.customer.customers}`,
                    localField: 'cartDetails.customerId',
                    foreignField: '_id',
                    as: 'customerDetails'
                }
            },
            { $unwind: '$customerDetails' },
            {
                $lookup: {
                    from: `${collections.cart.paymentmethods}`,
                    localField: 'cartDetails.paymentMethodId',
                    foreignField: '_id',
                    as: 'paymentMethod'
                }
            },
            { $unwind: '$paymentMethod' },
            {
                $lookup: {
                    from: `${collections.setup.countries}`,
                    localField: 'cartDetails.countryId',
                    foreignField: '_id',
                    as: 'country'
                }
            },
            {
                $unwind: {
                    path: "$country",
                    preserveNullAndEmptyArrays: true
                }
            }
        );
    }

    pipeline.push({
        $project: {
            _id: 1,
            cartId: 1,
            quantity: 1,
            productOriginalPrice: 1,
            productAmount: 1,
            productDiscountAmount: 1,
            returnedProductAmount: 1,
            orderProductStatus: 1,
            orderProductReturnStatus: 1,
            orderProductReturnStatusAt: 1,
            orderRequestedProductQuantity: 1,
            orderRequestedProductQuantityStatus: 1,
            orderRequestedProductQuantityStatusAt: 1,
            'cartDetails._id': 1,
            'cartDetails.orderId': 1,
            'cartDetails.customerId': 1,
            'cartDetails.countryId': 1,
            'cartDetails.paymentMethodId': 1,
            'cartDetails.isGuest': 1,
            'cartDetails.cartStatus': 1,
            'cartDetails.orderStatus': 1,
            'cartDetails.totalProductOriginalPrice': 1,
            'cartDetails.totalReturnedProductAmount': 1,
            'cartDetails.totalDiscountAmount': 1,
            'cartDetails.totalShippingAmount': 1,
            'cartDetails.totalCouponAmount': 1,
            'cartDetails.totalWalletAmount': 1,
            'cartDetails.totalTaxAmount': 1,
            'cartDetails.totalProductAmount': 1,
            'cartDetails.couponAmount': 1,
            'cartDetails.totalGiftWrapAmount': 1,
            'cartDetails.totalAmount': 1,
            'cartDetails.orderStatusAt': 1,
            'cartDetails.deliveredStatusAt': 1,
            'customerDetails._id': 1,
            'customerDetails.firstName': 1,
            'customerDetails.email': 1,
            'customerDetails.isGuest': 1,
            'paymentMethod._id': 1,
            'paymentMethod.paymentMethodTitle': 1,
            'paymentMethod.slug': 1,
            'productsDetails': 1,
            'country': 1
        }
    });

    return pipeline;
};
