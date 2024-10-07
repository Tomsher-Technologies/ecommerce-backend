"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../components/pagination");
const cart_order_model_1 = __importDefault(require("../../model/frontend/cart-order-model"));
const cart_order_product_model_1 = __importDefault(require("../../model/frontend/cart-order-product-model"));
const wishlist_config_1 = require("../../utils/config/wishlist-config");
const product_config_1 = require("../../utils/config/product-config");
const sub_domain_1 = require("../../utils/frontend/sub-domain");
const language_model_1 = __importDefault(require("../../model/admin/setup/language-model"));
const common_service_1 = __importDefault(require("./guest/common-service"));
const tax_model_1 = __importDefault(require("../../model/admin/setup/tax-model"));
const cart_order_model_2 = __importDefault(require("../../model/frontend/cart-order-model"));
class CartService {
    constructor() {
        this.cartLookup = {
            $lookup: {
                from: 'cartorderproducts', // Collection name of AttributeDetailModel
                localField: '_id', // Field in AttributesModel
                foreignField: 'cartId', // Field in AttributeDetailModel
                as: 'products',
            }
        };
    }
    async findCart(data) {
        const createdCartWithValues = await cart_order_model_1.default.find(data);
        return createdCartWithValues[0];
    }
    async findCartPopulate(options) {
        const { query, skip, limit, sort, hostName } = (0, pagination_1.frontendPagination)(options.query || {}, options);
        const { simple = '0' } = options;
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        const languageData = await language_model_1.default.find().exec();
        const languageId = await (0, sub_domain_1.getLanguageValueFromSubdomain)(hostName, languageData);
        // productVariantAttributesLookup
        const modifiedPipeline = {
            $lookup: {
                ...this.cartLookup.$lookup,
                pipeline: [
                    product_config_1.productLookup,
                    { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
                    (0, wishlist_config_1.productVariantsLookupValues)("1"),
                    // attributePipeline,
                    { $unwind: { path: "$productDetails.variantDetails", preserveNullAndEmptyArrays: true } },
                    ...(simple === '0' ? [
                        wishlist_config_1.wishlistProductCategoryLookup,
                        (0, wishlist_config_1.multilanguageFieldsLookup)(languageId),
                        {
                            $unwind: {
                                path: "$productDetails.languageValues",
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        wishlist_config_1.replaceProductLookupValues,
                        {
                            $unset: "productDetails.languageValues"
                        }
                    ] : [])
                ]
            }
        };
        const pipeline = [
            modifiedPipeline,
            { $match: query },
            { $sort: finalSort },
        ];
        const { pipeline: offerPipeline, getOfferList, offerApplied } = await common_service_1.default.findOffers(0, hostName);
        if (offerApplied.category.categories && offerApplied.category.categories.length > 0) {
            const offerCategory = (0, wishlist_config_1.wishlistOfferCategory)(getOfferList, offerApplied.category);
            modifiedPipeline.$lookup.pipeline.push(offerCategory);
        }
        if (offerApplied.brand.brands && offerApplied.brand.brands.length > 0) {
            const offerBrand = (0, wishlist_config_1.wishlistOfferBrandPopulation)(getOfferList, offerApplied.brand);
            modifiedPipeline.$lookup.pipeline.push(offerBrand);
        }
        if (offerApplied.product.products && offerApplied.product.products.length > 0) {
            const offerProduct = (0, wishlist_config_1.wishlistOfferProductPopulation)(getOfferList, offerApplied.product);
            modifiedPipeline.$lookup.pipeline.push(offerProduct);
        }
        modifiedPipeline.$lookup.pipeline.push({
            $addFields: {
                'productDetails.offer': {
                    $cond: {
                        if: "$productDetails.categoryOffers",
                        then: "$productDetails.categoryOffers",
                        else: {
                            $cond: {
                                if: "$productDetails.brandOffers",
                                then: "$productDetails.brandOffers",
                                else: "$productDetails.productOffers"
                            }
                        }
                    }
                }
            }
        });
        modifiedPipeline.$lookup.pipeline.push({ $unset: "productDetails.categoryOffers" });
        modifiedPipeline.$lookup.pipeline.push({ $unset: "productDetails.brandOffers" });
        modifiedPipeline.$lookup.pipeline.push({ $unset: "productDetails.productOffers" });
        if (skip) {
            pipeline.push({ $skip: skip });
        }
        if (limit) {
            pipeline.push({ $limit: limit });
        }
        const createdCartWithValues = await cart_order_model_1.default.aggregate(pipeline);
        return createdCartWithValues[0];
    }
    async createCart(data) {
        const cartData = await cart_order_model_1.default.create(data);
        return cartData;
    }
    async updateCartPrice(options) {
        const { cartDetails, countryId, cartOrderProductUpdateOperations } = options;
        const totalProductAmount = cartDetails.products.reduce((total, product) => {
            return total + product.productAmount;
        }, 0);
        const totalAmount = totalProductAmount + cartDetails.totalGiftWrapAmount + cartDetails.totalShippingAmount;
        if (cartOrderProductUpdateOperations.length > 0 || totalAmount !== cartDetails.totalAmount) {
            await cart_order_product_model_1.default.bulkWrite(cartOrderProductUpdateOperations);
            const [aggregationResult] = await cart_order_product_model_1.default.aggregate([
                { $match: { cartId: cartDetails._id } },
                {
                    $group: {
                        _id: "$cartId",
                        totalProductAmount: { $sum: "$productAmount" },
                        totalProductOriginalPrice: { $sum: "$productOriginalPrice" },
                        totalDiscountAmount: { $sum: "$productDiscountAmount" },
                    }
                }
            ]);
            const taxDetails = await tax_model_1.default.findOne({ countryId: countryId });
            if (aggregationResult) {
                const { _id, ...restValues } = aggregationResult;
                if (restValues) {
                    const updatedCartOrderValues = await cart_order_model_2.default.findByIdAndUpdate(cartDetails._id, {
                        ...restValues,
                        totalAmount: restValues.totalProductAmount + cartDetails.totalGiftWrapAmount + cartDetails.totalShippingAmount,
                        totalTaxAmount: (taxDetails && Number(taxDetails.taxPercentage) > 0) ? ((Number(restValues.totalProductAmount) * Number(taxDetails.taxPercentage)) / (100 + Number(taxDetails.taxPercentage))).toFixed(2) : 0,
                        // totalTaxAmount: (taxDetails && Number(taxDetails?.taxPercentage) > 0) ? ((Number(taxDetails.taxPercentage) / 100) * Number(restValues.totalProductAmount)).toFixed(2) : 0
                    });
                }
            }
        }
    }
    async findCartProduct(data) {
        const createdAttributeWithValues = await cart_order_product_model_1.default.findOne(data);
        return createdAttributeWithValues;
    }
    async createCartProduct(data) {
        const cartData = await cart_order_product_model_1.default.create(data);
        return cartData;
    }
    async updateCartProduct(_id, cartData) {
        const updatedCart = await cart_order_product_model_1.default.findOneAndUpdate({ _id: _id }, cartData, { new: true, useFindAndModify: false });
        return updatedCart;
    }
    async updateCartProductByCart(_id, cartData) {
        const updatedCart = await cart_order_product_model_1.default.findOneAndUpdate(_id, cartData, { new: true, useFindAndModify: false });
        return updatedCart;
    }
    async findOneCart(query) {
        return cart_order_model_1.default.findOne(query);
    }
    async destroy(cartId) {
        return cart_order_model_1.default.findOneAndDelete({ _id: cartId });
    }
    async destroyCartProduct(id) {
        return cart_order_product_model_1.default.findOneAndDelete({ _id: id });
    }
    async destroyCartProduct1(data) {
        return cart_order_product_model_1.default.findOneAndDelete(data);
    }
}
exports.default = new CartService();
