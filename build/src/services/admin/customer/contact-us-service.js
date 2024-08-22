"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const contact_us_model_1 = __importDefault(require("../../../model/frontend/contact-us-model"));
const cart_order_config_1 = require("../../../utils/config/cart-order-config");
const customer_config_1 = require("../../../utils/config/customer-config");
class ContactUsService {
    constructor() { }
    async findAll(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        let pipeline = [
            { $match: query },
            customer_config_1.countriesLookup,
            cart_order_config_1.customerLookup,
            { $unwind: { path: "$country", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
            { $skip: skip },
            { $limit: limit },
            { $sort: finalSort },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    phone: 1,
                    subject: 1,
                    message: 1,
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    __v: 1,
                    "country._id": 1,
                    "country.countryTitle": 1,
                    "country.slug": 1,
                    "country.countryCode": 1,
                    "country.currencyCode": 1,
                    "customer": 1,
                }
            }
        ];
        return contact_us_model_1.default.aggregate(pipeline).exec();
    }
    async getTotalCount(query = {}) {
        try {
            const totalCount = await contact_us_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of newsletters');
        }
    }
}
exports.default = new ContactUsService();
