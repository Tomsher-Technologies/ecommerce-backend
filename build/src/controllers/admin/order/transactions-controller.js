"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const mongoose_1 = __importDefault(require("mongoose"));
const transaction_service_1 = __importDefault(require("../../../services/admin/order/transaction-service"));
const helpers_1 = require("../../../utils/helpers");
const controller = new base_controller_1.default();
class TransactionsController extends base_controller_1.default {
    async findAll(req, res) {
        try {
            const { paymentMethodId = '', paymentTransactionId = '', countryId, paymentFromDate = '', paymentEndDate, page_size = 1, limit = 10, sortby = '', sortorder = '', keyword = '', status = '' } = req.query;
            let query = { _id: { $exists: true } };
            const userData = await res.locals.user;
            const country = (0, helpers_1.getCountryId)(userData);
            if (country) {
                query.orders.country._id = country;
            }
            else if (countryId) {
                query = {
                    ...query, 'orders.country._id': new mongoose_1.default.Types.ObjectId(countryId)
                };
            }
            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { 'paymentMethodId.paymentMethodTitle': keywordRegex },
                        { transactionId: keywordRegex },
                        { paymentId: keywordRegex },
                    ],
                    ...query
                };
            }
            if (paymentMethodId) {
                query = {
                    ...query, 'paymentMethodId._id': new mongoose_1.default.Types.ObjectId(paymentMethodId)
                };
            }
            if (paymentTransactionId) {
                query = {
                    ...query, _id: new mongoose_1.default.Types.ObjectId(paymentTransactionId)
                };
            }
            if (status) {
                query = {
                    ...query, status: status
                };
            }
            else {
                query = {
                    ...query, status: { $ne: "2" }
                };
            }
            if (paymentFromDate || paymentEndDate) {
                query.createdAt = {
                    ...(paymentFromDate && { $gte: new Date(paymentFromDate) }),
                    ...(paymentEndDate && { $lte: (0, helpers_1.dateConvertPm)(paymentEndDate) })
                };
            }
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const transactions = await transaction_service_1.default.findAll({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            controller.sendSuccessResponse(res, {
                requestedData: transactions.data,
                totalCount: transactions.total,
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching transactions' });
        }
    }
}
exports.default = new TransactionsController();
