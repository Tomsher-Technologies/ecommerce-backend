"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const mongoose_1 = __importDefault(require("mongoose"));
const xlsx = require('xlsx');
const bcrypt_1 = __importDefault(require("bcrypt"));
const path_1 = __importDefault(require("path"));
const helpers_1 = require("../../../utils/helpers");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const customer_service_1 = __importDefault(require("../../../services/admin/customer/customer-service"));
const customer_service_2 = __importDefault(require("../../../services/frontend/customer-service"));
const country_service_1 = __importDefault(require("../../../services/admin/setup/country-service"));
const customers_model_1 = __importDefault(require("../../../model/frontend/customers-model"));
const country_model_1 = __importDefault(require("../../../model/admin/setup/country-model"));
const auth_schema_1 = require("../../../utils/schemas/frontend/guest/auth-schema");
const reports_1 = require("../../../utils/admin/excel/reports");
const controller = new base_controller_1.default();
class CustomerController extends base_controller_1.default {
    async findAll(req, res) {
        try {
            const { countryId = '', customerId = '', page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query;
            let query = { _id: { $exists: true } };
            const isExcel = req.query.isExcel;
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
                        { firstName: keywordRegex },
                        { email: keywordRegex },
                        { phone: keywordRegex },
                        { referralCode: keywordRegex }
                    ],
                    ...query
                };
            }
            if (customerId) {
                query = {
                    ...query, _id: new mongoose_1.default.Types.ObjectId(customerId)
                };
            }
            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            }
            else {
                query.status = '1';
            }
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const customers = await customer_service_1.default.findAll({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            }, (isExcel === '1') ? '1' : "0");
            if (customers && customers.length > 0 && isExcel !== '1') {
                return controller.sendSuccessResponse(res, {
                    requestedData: customers[0]?.customerData || [],
                    totalCount: customers[0]?.totalCount || 0,
                    message: 'Success!'
                }, 200);
            }
            else {
                if (customers[0].customerData && customers[0].customerData.length > 0) {
                    await (0, reports_1.exportCustomerReport)(res, customers[0].customerData);
                }
                else {
                    return controller.sendErrorResponse(res, 200, { message: 'Customer Data not found' });
                }
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching coupons' });
        }
    }
    async findAllWishlist(req, res) {
        try {
            const { countryId = '', customerId = '', productId = '', variantId = '', page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query;
            let query = { _id: { $exists: true } };
            const isExcel = req.query.isExcel;
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
                        { firstName: keywordRegex },
                        { email: keywordRegex },
                        { phone: keywordRegex },
                        { referralCode: keywordRegex }
                    ],
                    ...query
                };
            }
            if (customerId) {
                query = {
                    ...query, customerId: new mongoose_1.default.Types.ObjectId(customerId)
                };
            }
            if (productId) {
                query = {
                    ...query, productId: new mongoose_1.default.Types.ObjectId(productId)
                };
            }
            if (variantId) {
                query = {
                    ...query, variantId: new mongoose_1.default.Types.ObjectId(variantId)
                };
            }
            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            }
            else {
                query.status = '1';
            }
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const customers = await customer_service_1.default.findAllWishlist({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort,
                isCount: 1
            });
            return controller.sendSuccessResponse(res, {
                requestedData: customers?.products || [],
                totalCount: customers?.totalCount || 0,
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching coupons' });
        }
    }
    async findCustomer(req, res) {
        try {
            const customerId = req.params.id;
            if (customerId) {
                const customer = await customer_service_1.default.findOne(customerId);
                return controller.sendSuccessResponse(res, {
                    requestedData: customer,
                    message: 'Success'
                });
            }
            else {
                controller.sendErrorResponse(res, 200, {
                    message: 'customer not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
    async importExcel(req, res) {
        if (req && req.file && req.file?.filename) {
            const workbook = await xlsx.readFile(path_1.default.resolve(__dirname, `../../../../public/uploads/customer/excel/${req.file?.filename}`));
            if (workbook) {
                const sheetName = workbook.SheetNames[0];
                const validation = [];
                if (workbook.SheetNames[0]) {
                    const worksheet = workbook.Sheets[sheetName];
                    if (worksheet) {
                        const jsonData = await xlsx.utils.sheet_to_json(worksheet);
                        if (jsonData) {
                            var index = 2;
                            for await (let data of jsonData) {
                                // console.log("***********", data);
                                var countryData;
                                var countryId;
                                var userExist;
                                var userphoneExist;
                                if (data.email) {
                                    const isValid = await (0, auth_schema_1.isValidEmail)(data.email);
                                    if (!isValid) {
                                        validation.push({ email: data.email, message: "email format wronf, row :" + index });
                                    }
                                    else {
                                        function isValidPhoneNumber(phoneNumber) {
                                            if (phoneNumber == null) {
                                                return false;
                                            }
                                            const phoneNumberStr = phoneNumber.toString();
                                            const minLength = 8;
                                            const maxLength = 15;
                                            // Check if the phone number length is within the specified range
                                            if (phoneNumberStr.length >= minLength && phoneNumberStr.length <= maxLength) {
                                                return true;
                                            }
                                            else {
                                                return false;
                                            }
                                        }
                                        // Example usage
                                        const isValid = await isValidPhoneNumber(data.phoneNumber);
                                        if (!isValid) {
                                            validation.push({ email: data.email, message: "phone format wrong, row :" + index });
                                        }
                                        else {
                                            userExist = await customers_model_1.default.findOne({ email: data.email });
                                            if (userExist) {
                                                validation.push({ email: data.email, message: "user is already existing, row :" + index });
                                            }
                                            else {
                                                userphoneExist = await customers_model_1.default.findOne({ phone: data.phoneNumber });
                                                if (userphoneExist) {
                                                    validation.push({ phone: data.phoneNumber, message: "pnone number is already existing, row :" + index });
                                                }
                                                else {
                                                    if (data.email && data.phoneNumber && data.name) {
                                                        if (data.countryCode) {
                                                            countryData = await country_service_1.default.findCountryId({ countryCode: data.countryCode });
                                                            if (countryData) {
                                                                countryId = countryData._id;
                                                            }
                                                            else {
                                                                const countryDetails = await country_model_1.default.findOne({ isOrigin: true });
                                                                countryId = countryDetails._id;
                                                            }
                                                        }
                                                        const generatedReferralCode = await customer_service_2.default.generateReferralCode(data.name);
                                                        var customerData = {
                                                            countryId: countryId,
                                                            email: data.email,
                                                            firstName: data.name,
                                                            phone: data.phoneNumber,
                                                            password: await bcrypt_1.default.hash('12345678', 10),
                                                            isVerified: data.isVerified === 'FALSE' ? false : true,
                                                            totalWalletAmount: data.credits,
                                                            referralCode: generatedReferralCode,
                                                            totalRewardPoint: 0,
                                                            isExcel: true
                                                        };
                                                        const newCustomer = await customer_service_1.default.create(customerData);
                                                        // if (newCustomer && data.addressBook) {
                                                        //     const address = JSON.parse(data.addressBook)[0]
                                                        //     if (address.fullName && address.phone && address.address1 && address.country && address.state && address.city) {
                                                        //         var customerData: any = {
                                                        //             customerId: newCustomer._id,
                                                        //             addressType: 'others',
                                                        //             addressMode: 'shipping-address',
                                                        //             name: address.fullName,
                                                        //             address1: address.address1,
                                                        //             phoneNumber: address.phone,
                                                        //             country: address.country,
                                                        //             state: address.state,
                                                        //             city: address.city,
                                                        //             isExcel: true
                                                        //         }
                                                        //     }
                                                        //     const createAddress = await CustomerAddress.create(customerData)
                                                        //     console.log("ccccccccccccccccccc", createAddress);
                                                        // }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                index++;
                            }
                            controller.sendSuccessResponse(res, {
                                validation,
                                totalCount: index - 2,
                                message: 'Success'
                            }, 200);
                        }
                    }
                }
            }
        }
    }
}
exports.default = new CustomerController();
