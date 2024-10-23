"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const pagination_1 = require("../../../components/pagination");
const customers_model_1 = __importDefault(require("../../../model/frontend/customers-model"));
const customer_config_1 = require("../../../utils/config/customer-config");
const customer_wishlist_model_1 = __importDefault(require("../../../model/frontend/customer-wishlist-model"));
const product_config_1 = require("../../../utils/config/product-config");
const products_1 = require("../../../utils/admin/products");
const collections_1 = require("../../../constants/collections");
const common_config_1 = require("../../../utils/config/common-config");
class CustomerService {
    async findAll(options = {}, isExcel) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        const pipeline = [];
        pipeline.push({ $match: query }, {
            $facet: {
                customerData: [
                    { $sort: finalSort },
                    { $skip: skip },
                    { $limit: limit },
                    ...(!options?.includeLookups ? [customer_config_1.whishlistLookup, customer_config_1.orderLookup, customer_config_1.addField, ...customer_config_1.reportOrderLookup, ...(isExcel === '1' ? [customer_config_1.addressLookup] : [])] : []),
                    customer_config_1.customerProject,
                ],
                totalCount: [
                    { $count: 'count' }
                ]
            }
        }, {
            $project: {
                customerData: 1,
                totalCount: { $arrayElemAt: ['$totalCount.count', 0] }
            }
        });
        const createdCartWithValues = await customers_model_1.default.aggregate(pipeline);
        return createdCartWithValues;
    }
    async findAllWishlist(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        const { isCount = 0 } = options;
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        let pipeline = [
            { $sort: finalSort },
        ];
        const facetPipeline = [
            {
                $facet: {
                    totalCount: [{ $match: query }, { $count: 'count' }],
                    products: [
                        { $skip: skip },
                        { $limit: limit },
                        {
                            $lookup: {
                                from: `${collections_1.collections.customer.customers}`,
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
                        ...((!query.$or && (0, products_1.hasProductTitleCondition)(query.$or) || query['productDetails.brand'] === '' || query['productDetails.brand'] === undefined) ?
                            [
                                (0, common_config_1.addLookupProject)(product_config_1.productLookup, {
                                    _id: 1,
                                    productTitle: 1,
                                    slug: 1,
                                    sku: 1,
                                    brand: 1
                                }),
                                { $unwind: "$productDetails" },
                                {
                                    $lookup: {
                                        from: `${collections_1.collections.ecommerce.products.productvariants.productvariants}`,
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
        if (query.$or && (0, products_1.hasProductTitleCondition)(query.$or) || query['productDetails.brand']) {
            pipeline.push(...[product_config_1.productLookup, { $unwind: "$productDetails" }]);
        }
        pipeline.push(...facetPipeline);
        const retVal = await customer_wishlist_model_1.default.aggregate(pipeline);
        const products = retVal[0].products;
        if (isCount == 1) {
            const totalCount = retVal[0]?.totalCount?.[0]?.count || 0;
            return { products, totalCount };
        }
        else {
            return products;
        }
    }
    async getTotalCount(query = {}) {
        try {
            const totalCount = await customers_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of customers');
        }
    }
    async findOne(customerId) {
        const pipeline = [
            customer_config_1.countriesLookup,
            customer_config_1.whishlistLookup,
            customer_config_1.orderLookup,
            customer_config_1.addField,
            customer_config_1.billingLookup,
            customer_config_1.shippingLookup,
            customer_config_1.orderWalletTransactionLookup,
            customer_config_1.referredWalletTransactionLookup,
            customer_config_1.referrerWalletTransactionLookup,
            customer_config_1.customerDetailProject,
            { $match: { _id: mongoose_1.default.Types.ObjectId.createFromHexString(customerId) } },
        ];
        const result = await customers_model_1.default.aggregate(pipeline).exec();
        return result?.length > 0 ? result[0] : [];
    }
    async create(customerData) {
        return customers_model_1.default.create(customerData);
    }
}
exports.default = new CustomerService();
