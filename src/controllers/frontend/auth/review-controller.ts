import { Request, Response } from "express";

import BaseController from "../../admin/base-controller";
import ReviewService from "../../../services/frontend/auth/review-service";
import { reviewSchema } from "../../../utils/schemas/frontend/auth/review-schema";
import { formatZodError, handleFileUpload } from "../../../utils/helpers";
import OrderService from "../../../services/frontend/auth/order-service";
import mongoose from "mongoose";
import { orderProductStatusJson } from "../../../constants/cart";
import { getOrderProductsDetailsLookup } from "../../../utils/config/cart-order-config";
import CartOrderModel from '../../../model/frontend/cart-order-model';
import { reviewArrayJson } from "../../../constants/review";

const controller = new BaseController();

class ReviewController extends BaseController {

    async updateReview(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = reviewSchema.safeParse(req.body);

            if (validatedData.success) {
                const { name, productId, reviewTitle, reviewContent, rating } = validatedData.data;
                const user = res.locals.user;
                const reviewImageUrl1 = (req as any).files.find((file: any) => file.fieldname === 'reviewImage1');
                const reviewImageUrl2 = (req as any).files.find((file: any) => file.fieldname === 'reviewImage2');

                const reviewData = {
                    name,
                    customerId: user._id,
                    productId,
                    reviewTitle,
                    reviewContent,
                    rating: Number(rating),
                    reviewStatus: '1',
                    reviewImageUrl1: handleFileUpload(req, null, (req.file || reviewImageUrl1), 'reviewImageUrl1', 'review'),
                    reviewImageUrl2: handleFileUpload(req, null, (req.file || reviewImageUrl2), 'reviewImageUrl2', 'review'),
                    updatedAt: new Date()
                };

                // Check if the review already exists
                const existingReview = await ReviewService.findOne({
                    customerId: user._id,
                    productId
                });

                let responseMessage: string;
                let reviewResult;

                if (existingReview) {
                    // Update the existing review
                    reviewResult = await ReviewService.updateOne(
                        { _id: existingReview._id },
                        { $set: reviewData }
                    );
                    responseMessage = 'Review updated successfully!';
                } else {
                    // Create a new review
                    reviewResult = await ReviewService.create({
                        ...reviewData,
                        createdAt: new Date()
                    });
                    responseMessage = 'Review added successfully!';
                }

                return controller.sendSuccessResponse(res, {
                    requestedData: reviewResult,
                    message: responseMessage
                }, 200);
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while adding or updating the review',
            }, req);
        }
    }

    async getReviews(req: Request, res: Response): Promise<void> {
        try {
            const productId = req.params.id;
            const user = res.locals.user;
            const reviews = await ReviewService.listReviews(reviewArrayJson.approved, productId);
            let query = {
                $and: [
                    { customerId: user._id },
                    { 'products.productId': new mongoose.Types.ObjectId(productId) },
                    { 'products.orderProductStatus': orderProductStatusJson.delivered }
                ]
            }
            const order = await CartOrderModel.aggregate(getOrderProductsDetailsLookup(query, "1"));

            const filteredProducts = order[0].products.filter((product: any) =>
                product.productId.equals(new mongoose.Types.ObjectId(productId)) &&
                product.orderProductStatus === orderProductStatusJson.delivered ||
                product.orderProductStatus === orderProductStatusJson.returned ||
                product.orderProductStatus === orderProductStatusJson.refunded ||
                product.orderProductStatus === orderProductStatusJson.pickup
            );
            const targetProduct = filteredProducts.length > 0 ? filteredProducts[0] : null;

            var hasBought
            if (targetProduct) {
                hasBought = true
            } else {
                hasBought = false
            }
            return controller.sendSuccessResponse(res, {
                requestedData: {
                    hasBought: {
                        hasBoughtProduct: hasBought,
                        message: "Customer has purchased this product."
                    },
                    reviews
                },
                message: "Customer has purchased this product."

            }, 200);
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Something went wrong',
            }, req);
        }
    }
}
export default new ReviewController();