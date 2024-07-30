"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const newsletter_model_1 = __importDefault(require("../../../model/frontend/newsletter-model"));
class NewsletterService {
    async create(newsletterData) {
        return newsletter_model_1.default.create(newsletterData);
    }
}
exports.default = new NewsletterService();
