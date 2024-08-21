"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
        return review_model_1.default.find({ reviewStatus: status, productId: productId });
    }
}
exports.default = new ReviewService();
