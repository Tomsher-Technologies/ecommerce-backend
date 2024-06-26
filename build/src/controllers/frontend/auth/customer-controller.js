"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const helpers_1 = require("../../../utils/helpers");
const customer_schema_1 = require("../../../utils/schemas/frontend/auth/customer.schema");
const base_controller_1 = __importDefault(require("../../admin/base-controller"));
const common_service_1 = __importDefault(require("../../../services/frontend/guest/common-service"));
const customer_service_1 = __importDefault(require("../../../services/frontend/customer-service"));
const customer_address_model_1 = __importDefault(require("../../../model/frontend/customer-address-model"));
const customers_model_1 = __importDefault(require("../../../model/frontend/customers-model"));
const controller = new base_controller_1.default();
class CustomerController extends base_controller_1.default {
    async findCustomer(req, res) {
        try {
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                const customer = await customer_service_1.default.findOne({
                    status: '1',
                }, '_id email firstName phone customerImageUrl referralCode totalRewardPoint totalWalletAmount isVerified status');
                controller.sendSuccessResponse(res, {
                    requestedData: customer,
                    message: 'Success!'
                }, 200);
            }
            else {
                return controller.sendErrorResponse(res, 500, {
                    message: 'Country is missing'
                });
            }
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching customer' });
        }
    }
    async updateCustomerProfileDetails(req, res) {
        try {
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (!countryId) {
                return controller.sendErrorResponse(res, 500, {
                    message: 'Country is missing'
                });
            }
            const validationResult = customer_schema_1.updateCustomerSchema.safeParse(req.body);
            if (!validationResult.success) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validationResult.error.errors)
                });
            }
            const { email, firstName, phone } = validationResult.data;
            const currentUser = res.locals.user;
            const updateResult = await customers_model_1.default.updateOne({ _id: currentUser._id }, { $set: { email, firstName, phone } });
            if (updateResult.modifiedCount === 0) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'No updates were necessary or data is already up-to-date'
                });
            }
            return controller.sendSuccessResponse(res, {
                message: 'Customer details updated successfully'
            }, 200);
        }
        catch (error) {
            if (error && error.errors && error.errors.email && error.errors.email.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        email: error.errors.email.properties.message
                    }
                }, req);
            }
            else if (error && error.errors && error.errors.phone && error.errors.phone.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        phone: error.errors.phone.properties.message
                    }
                }, req);
            }
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while updating customer details' });
        }
    }
    async changePassword(req, res) {
        try {
            const originCountryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (!originCountryId) {
                return controller.sendErrorResponse(res, 200, { message: 'Country is missing' });
            }
            const validationResult = customer_schema_1.changePassword.safeParse(req.body);
            if (!validationResult.success) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validationResult.error.errors)
                });
            }
            const { oldPassword, newPassword } = validationResult.data;
            const currentUser = res.locals.user;
            const user = await customers_model_1.default.findById(currentUser._id);
            if (!user || !user.password) {
                return controller.sendErrorResponse(res, 200, { message: 'User not found or no password set.' });
            }
            const passwordMatch = await bcrypt_1.default.compare(oldPassword, user.password);
            if (!passwordMatch) {
                return controller.sendErrorResponse(res, 200, { message: 'Incorrect old password.' });
            }
            const updateResult = await customers_model_1.default.updateOne({ _id: currentUser._id }, { $set: { password: await bcrypt_1.default.hash(newPassword, 10) } });
            if (updateResult.modifiedCount === 0) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'No updates were necessary or data is already up-to-date'
                });
            }
            return controller.sendSuccessResponse(res, {
                message: 'Password updated successfully'
            }, 200);
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'An error occurred while processing your request.' });
        }
    }
    async getAllCustomerAddress(req, res) {
        let query = { _id: { $exists: true } };
        const currentUser = res.locals.user;
        query = {
            ...query,
            status: '1',
            customerId: currentUser._id
        };
        const customerAddress = await customer_service_1.default.findCustomerAddressAll({
            query,
        });
        controller.sendSuccessResponse(res, {
            requestedData: customerAddress,
            message: 'Success!'
        }, 200);
    }
    async addEditCustomerAddress(req, res) {
        try {
            const originCountryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (!originCountryId) {
                return controller.sendErrorResponse(res, 200, { message: 'Country is missing' });
            }
            const validationResult = customer_schema_1.customerAddressSchema.safeParse(req.body);
            if (!validationResult.success) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validationResult.error.errors)
                });
            }
            const { addressId, addressType, defaultAddress, addressMode, name, address1, address2, phoneNumber, country, state, city, street, zipCode, longitude, latitude } = validationResult.data;
            const currentUser = res.locals.user;
            if (addressId) {
                return await CustomerController.updateExistingAddress(addressId, req.body, res);
            }
            else {
                return await CustomerController.createNewAddress(currentUser._id, { addressType, defaultAddress, addressMode, name, address1, address2, phoneNumber, country, state, city, street, zipCode, longitude, latitude }, res);
            }
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'An error occurred while processing your request.' });
        }
    }
    async removeCustomerAddress(req, res) {
        const addressId = req.params.id;
        if (!addressId) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Customer id is required',
            });
        }
        const checkExistingCustomer = await customer_address_model_1.default.findOne({ _id: addressId });
        if (!checkExistingCustomer) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Customer detail not fund!',
            });
        }
        const retVal = await customer_service_1.default.destroyCustomerAddress(checkExistingCustomer._id);
        if (retVal) {
            return controller.sendSuccessResponse(res, { message: 'Address deleted successfully!' }, 200);
        }
        else {
            return controller.sendErrorResponse(res, 200, {
                message: 'Something went wrong!',
            });
        }
    }
    async makeDefaultCustomerAddress(req, res) {
        const addressId = req.params.id;
        if (!addressId) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Customer id is required',
            });
        }
        const { defaultAddress } = req.body;
        const checkExistingCustomer = await customer_address_model_1.default.findOne({ _id: addressId });
        if (!checkExistingCustomer) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Customer detail not found!',
            });
        }
        if (checkExistingCustomer.defaultAddress === defaultAddress) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Already this default address!',
            });
        }
        if (defaultAddress) {
            await customer_address_model_1.default.updateMany({ customerId: checkExistingCustomer.customerId, _id: { $ne: addressId } }, { defaultAddress: false });
        }
        const updateResponse = await customer_address_model_1.default.updateOne({ _id: addressId }, { defaultAddress: defaultAddress });
        if (updateResponse.modifiedCount === 1) {
            return controller.sendSuccessResponse(res, { message: 'This address has been successfully updated as the default address!' }, 200);
        }
        else {
            return controller.sendErrorResponse(res, 200, {
                message: 'Something went wrong or no update was necessary!',
            });
        }
    }
    static async updateExistingAddress(addressId, updatedData, res) {
        const existingAddress = await customer_address_model_1.default.findOne({ _id: addressId, status: '1' });
        if (!existingAddress) {
            return controller.sendErrorResponse(res, 200, { message: 'Address not found' });
        }
        if (updatedData.defaultAddress) {
            await customer_address_model_1.default.updateMany({ customerId: existingAddress.customerId, _id: { $ne: addressId } }, { defaultAddress: false });
        }
        updatedData.updatedAt = new Date();
        const updatedAddress = await customer_service_1.default.updateCustomerAddress(existingAddress.id, updatedData);
        if (updatedAddress) {
            controller.sendSuccessResponse(res, { requestedData: updatedAddress, message: "Address updated successfully" }, 200);
        }
        else {
            controller.sendErrorResponse(res, 200, { message: 'Failed to update the address' });
        }
    }
    static async createNewAddress(customerId, newAddressData, res) {
        if (newAddressData.defaultAddress) {
            await customer_address_model_1.default.updateMany({ customerId: customerId }, { defaultAddress: false });
        }
        newAddressData.customerId = customerId;
        newAddressData.status = '1';
        newAddressData.createdAt = new Date();
        const createdAddress = await customer_service_1.default.createCustomerAddress(newAddressData);
        if (createdAddress) {
            controller.sendSuccessResponse(res, { requestedData: createdAddress, message: "Address created successfully" }, 200);
        }
        else {
            controller.sendErrorResponse(res, 200, { message: 'Failed to create the address' });
        }
    }
}
exports.default = new CustomerController();
