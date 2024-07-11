"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const language_model_1 = __importDefault(require("../../../model/admin/setup/language-model"));
const customer_wishlist_model_1 = __importDefault(require("../../../model/frontend/customer-wishlist-model"));
const product_config_1 = require("../../../utils/config/product-config");
const wishlist_config_1 = require("../../../utils/config/wishlist-config");
const sub_domain_1 = require("../../../utils/frontend/sub-domain");
const common_service_1 = __importDefault(require("../guest/common-service"));
class CustomerWishlistCountryService {
    async findAll(options = {}) {
        const { query, skip, limit, sort, hostName } = (0, pagination_1.frontendPagination)(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        const languageData = await language_model_1.default.find().exec();
        const languageId = await (0, sub_domain_1.getLanguageValueFromSubdomain)(hostName, languageData);
        const { pipeline: offerPipeline, getOfferList, offerApplied } = await common_service_1.default.findOffers(0, hostName);
        let pipeline = [
            product_config_1.productLookup,
            { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
            (0, wishlist_config_1.productVariantsLookupValues)(),
            { $unwind: { path: "$productDetails.variantDetails", preserveNullAndEmptyArrays: true } },
            wishlist_config_1.wishlistProductCategoryLookup,
            (0, wishlist_config_1.multilanguageFieldsLookup)(languageId),
            { $unwind: { path: "$productDetails.languageValues", preserveNullAndEmptyArrays: true } },
            wishlist_config_1.replaceProductLookupValues,
            { $unset: "productDetails.languageValues" },
            { $match: query },
            { $sort: finalSort },
        ];
        if (offerApplied.category.categories && offerApplied.category.categories.length > 0) {
            const offerCategory = (0, wishlist_config_1.wishlistOfferCategory)(getOfferList, offerApplied.category);
            pipeline.push(offerCategory);
        }
        if (offerApplied.brand.brands && offerApplied.brand.brands.length > 0) {
            const offerBrand = (0, wishlist_config_1.wishlistOfferBrandPopulation)(getOfferList, offerApplied.brand);
            pipeline.push(offerBrand);
        }
        if (offerApplied.product.products && offerApplied.product.products.length > 0) {
            const offerProduct = (0, wishlist_config_1.wishlistOfferProductPopulation)(getOfferList, offerApplied.product);
            pipeline.push(offerProduct);
        }
        pipeline.push({
            $addFields: {
                'productDetails.offer': {
                    $cond: {
                        if: "$productDetails.categoryOffers",
                        then: "$productDetails.categoryOffers",
                        else: {
                            $cond: {
                                if: "$brandOffers",
                                then: "$productDetails.brandOffers",
                                else: "$productDetails.productOffers"
                            }
                        }
                    }
                }
            }
        });
        pipeline.push({ $unset: "productDetails.categoryOffers" });
        pipeline.push({ $unset: "productDetails.brandOffers" });
        pipeline.push({ $unset: "productDetails.productOffers" });
        if (skip) {
            pipeline.push({ $skip: skip });
        }
        if (limit) {
            pipeline.push({ $limit: limit });
        }
        return customer_wishlist_model_1.default.aggregate(pipeline).exec();
    }
    async getTotalCount(query = {}) {
        try {
            const totalCount = await customer_wishlist_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of wishlists products');
        }
    }
    async create(wishlistData) {
        return customer_wishlist_model_1.default.create(wishlistData);
    }
    async findOneById(wishlistId) {
        return customer_wishlist_model_1.default.findById(wishlistId);
    }
    async findOne(query) {
        return customer_wishlist_model_1.default.findOne(query);
    }
    async update(wishlistId, wishlistData) {
        return customer_wishlist_model_1.default.findByIdAndUpdate(wishlistId, wishlistData, { new: true, useFindAndModify: false });
    }
    async destroy(wishlistId) {
        return customer_wishlist_model_1.default.findOneAndDelete({ _id: wishlistId });
    }
}
exports.default = new CustomerWishlistCountryService();
