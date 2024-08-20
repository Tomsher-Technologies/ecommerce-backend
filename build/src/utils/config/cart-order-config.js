"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderProductsWithCartLookup = exports.cartOrderProductsGroupSumAggregate = exports.cartOrderGroupSumAggregate = exports.buildOrderPipeline = exports.productBrandLookupValues = exports.cartDeatilProject = exports.cartProject = exports.orderListObjectLookup = exports.paymentMethodLookup = exports.pickupStoreLookupPipeline = exports.billingLookup = exports.shippingAndBillingLookup = exports.objectLookup = exports.couponLookup = exports.customerLookup = exports.cartProductsLookup = void 0;
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
exports.pickupStoreLookupPipeline = [
    {
        $lookup: {
            from: `${collections_1.collections.stores.stores}`,
            localField: 'pickupStoreId',
            foreignField: '_id',
            as: 'pickupFromStore',
        }
    },
    {
        $unwind: {
            path: "$pickupFromStore",
            preserveNullAndEmptyArrays: true
        }
    },
    {
        $lookup: {
            from: `${collections_1.collections.setup.cities}`,
            let: { cityId: "$pickupFromStore.cityId" },
            pipeline: [
                { $match: { $expr: { $eq: ["$_id", "$$cityId"] } } }
            ],
            as: 'pickupFromStore.city',
        }
    },
    {
        $unwind: {
            path: "$pickupFromStore.city",
            preserveNullAndEmptyArrays: true
        }
    },
    {
        $lookup: {
            from: `${collections_1.collections.setup.states}`,
            let: { stateId: "$pickupFromStore.stateId" },
            pipeline: [
                { $match: { $expr: { $eq: ["$_id", "$$stateId"] } } }
            ],
            as: 'pickupFromStore.state',
        }
    },
    {
        $unwind: {
            path: "$pickupFromStore.state",
            preserveNullAndEmptyArrays: true
        }
    }
];
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
        stateId: 1,
        cityId: 1,
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
        returnReason: 1,
        cancelReason: 1,
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
        partiallyCanceledStatusAt: 1,
        partiallyReturnedStatusAt: 1,
        partiallyRefundedStatusAt: 1,
        onHoldStatusAt: 1,
        failedStatusAt: 1,
        completedStatusAt: 1,
        pickupStatusAt: 1,
        deliveryStatusAt: 1,
        cartStatusAt: 1,
        createdAt: 1,
        updatedAt: 1,
        __v: 1,
        totalProductCount: { $size: '$products' },
        totalQuantity: {
            $sum: '$products.quantity'
        },
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
        },
        // pickupFromStore: {
        //     $ifNull: ['$pickupFromStore', null]
        // }
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
        stateId: 1,
        cityId: 1,
        // shippingId: 1,
        // billingId: 1,
        // pickupStoreId: 1,
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
        returnReason: 1,
        cancelReason: 1,
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
        deliveryStatusAt: 1,
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
        },
        pickupFromStore: {
            $ifNull: ['$pickupFromStore', null]
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
const cartOrderGroupSumAggregate = (customerCart, guestUserCart) => {
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
                productId: { $first: "$productId" },
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
                productId: { $first: "$productId" },
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
                productId: 1,
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
// export const getOrderProductsWithCartLookup = (query: any, notCallLookups: boolean) => {
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
const getOrderProductsWithCartLookup = (query, notCallLookups, getCategory, getBrand) => {
    const pipeline = [
        {
            $lookup: {
                from: `${collections_1.collections.cart.cartorders}`,
                localField: 'cartId',
                foreignField: '_id',
                as: 'cartDetails'
            }
        },
        { $unwind: '$cartDetails' },
        {
            $lookup: {
                from: `${collections_1.collections.ecommerce.products.products}`,
                localField: 'productId',
                foreignField: '_id',
                as: 'productsDetails'
            }
        },
        { $unwind: '$productsDetails' },
        { $match: query },
    ];
    if (notCallLookups) {
        pipeline.push({
            $lookup: {
                from: `${collections_1.collections.ecommerce.products.productvariants.productvariants}`,
                localField: 'variantId',
                foreignField: '_id',
                as: 'productvariants'
            }
        }, {
            $addFields: {
                'productsDetails.productvariants': {
                    $arrayElemAt: ['$productvariants', 0]
                }
            }
        }, {
            $lookup: {
                from: `${collections_1.collections.customer.customers}`,
                localField: 'cartDetails.customerId',
                foreignField: '_id',
                as: 'customerDetails'
            }
        }, { $unwind: '$customerDetails' }, {
            $lookup: {
                from: `${collections_1.collections.cart.paymentmethods}`,
                localField: 'cartDetails.paymentMethodId',
                foreignField: '_id',
                as: 'paymentMethod'
            }
        }, { $unwind: '$paymentMethod' }, {
            $lookup: {
                from: `${collections_1.collections.customer.customeraddresses}`,
                localField: 'cartDetails.shippingId',
                foreignField: '_id',
                as: 'shippingAddress'
            }
        }, { $unwind: '$shippingAddress' }, {
            $lookup: {
                from: `${collections_1.collections.customer.customeraddresses}`,
                localField: 'cartDetails.billingId',
                foreignField: '_id',
                as: 'billingAddress'
            }
        }, { $unwind: '$billingAddress' }, {
            $lookup: {
                from: `${collections_1.collections.setup.countries}`,
                localField: 'cartDetails.countryId',
                foreignField: '_id',
                as: 'country'
            }
        }, {
            $unwind: {
                path: "$country",
                preserveNullAndEmptyArrays: true
            }
        });
        if (getCategory === '1') {
            pipeline.push({
                $lookup: {
                    from: `${collections_1.collections.ecommerce.products.productcategorylinks}`,
                    localField: 'productId',
                    foreignField: 'productId',
                    as: 'productCategory',
                    pipeline: [
                        {
                            $lookup: {
                                from: `${collections_1.collections.ecommerce.categories}`,
                                localField: 'categoryId',
                                foreignField: '_id',
                                as: 'category',
                            },
                        },
                        {
                            $unwind: "$category"
                        },
                        {
                            $project: {
                                category: {
                                    categoryTitle: 1,
                                }
                            }
                        }
                    ]
                }
            }, {
                $addFields: {
                    'productsDetails.productCategory': {
                        $arrayElemAt: ['$productCategory', 0]
                    }
                }
            });
        }
        if (getBrand === '1') {
            pipeline.push({
                $lookup: {
                    from: `${collections_1.collections.ecommerce.brands}`,
                    localField: 'productsDetails.brand',
                    foreignField: '_id',
                    as: 'brandDetails',
                }
            }, {
                $addFields: {
                    'productsDetails.brand': {
                        $arrayElemAt: ['$brandDetails', 0]
                    }
                }
            });
        }
    }
    pipeline.push({
        $project: {
            _id: 1,
            cartId: 1,
            quantity: 1,
            productId: 1,
            variantId: 1,
            productOriginalPrice: 1,
            productAmount: 1,
            productDiscountAmount: 1,
            returnedProductAmount: 1,
            orderProductStatus: 1,
            orderProductStatusAt: 1,
            orderProductReturnStatus: 1,
            orderProductReturnStatusAt: 1,
            orderRequestedProductCancelStatus: 1,
            orderRequestedProductCancelStatusAt: 1,
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
            'cartDetails.orderComments': 1,
            'cartDetails.totalProductOriginalPrice': 1,
            'cartDetails.totalReturnedProductAmount': 1,
            'cartDetails.totalDiscountAmount': 1,
            'cartDetails.totalShippingAmount': 1,
            'cartDetails.totalCouponAmount': 1,
            'cartDetails.totalWalletAmount': 1,
            'cartDetails.totalTaxAmount': 1,
            'cartDetails.shippingId': 1,
            'cartDetails.billingId': 1,
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
            'productsDetails': {
                _id: 1,
                productTitle: 1,
                brand: {
                    brandTitle: 1
                },
                productCategory: { $ifNull: ['$productCategory', []] },
                productImageUrl: 1,
                productvariants: {
                    _id: 1,
                    productId: 1,
                    extraProductTitle: 1,
                    quantity: 1,
                    variantSku: 1,
                    price: 1,
                    discountPrice: 1,
                    status: 1,
                    isDefault: 1,
                }
            },
            'country': {
                _id: 1,
                countryTitle: 1,
                countryCode: 1,
                countryShortTitle: 1,
                currencyCode: 1,
                slug: 1
            },
            shippingAddress: 1,
            billingAddress: 1
        }
    });
    return pipeline;
};
exports.getOrderProductsWithCartLookup = getOrderProductsWithCartLookup;
