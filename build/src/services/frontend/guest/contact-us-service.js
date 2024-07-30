"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const contact_us_model_1 = __importDefault(require("../../../model/frontend/contact-us-model"));
class ContactUsService {
    async create(contactUsData) {
        return contact_us_model_1.default.create(contactUsData);
    }
}
exports.default = new ContactUsService();
