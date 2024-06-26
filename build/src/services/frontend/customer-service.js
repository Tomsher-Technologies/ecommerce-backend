"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../components/pagination");
const customer_address_model_1 = __importDefault(require("../../model/frontend/customer-address-model"));
const customers_model_1 = __importDefault(require("../../model/frontend/customers-model"));
class CustomerService {
    async findAll(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        let queryBuilder = customers_model_1.default.find(query)
            .skip(skip)
            .limit(limit)
            .lean();
        if (sort) {
            queryBuilder = queryBuilder.sort(sort);
        }
        return queryBuilder;
    }
    async getTotalCount(query = {}) {
        try {
            const totalCount = await customers_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of customers');
        }
    }
    async generateReferralCode(firstName) {
        const namePart = firstName.slice(0, 3).toUpperCase();
        const lastCustomer = await customers_model_1.default.findOne({ referralCode: new RegExp(`^${namePart}`) })
            .sort({ referralCode: -1 })
            .exec();
        let sequenceNumber = 1;
        if (lastCustomer) {
            const lastSequence = parseInt(lastCustomer.referralCode.slice(3), 10);
            if (!isNaN(lastSequence)) {
                sequenceNumber = lastSequence + 1;
            }
        }
        const sequencePart = sequenceNumber.toString().padStart(4, '0');
        return `${namePart}${sequencePart}`;
    }
    async create(customerData) {
        return customers_model_1.default.create(customerData);
    }
    async findOne(query, selectData) {
        const queryBuilder = customers_model_1.default.findOne(query);
        if (selectData) {
            queryBuilder.select(selectData);
        }
        return queryBuilder;
    }
    async update(customerId, customerData) {
        return customers_model_1.default.findByIdAndUpdate(customerId, customerData, { new: true, useFindAndModify: false });
    }
    async destroy(customerId) {
        return customers_model_1.default.findOneAndDelete({ _id: customerId });
    }
    async findCustomerAddressAll(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        let queryBuilder = customer_address_model_1.default.find(query);
        if (sort) {
            queryBuilder = queryBuilder.sort(sort);
        }
        return queryBuilder;
    }
    async createCustomerAddress(customerAddressData) {
        return customer_address_model_1.default.create(customerAddressData);
    }
    async updateCustomerAddress(addressId, customerAddressData) {
        return customer_address_model_1.default.findByIdAndUpdate(addressId, customerAddressData, { new: true, useFindAndModify: false });
    }
    async destroyCustomerAddress(addressId) {
        return customer_address_model_1.default.findOneAndDelete({ _id: addressId });
    }
}
exports.default = new CustomerService();
