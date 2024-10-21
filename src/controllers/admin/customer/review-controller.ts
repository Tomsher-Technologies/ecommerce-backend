import { Request, Response } from "express";

import BaseController from "../base-controller";
import ReviewService from "../../../services/admin/customer/review-service";
import { formatZodError } from "../../../utils/helpers";
import { QueryParams } from "../../../utils/types/common";
import { reviewStatusSchema } from "../../../utils/schemas/frontend/auth/review-schema";
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from "../../../constants/admin/task-log";
import { collections } from "../../../constants/collections";

const controller = new BaseController();

class ReviewController extends BaseController {
    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { countryId = '', page_size = 1, limit = 10, status = '', sortby = '', sortorder = '', keyword = '' } = req.query as QueryParams;
            const reviewStatus = status
            let query: any = { _id: { $exists: true } };
            const userData = await res.locals.user;
            // const country = getCountryId(userData);
            // if (country) {
            //     query.countryId = country;
            // } else if (countryId) {
            //     query.countryId = new mongoose.Types.ObjectId(countryId)
            // }

            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { reviewContent: keywordRegex },
                        { reviewTitle: keywordRegex },
                    ],
                    ...query
                } as any;
            }
            if (reviewStatus) {
                query = {
                    ...query, reviewStatus: reviewStatus
                } as any;
            }

            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const reviews: any = await ReviewService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            })
            return controller.sendSuccessResponse(res, {
                requestedData: reviews[0]?.reviewData || [],
                totalCount: reviews[0]?.totalCount || 0,
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Something went wrong',
            }, req);
        }
    }

    async statusChange(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = reviewStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const reviewId = req.params.id;
                if (reviewId) {
                    let { reviewStatus } = req.body;
                    const updatedReviewData = { reviewStatus };
                    const user = await res.locals.user;
                    const updatedReview = await ReviewService.update(reviewId, updatedReviewData);
                    if (updatedReview) {
                        const reviews: any = await ReviewService.findAll({
                            query:{_id:updatedReview._id},
                        })
                        return controller.sendSuccessResponse(res, {
                            requestedData: reviews[0]?.reviewData[0],
                            message: 'Review status updated successfully!'
                        }, 200,
                            { // task log
                                userId: user._id,
                                countryId: user.countryId,
                                sourceCollection: collections.ecommerce.reviews,
                                referenceData: JSON.stringify(updatedReview, null, 2),
                                sourceFromId: reviewId,
                                sourceFrom: adminTaskLog.customers.review,
                                activity: adminTaskLogActivity.update,
                                activityComment: 'Review status updated successfully!',
                                activityStatus: adminTaskLogStatus.success
                            }
                        );
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Review Id not found!',
                        }, req);
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Review Id not found! Please try again with a review id',
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating review status'
            }, req);
        }
    }
}
export default new ReviewController();