import { collections } from "../../constants/collections";


export const reviewProductLookup = [
    {
        $lookup: {
            from: `${collections.ecommerce.products.products}`,
            localField: 'productId',
            foreignField: '_id',
            as: 'productDetails',
            pipeline: [
                {
                    $project: {
                        _id: 1,
                        starRating: 1,
                        productTitle: 1,
                        slug: 1
                    }
                }
            ]
        }
    },
    { $unwind: { path: '$productDetails', preserveNullAndEmptyArrays: true } },
]
export const reviewCsutomerLookup = [
    {
        $lookup: {
            from: `${collections.customer.customers}`,
            localField: 'customerId',
            foreignField: '_id',
            as: 'customer',
            pipeline: [
                {
                    $project: {
                        _id: 1,
                        customerCode: 1,
                        email: 1,
                        firstName: 1,
                        phone: 1,
                        guestPhone: 1,
                        guestEmail: 1,
                        referralCode: 1,
                    }
                }
            ]
        }
    },
    { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
]
export const reviewProductVariantLookup = [
    {
        $lookup: {
            from: `${collections.ecommerce.products.productvariants.productvariants}`,
            localField: 'variantId',
            foreignField: '_id',
            as: 'variantDetails',
            pipeline: [
                {
                    $project: {
                        _id: 1,
                        variantSku: 1,
                        slug: 1,
                        extraProductTitle: 1,
                    }
                }
            ]
        }
    },
    { $unwind: { path: '$variantDetails', preserveNullAndEmptyArrays: true } },
]