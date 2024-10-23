import mongoose from 'mongoose';
import { FilterOptionsProps, pagination } from '../../../components/pagination';
import CustomerModel, { CustomrProps } from '../../../model/frontend/customers-model';
import { whishlistLookup, customerProject, addField, orderLookup, billingLookup, shippingLookup, customerDetailProject, orderWalletTransactionLookup, referredWalletTransactionLookup, referrerWalletTransactionLookup, countriesLookup, reportOrderLookup, addressLookup } from '../../../utils/config/customer-config';
import { customerLookup } from '../../../utils/config/cart-order-config';
import CustomerWishlistModel from '../../../model/frontend/customer-wishlist-model';
import { productLookup } from '../../../utils/config/product-config';
import { hasProductTitleCondition } from '../../../utils/admin/products';
import { collections } from '../../../constants/collections';
import { addLookupProject } from '../../../utils/config/common-config';


class CustomerService {
    async findAll(options: any = {}, isExcel?: any): Promise<CustomrProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        const pipeline: any[] = [];


        pipeline.push(
            { $match: query },
            {
                $facet: {
                    customerData: [
                        { $sort: finalSort },
                        { $skip: skip },
                        { $limit: limit },
                        ...(!options?.includeLookups ? [whishlistLookup, orderLookup, addField, ...reportOrderLookup, ...(isExcel === '1' ? [addressLookup] : [])] : []),
                        customerProject,
                    ],
                    totalCount: [
                        { $count: 'count' }
                    ]
                }
            },
            {
                $project: {
                    customerData: 1,
                    totalCount: { $arrayElemAt: ['$totalCount.count', 0] }
                }
            }
        );

        const createdCartWithValues = await CustomerModel.aggregate(pipeline);
        return createdCartWithValues;
    }

    async findAllWishlist(options: any = {}): Promise<{ products: any; totalCount: number }> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);
        const { isCount = 0 } = options

        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        let pipeline: any[] = [
            { $sort: finalSort },
        ]

        const facetPipeline = [
            {
                $facet: {
                    totalCount: [{ $match: query }, { $count: 'count' }],
                    products: [
                        { $skip: skip },
                        { $limit: limit },
                        {
                            $lookup: {
                                from: `${collections.customer.customers}`,
                                localField: 'userId',
                                foreignField: '_id',
                                as: 'customer',
                                pipeline: [
                                    {
                                        $project: {
                                            _id: 1,
                                            countryId: 1,
                                            referralCode: 1,
                                            isGuest: 1,
                                            customerImageUrl: 1,
                                            email: 1,
                                            firstName: 1,
                                            guestEmail: 1,
                                            guestPhone: 1,
                                            isVerified: 1,
                                            lastLoggedAt: 1,
                                            phone: 1,
                                            totalRewardPoint: 1,
                                            totalWalletAmount: 1,
                                        }
                                    }
                                ]
                            }
                        },
                        { $unwind: '$customer' },
                        ...((!query.$or && hasProductTitleCondition(query.$or) || query['productDetails.brand'] === '' || query['productDetails.brand'] === undefined) ?
                            [
                                addLookupProject(productLookup, {
                                    _id: 1,
                                    productTitle: 1,
                                    slug: 1,
                                    sku: 1,
                                    brand: 1
                                }),
                                { $unwind: "$productDetails" },
                                {
                                    $lookup: {
                                        from: `${collections.ecommerce.products.productvariants.productvariants}`,
                                        localField: 'variantId',
                                        foreignField: '_id',
                                        as: 'productVariants',
                                        pipeline: [
                                            {
                                                $project: {
                                                    _id: 1,
                                                    countryId: 1,
                                                    variantSku: 1,
                                                    slug: 1,
                                                    extraProductTitle: 1,
                                                    quantity: 1,
                                                    price: 1,
                                                    discountPrice: 1,
                                                    offerPrice: 1,
                                                }
                                            }
                                        ]
                                    },
                                },
                                { $unwind: "$productVariants" },
                            ] : []),
                    ]
                }
            },
            {
                $project: {
                    totalCount: 1,
                    products: 1
                }
            }
        ];

        if (query.$or && hasProductTitleCondition(query.$or) || query['productDetails.brand']) {
            pipeline.push(...[productLookup, { $unwind: "$productDetails" }])
        }

        pipeline.push(...facetPipeline);

        const retVal = await CustomerWishlistModel.aggregate(pipeline);

        const products = retVal[0].products;
        if (isCount == 1) {
            const totalCount = retVal[0]?.totalCount?.[0]?.count || 0;
            return { products, totalCount }
        } else {
            return products
        }

    }
    async getTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await CustomerModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of customers');
        }
    }



    async findOne(customerId: string): Promise<any | null> {
        const pipeline = [
            countriesLookup,
            whishlistLookup,
            orderLookup,
            addField,
            billingLookup,
            shippingLookup,
            orderWalletTransactionLookup,
            referredWalletTransactionLookup,
            referrerWalletTransactionLookup,
            customerDetailProject,
            { $match: { _id: mongoose.Types.ObjectId.createFromHexString(customerId) } },

        ];

        const result: any = await CustomerModel.aggregate(pipeline).exec();
        return result?.length > 0 ? result[0] : []
    }
    async create(customerData: any): Promise<CustomrProps> {
        return CustomerModel.create(customerData);
    }

}

export default new CustomerService();
