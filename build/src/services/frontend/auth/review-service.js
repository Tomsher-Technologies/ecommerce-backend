"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const review_model_1 = __importDefault(require("../../../model/frontend/review-model"));
class ReviewService {
    async create(reviewData) {
        return review_model_1.default.create(reviewData);
    }
    async findOne(filter) {
        return review_model_1.default.findOne(filter);
    }
    async updateOne(filter, updateData) {
        return review_model_1.default.findOneAndUpdate(filter, updateData, { new: true });
    }
    async listReviews(status, productId) {
        const pipeline = [
            {
                $match: {
                    reviewStatus: status,
                    productId: new mongoose_1.default.Types.ObjectId(productId),
                },
            },
            {
                $group: {
                    _id: "$rating",
                    count: { $sum: 1 },
                },
            },
            {
                $group: {
                    _id: null,
                    totalReviews: { $sum: "$count" }, // Calculate total number of reviews
                    ratingCounts: {
                        $push: {
                            rating: "$_id",
                            count: "$count",
                        },
                    },
                    totalRatingSum: { $sum: { $multiply: ["$_id", "$count"] } }, // Calculate the sum of all ratings
                },
            },
            {
                $addFields: {
                    averageRating: {
                        $divide: ["$totalRatingSum", "$totalReviews"], // Calculate the average rating
                    },
                    ratingCounts: {
                        $map: {
                            input: [1, 2, 3, 4, 5], // Include all ratings from 1 to 5
                            as: "rating",
                            in: {
                                rating: "$$rating",
                                count: {
                                    $reduce: {
                                        input: {
                                            $filter: {
                                                input: "$ratingCounts",
                                                as: "rc",
                                                cond: { $eq: ["$$rc.rating", "$$rating"] },
                                            },
                                        },
                                        initialValue: 0,
                                        in: { $add: ["$$value", "$$this.count"] },
                                    },
                                },
                                percentage: {
                                    $multiply: [
                                        {
                                            $divide: [{
                                                    $reduce: {
                                                        input: {
                                                            $filter: {
                                                                input: "$ratingCounts",
                                                                as: "rc",
                                                                cond: { $eq: ["$$rc.rating", "$$rating"] },
                                                            },
                                                        },
                                                        initialValue: 0,
                                                        in: { $add: ["$$value", "$$this.count"] },
                                                    }
                                                }, "$totalReviews"]
                                        },
                                        100,
                                    ],
                                },
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    averageRating: 1,
                    totalReviews: 1,
                    ratingCounts: 1,
                },
            },
        ];
        const reviewStatistics = await review_model_1.default.aggregate(pipeline);
        const reviews = await review_model_1.default.find({
            reviewStatus: status,
            productId: new mongoose_1.default.Types.ObjectId(productId),
        });
        return {
            reviews,
            statistics: reviewStatistics[0] || {
                averageRating: 0,
                totalReviews: 0,
                ratingCounts: [
                    { rating: 1, count: 0, percentage: 0 },
                    { rating: 2, count: 0, percentage: 0 },
                    { rating: 3, count: 0, percentage: 0 },
                    { rating: 4, count: 0, percentage: 0 },
                    { rating: 5, count: 0, percentage: 0 },
                ],
            },
        };
    }
}
exports.default = new ReviewService();
