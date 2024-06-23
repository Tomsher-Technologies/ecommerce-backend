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
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        const languageData = await language_model_1.default.find().exec();
        const languageId = await (0, sub_domain_1.getLanguageValueFromSubdomain)(hostName, languageData);
        const { pipeline: offerPipeline, getOfferList, offerApplied } = await common_service_1.default.findOffers(0, hostName);
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
                    wishlist_config_1.wishlistProductCategoryLookup,
                    (0, wishlist_config_1.multilanguageFieldsLookup)(languageId),
                    { $unwind: { path: "$productDetails.languageValues", preserveNullAndEmptyArrays: true } },
                    wishlist_config_1.replaceProductLookupValues,
                    { $unset: "productDetails.languageValues" },
                ]
            }
        };
        const pipeline = [
            modifiedPipeline,
            { $match: query },
            { $sort: finalSort },
        ];
        if (offerApplied.product.products && offerApplied.product.products.length > 0) {
            const offerProduct = (0, wishlist_config_1.wishlistOfferProductPopulation)(getOfferList, offerApplied.product);
            modifiedPipeline.$lookup.pipeline.push(offerProduct);
        }
        else if (offerApplied.brand.brands && offerApplied.brand.brands.length > 0) {
            const offerBrand = (0, wishlist_config_1.wishlistOfferBrandPopulation)(getOfferList, offerApplied.brand);
            modifiedPipeline.$lookup.pipeline.push(offerBrand);
        }
        else if (offerApplied.category.categories && offerApplied.category.categories.length > 0) {
            const offerCategory = (0, wishlist_config_1.wishlistOfferCategory)(getOfferList, offerApplied.category);
            modifiedPipeline.$lookup.pipeline.push(offerCategory);
        }
        if (skip) {
            pipeline.push({ $skip: skip });
        }
        if (limit) {
            pipeline.push({ $limit: limit });
        }
        const createdCartWithValues = await cart_order_model_1.default.aggregate(pipeline);
        // console.log("createdCartWithValues", createdCartWithValues);
        return createdCartWithValues[0];
        // return CartOrderModel.findOne(data);
    }
    async create(data) {
        const cartData = await cart_order_model_1.default.create(data);
        if (cartData) {
            const pipeline = [
                { $match: { _id: cartData._id } },
            ];
            const createdCartWithValues = await cart_order_model_1.default.aggregate(pipeline);
            return createdCartWithValues[0];
        }
        else {
            return null;
        }
    }
    async update(cartId, cartData) {
        const updatedCart = await cart_order_model_1.default.findByIdAndUpdate(cartId, cartData, { new: true, useFindAndModify: false });
        if (updatedCart) {
            const pipeline = [
                { $match: { _id: updatedCart._id } },
                this.cartLookup
            ];
            const updatedCartWithValues = await cart_order_model_1.default.aggregate(pipeline);
            return updatedCartWithValues[0];
        }
        else {
            return null;
        }
    }
    async findCartProduct(data) {
        const createdAttributeWithValues = await cart_order_product_model_1.default.findOne(data);
        return createdAttributeWithValues;
    }
    async findAllCart(data) {
        return cart_order_product_model_1.default.find(data);
    }
    async createCartProduct(data) {
        const cartData = await cart_order_product_model_1.default.create(data);
        if (cartData) {
            const pipeline = [
                { $match: { _id: cartData._id } },
            ];
            const createdAttributeWithValues = await cart_order_product_model_1.default.aggregate(pipeline);
            return createdAttributeWithValues[0];
        }
        else {
            return null;
        }
    }
    async updateCartProduct(_id, cartData) {
        const updatedCart = await cart_order_product_model_1.default.findOneAndUpdate({ _id: _id }, cartData, { new: true, useFindAndModify: false });
        if (updatedCart) {
            const pipeline = [
                { $match: { _id: updatedCart._id } },
            ];
            const updatedCartWithValues = await cart_order_product_model_1.default.aggregate(pipeline);
            return updatedCartWithValues[0];
        }
        else {
            return null;
        }
    }
    async updateCartProductByCart(_id, cartData) {
        const updatedCart = await cart_order_product_model_1.default.findOneAndUpdate(_id, cartData, { new: true, useFindAndModify: false });
        if (updatedCart) {
            const pipeline = [
                { $match: { _id: updatedCart._id } },
            ];
            const updatedCartWithValues = await cart_order_product_model_1.default.aggregate(pipeline);
            return updatedCartWithValues[0];
        }
        else {
            return null;
        }
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
