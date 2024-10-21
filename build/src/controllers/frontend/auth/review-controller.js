"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_controller_1 = __importDefault(require("../../admin/base-controller"));
const review_service_1 = __importDefault(require("../../../services/frontend/auth/review-service"));
const review_schema_1 = require("../../../utils/schemas/frontend/auth/review-schema");
const helpers_1 = require("../../../utils/helpers");
const mongoose_1 = __importDefault(require("mongoose"));
const cart_1 = require("../../../constants/cart");
const cart_order_config_1 = require("../../../utils/config/cart-order-config");
const cart_order_model_1 = __importDefault(require("../../../model/frontend/cart-order-model"));
const review_1 = require("../../../constants/review");
const common_service_1 = __importDefault(require("../../../services/frontend/guest/common-service"));
const controller = new base_controller_1.default();
class ReviewController extends base_controller_1.default {
    async updateReview(req, res) {
        try {
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (!countryId) {
                return controller.sendErrorResponse(res, 500, {
                    message: 'Country is missing'
                });
            }
            const validatedData = review_schema_1.reviewSchema.safeParse(req.body);
            if (validatedData.success) {
                const { customerName, productId, reviewTitle, reviewContent, rating } = validatedData.data;
                const user = res.locals.user;
                const reviewImageUrl1 = req.files.find((file) => file.fieldname === 'reviewImageUrl1');
                const reviewImageUrl2 = req.files.find((file) => file.fieldname === 'reviewImageUrl2');
                let query = {
                    $and: [
                        { customerId: user._id },
                        { 'products.productId': new mongoose_1.default.Types.ObjectId(productId) },
                    ]
                };
                const order = await cart_order_model_1.default.aggregate((0, cart_order_config_1.getOrderProductsDetailsLookup)(query, "1"));
                const filteredProducts = [];
                for (const singleOrder of order) {
                    const products = singleOrder.products.filter((product) => product.productId.equals(new mongoose_1.default.Types.ObjectId(productId)) &&
                        (product.orderProductStatus === cart_1.orderProductStatusJson.delivered ||
                            product.orderProductStatus === cart_1.orderProductStatusJson.returned ||
                            product.orderProductStatus === cart_1.orderProductStatusJson.refunded ||
                            product.orderProductStatus === cart_1.orderProductStatusJson.completed));
                    if (products.length > 0) {
                        filteredProducts.push(...products);
                    }
                }
                const targetProduct = filteredProducts.length > 0 ? filteredProducts[0] : null;
                if (targetProduct) {
                    const reviewData = {
                        countryId,
                        customerName,
                        customerId: user._id,
                        productId,
                        variantId: targetProduct.variantId,
                        reviewTitle,
                        reviewContent,
                        rating: Number(rating),
                        reviewStatus: '1',
                        reviewImageUrl1: (0, helpers_1.handleFileUpload)(req, null, (req.file || reviewImageUrl1), 'reviewImageUrl1', 'review'),
                        reviewImageUrl2: (0, helpers_1.handleFileUpload)(req, null, (req.file || reviewImageUrl2), 'reviewImageUrl2', 'review'),
                        updatedAt: new Date()
                    };
                    const existingReview = await review_service_1.default.findOne({
                        customerId: user._id,
                        productId
                    });
                    let responseMessage;
                    let reviewResult;
                    if (existingReview) {
                        reviewResult = await review_service_1.default.updateOne({ _id: existingReview._id }, { $set: reviewData });
                        responseMessage = 'Review updated successfully!';
                    }
                    else {
                        reviewResult = await review_service_1.default.create({
                            ...reviewData,
                            createdAt: new Date()
                        });
                        responseMessage = 'Review added successfully!';
                    }
                    return controller.sendSuccessResponse(res, {
                        requestedData: reviewResult,
                        message: responseMessage
                    }, 200);
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'You are not permitted to add a review'
                    }, req);
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                }, req);
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while adding or updating the review',
            }, req);
        }
    }
    async getReviews(req, res) {
        try {
            const productId = req.params.id;
            const user = res.locals.user ? res.locals.user : res.locals.uuid;
            const reviews = await review_service_1.default.listReviews(review_1.reviewArrayJson.approved, productId);
            let query = {
                $and: [
                    { customerId: user._id },
                    { 'products.productId': new mongoose_1.default.Types.ObjectId(productId) },
                    // { 'products.orderProductStatus': orderProductStatusJson.delivered }
                ]
            };
            const order = await cart_order_model_1.default.aggregate((0, cart_order_config_1.getOrderProductsDetailsLookup)(query, "1"));
            const filteredProducts = [];
            for (const singleOrder of order) {
                const products = singleOrder.products.filter((product) => product.productId.equals(new mongoose_1.default.Types.ObjectId(productId)) &&
                    (product.orderProductStatus === cart_1.orderProductStatusJson.delivered ||
                        product.orderProductStatus === cart_1.orderProductStatusJson.returned ||
                        product.orderProductStatus === cart_1.orderProductStatusJson.refunded ||
                        product.orderProductStatus === cart_1.orderProductStatusJson.pickup));
                if (products.length > 0) {
                    filteredProducts.push(...products);
                }
            }
            const targetProduct = filteredProducts.length > 0 ? filteredProducts[0] : null;
            var hasBought;
            var message;
            if (targetProduct) {
                hasBought = true,
                    message = "Customer has purchased this product.";
            }
            else {
                hasBought = false,
                    message = "Customer has not purchased this product.";
            }
            return controller.sendSuccessResponse(res, {
                requestedData: {
                    hasBought: {
                        hasBoughtProduct: hasBought,
                        message: message
                    },
                    reviews: reviews.reviews,
                    startRating: reviews.statistics
                },
                message: "Success"
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Something went wrong',
            }, req);
        }
    }
}
exports.default = new ReviewController();
