"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_controller_1 = __importDefault(require("../base-controller"));
const review_service_1 = __importDefault(require("../../../services/admin/customer/review-service"));
const helpers_1 = require("../../../utils/helpers");
const mongoose_1 = __importDefault(require("mongoose"));
const review_schema_1 = require("../../../utils/schemas/frontend/auth/review-schema");
const task_log_1 = require("../../../constants/admin/task-log");
const controller = new base_controller_1.default();
class ReviewController extends base_controller_1.default {
    async findAll(req, res) {
        try {
            const { countryId = '', page_size = 1, limit = 10, status = '', sortby = '', sortorder = '', keyword = '' } = req.query;
            const reviewStatus = status;
            let query = { _id: { $exists: true } };
            const userData = await res.locals.user;
            const country = (0, helpers_1.getCountryId)(userData);
            if (country) {
                query.countryId = country;
            }
            else if (countryId) {
                query.countryId = new mongoose_1.default.Types.ObjectId(countryId);
            }
            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { reviewContent: keywordRegex },
                        { reviewTitle: keywordRegex },
                    ],
                    ...query
                };
            }
            if (reviewStatus) {
                query = {
                    ...query, reviewStatus: reviewStatus
                };
            }
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const reviews = await review_service_1.default.findAll({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            return controller.sendSuccessResponse(res, {
                requestedData: reviews[0]?.reviewData || [],
                totalCount: reviews[0]?.totalCount || 0,
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Something went wrong',
            }, req);
        }
    }
    async statusChange(req, res) {
        try {
            const validatedData = review_schema_1.reviewStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const reviewId = req.params.id;
                if (reviewId) {
                    let { reviewStatus } = req.body;
                    const updatedReviewData = { reviewStatus };
                    const updatedReview = await review_service_1.default.update(reviewId, updatedReviewData);
                    if (updatedReview) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedReview,
                            message: 'Review status updated successfully!'
                        }, 200, {
                            sourceFromId: reviewId,
                            sourceFrom: task_log_1.adminTaskLog.customers.review,
                            activity: task_log_1.adminTaskLogActivity.update,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Review Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Review Id not found! Please try again with a review id',
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
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating review status'
            }, req);
        }
    }
}
exports.default = new ReviewController();
