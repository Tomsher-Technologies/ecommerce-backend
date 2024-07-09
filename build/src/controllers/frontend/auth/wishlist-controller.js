"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_controller_1 = __importDefault(require("../../admin/base-controller"));
const customer_wishlist_servicel_1 = __importDefault(require("../../../services/frontend/auth/customer-wishlist-servicel"));
const common_service_1 = __importDefault(require("../../../services/frontend/guest/common-service"));
const product_variants_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-variants-model"));
const wishlist_schema_1 = require("../../../utils/schemas/frontend/auth/wishlist-schema");
const helpers_1 = require("../../../utils/helpers");
const controller = new base_controller_1.default();
class WishlistsController extends base_controller_1.default {
    async findAllWishlists(req, res) {
        try {
            const { page_size = 1, limit = 20, sortby = '', sortorder = '' } = req.query;
            let query = { _id: { $exists: true } };
            const userData = await res.locals.user;
            query.status = '1';
            query.userId = userData._id;
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const wishlists = await customer_wishlist_servicel_1.default.findAll({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                hostName: req.get('origin'),
                sort
            });
            controller.sendSuccessResponse(res, {
                requestedData: wishlists,
                totalCount: await customer_wishlist_servicel_1.default.getTotalCount(query),
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching wishlist products' });
        }
    }
    async addToWishlist(req, res) {
        try {
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (!countryId) {
                return controller.sendErrorResponse(res, 500, { message: 'Country is missing' });
            }
            const validatedData = wishlist_schema_1.addToWishlistSchema.safeParse(req.body);
            if (!validatedData.success) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                });
            }
            const { slug, sku } = validatedData.data;
            const productVariantData = await product_variants_model_1.default.findOne({ countryId, variantSku: sku, slug });
            if (!productVariantData) {
                return controller.sendErrorResponse(res, 500, { message: 'Product not found!' });
            }
            const user = res.locals.user;
            const wishlistData = await customer_wishlist_servicel_1.default.findOne({ userId: user._id, countryId, slug });
            if (wishlistData) {
                const deletedData = await customer_wishlist_servicel_1.default.destroy(wishlistData._id);
                if (!deletedData) {
                    return controller.sendErrorResponse(res, 500, { message: 'Something went wrong on wishlist removed!' });
                }
                const query = { status: '1', userId: user._id };
                const requestedData = await customer_wishlist_servicel_1.default.findAll({ query, hostName: req.get('origin') });
                return controller.sendSuccessResponse(res, { requestedData, message: 'Wishlist removed successfully!' });
            }
            else {
                const wishlistInsertData = {
                    countryId,
                    userId: user._id,
                    productId: productVariantData.productId,
                    variantId: productVariantData._id,
                    slug: productVariantData.slug,
                    variantSku: productVariantData.variantSku
                };
                const insertData = await customer_wishlist_servicel_1.default.create(wishlistInsertData);
                if (!insertData) {
                    return controller.sendErrorResponse(res, 500, { message: 'Something went wrong on wishlist add!' });
                }
                const query = { status: '1', userId: user._id };
                const requestedData = await customer_wishlist_servicel_1.default.findAll({ query, hostName: req.get('origin') });
                return controller.sendSuccessResponse(res, { requestedData, message: 'Wishlist added successfully!' });
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while add to wishlist' });
        }
    }
    async moveTCart(req, res) {
        try {
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            const validatedData = wishlist_schema_1.moveTCartSchema.safeParse(req.body);
            if (validatedData.success) {
                const { slug, sku } = validatedData.data;
                const productVariantData = await product_variants_model_1.default.findOne({
                    countryId,
                    variantSku: sku,
                    slug
                });
                if (productVariantData) {
                    const user = res.locals.user;
                    const whishlistData = await customer_wishlist_servicel_1.default.findOne({
                        userId: user._id,
                        countryId,
                    });
                    if (whishlistData) {
                        // do move to cart logic here
                        const deletedData = await customer_wishlist_servicel_1.default.destroy(whishlistData._id);
                        return controller.sendSuccessResponse(res, {
                            requestedData: {},
                            message: 'Move to cart successfully completed!'
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 500, {
                            message: 'Wishlist product not found!'
                        });
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 500, {
                        message: 'Product not found!'
                    });
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                });
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while add to wishlist'
            });
        }
    }
}
exports.default = new WishlistsController();
