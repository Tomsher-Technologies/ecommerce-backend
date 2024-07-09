"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const payment_methods_model_1 = __importDefault(require("../../../model/admin/setup/payment-methods-model"));
const payment_method_config_1 = require("../../../utils/config/payment-method-config");
class PaymentMethodService {
    async findAll(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        const defaultSort = { createdAt: 1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        let pipeline = [
            { $match: query },
            { $skip: skip },
            { $limit: limit },
            { $sort: finalSort },
            payment_method_config_1.paymentMethodLookup,
            payment_method_config_1.paymentMethodProject,
        ];
        return payment_methods_model_1.default.aggregate(pipeline).exec();
    }
    async getTotalCount(query = {}) {
        try {
            const totalCount = await payment_methods_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of payment methods');
        }
    }
    async create(paymentMethodData) {
        return payment_methods_model_1.default.create(paymentMethodData);
    }
    async findOne(paymentMethodId) {
        return payment_methods_model_1.default.findById(paymentMethodId);
    }
    async findOneByPaymentMethodCode(paymentMethodCode) {
        const result = await payment_methods_model_1.default.findOne({ paymentMethodCode: paymentMethodCode });
        return result._id;
    }
    async update(paymentMethodId, paymentMethodData) {
        return payment_methods_model_1.default.findByIdAndUpdate(paymentMethodId, paymentMethodData, { new: true, useFindAndModify: false });
    }
    async destroy(paymentMethodId) {
        return payment_methods_model_1.default.findOneAndDelete({ _id: paymentMethodId });
    }
    async findPaymentMethod(data) {
        return payment_methods_model_1.default.findOne(data);
    }
    async findPaymentMethodId(data) {
        const resultPaymentMethod = await payment_methods_model_1.default.findOne(data);
        if (resultPaymentMethod) {
            return resultPaymentMethod;
        }
    }
}
exports.default = new PaymentMethodService();
