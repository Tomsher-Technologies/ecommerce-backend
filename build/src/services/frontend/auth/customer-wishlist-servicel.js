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
        let pipeline = [
            product_config_1.productLookup,
            { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
            wishlist_config_1.productVariantsLookupValues,
            { $unwind: { path: "$productDetails.variantDetails", preserveNullAndEmptyArrays: true } },
            (0, wishlist_config_1.multilanguageFieldsLookup)(languageId),
            { $unwind: { path: "$productDetails.languageValues", preserveNullAndEmptyArrays: true } },
            wishlist_config_1.replaceProductLookupValues,
            { $unset: "productDetails.languageValues" },
            { $match: query },
            { $skip: skip },
            { $limit: limit },
            { $sort: finalSort },
        ];
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
