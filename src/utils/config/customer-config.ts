import { collections } from "../../constants/collections";
import { earnTypes } from "../../constants/wallet";

export const whishlistLookup = {
    $lookup: {
        from: `${collections.customer.wishlists}`,
        localField: '_id',
        foreignField: 'userId',
        as: 'whishlist'
    }
};

export const countriesLookup = {
    $lookup: {
        from: `${collections.setup.countries}`,
        localField: 'countryId',
        foreignField: '_id',
        as: 'country'
    }
};

export const statesLookup = {
    $lookup: {
        from: `${collections.setup.states}`,
        localField: 'stateId',
        foreignField: '_id',
        as: 'state'
    }
};

export const orderLookup = {
    $lookup: {
        from: `${collections.cart.cartorders}`,
        let: { userId: '$_id' },
        pipeline: [
            { $match: { $expr: { $and: [{ $eq: ['$customerId', '$$userId'] }, { $ne: ['$cartStatus', '1'] }] } } }
        ],
        as: 'orders'
    }
};

export const reportOrderLookup = [{
    $lookup: {
        from: 'cartorders',
        let: { userId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$customerId', '$$userId'] },
                            { $ne: ['$cartStatus', '1'] }
                        ]
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    orderStatusAt: 1
                }
            }
        ],
        as: 'orders'
    }
},
{
    $addFields: {
        lastOrderDate: {
            $arrayElemAt: ['$orders.orderStatusAt', -1]
        }
    }
},
{
    $project: {
        orders: 0
    }
}]

export const addField = {
    $addFields: {
        whishlistCount: { $size: '$whishlist' },
        orderCount: { $size: '$orders' },
        orderTotalAmount: {
            $sum: {
                $map: {
                    input: '$orders',
                    as: 'order',
                    in: '$$order.totalAmount'
                }
            }
        },

    },

};

export const groupStage = {
    $group: {
        _id: '$_id',
    }
};

export const shippingLookup = {
    $lookup: {
        from: `${collections.customer.customeraddresses}`,
        let: { userId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$customerId', '$$userId'] },
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
        from: `${collections.customer.customeraddresses}`,
        let: { userId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$customerId', '$$userId'] },
                            { $eq: ['$addressMode', 'billing-address'] }
                        ]
                    }
                }
            }
        ],
        as: 'billingAddress'
    }
};

export const addressLookup = {
    $lookup: {
        from: `${collections.customer.customeraddresses}`,
        localField: '_id',
        foreignField: 'customerId',
        as: 'address',
        pipeline: [{
            $project: {
                _id: 1,
                addressType: 1,
                defaultAddress: 1,
                addressMode: 1,
                name: 1,
                address1: 1,
                address2: 1,
                phoneNumber: 1,
                landlineNumber: 1,
                country: 1,
                state: 1,
                city: 1,
                street: 1,
                zipCode: 1,
                longitude: 1,
                latitude: 1,
                isGuest: 1
            }
        }]
    }
};

export const orderWalletTransactionLookup = {
    $lookup: {
        from: `${collections.customer.customerwallettransactions}`,
        let: { userId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$customerId', '$$userId'] },
                            { $eq: ['$earnType', earnTypes.order] }
                        ]
                    }
                }
            }
        ],
        as: 'orderWalletTransactions'
    }
};

export const referrerWalletTransactionLookup = {
    $lookup: {
        from: `${collections.customer.customerwallettransactions}`,
        let: { userId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$customerId', '$$userId'] },
                            { $eq: ['$earnType', earnTypes.referrer] }
                        ]
                    }
                }
            }
        ],
        as: 'referrerWalletTransactions'
    }
};

export const referredWalletTransactionLookup = {
    $lookup: {
        from: `${collections.customer.customerwallettransactions}`,
        let: { userId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$customerId', '$$userId'] },
                            { $eq: ['$earnType', earnTypes.referred] }
                        ]
                    }
                }
            }
        ],
        as: 'referredWalletTransactions'
    }
};

export const customerProject = {

    $project: {
        _id: 1,
        countryId: 1,
        email: 1,
        firstName: 1,
        phone: 1,
        password: 1,
        customerImageUrl: 1,
        referralCode: 1,
        otp: 1,
        otpExpiry: 1,
        isVerified: 1,
        totalWalletAmount: 1,
        totalRewardPoint: 1,
        failureAttemptsCount: 1,
        resetPasswordCount: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
        __v: 1,
        whishlist: '$whishlistCount',
        totalOrderCount: '$orderCount',
        orderTotalAmount: 1,
    }

}


export const customerDetailProject = {

    $project: {
        _id: 1,
        countryId: 1,
        email: 1,
        firstName: 1,
        phone: 1,
        password: 1,
        customerImageUrl: 1,
        referralCode: 1,
        otp: 1,
        otpExpiry: 1,
        isVerified: 1,
        totalWalletAmount: 1,
        totalRewardPoint: 1,
        failureAttemptsCount: 1,
        resetPasswordCount: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
        __v: 1,
        whishlist: '$whishlistCount',
        totalOrderCount: '$orderCount',
        orderTotalAmount: 1,
        shippingAddress: {
            $ifNull: ['$shippingAddress', []]
        },

        billingAddress: {
            $ifNull: ['$billingAddress', []]
        },
        referredWalletTransactions: {
            $ifNull: ['$referredWalletTransactions', []]
        },
        referrerWalletTransactions: {
            $ifNull: ['$referrerWalletTransactions', []]
        },
        orderWalletTransactions: {
            $ifNull: ['$orderWalletTransactions', []]
        },
        country: { $arrayElemAt: ['$country', 0] }
    }


}