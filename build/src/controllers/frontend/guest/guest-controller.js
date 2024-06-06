"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authSchema_1 = require("../../../utils/schemas/frontend/guest/authSchema");
const helpers_1 = require("../../../utils/helpers");
const website_setup_1 = require("../../../constants/website-setup");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const customer_service_1 = __importDefault(require("../../../services/frontend/customer-service"));
const customers_model_1 = __importDefault(require("../../../model/frontend/customers-model"));
const website_setup_model_1 = __importDefault(require("../../../model/admin/setup/website-setup-model"));
const common_service_1 = __importDefault(require("../../../services/frontend/common-service"));
const controller = new base_controller_1.default();
class GuestController extends base_controller_1.default {
    async register(req, res) {
        try {
            const validatedData = authSchema_1.registerSchema.safeParse(req.body);
            if (validatedData.success) {
                const { email, firstName, phone, password } = validatedData.data;
                const customerData = {
                    email,
                    firstName,
                    phone,
                    password: await bcrypt_1.default.hash(password, 10),
                    status: '1',
                    createdAt: new Date()
                };
                const newCustomer = await customer_service_1.default.create(customerData);
                if (newCustomer) {
                    const token = jsonwebtoken_1.default.sign({
                        userId: newCustomer._id,
                        email: newCustomer.email,
                        phone: newCustomer.phone
                    }, `${process.env.CUSTOMER_AUTH_KEY}`);
                    controller.sendSuccessResponse(res, {
                        requestedData: {
                            token,
                            userID: newCustomer._id,
                            firstName: newCustomer.firstName,
                            email: newCustomer.email,
                            phone: newCustomer.phone,
                            activeStatus: newCustomer.activeStatus
                        },
                        message: 'Customer created successfully!'
                    });
                }
                else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'This user cant register! Please try again',
                    });
                }
            }
            else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                });
            }
        }
        catch (error) {
            if (error && error.errors && error.errors.email && error.errors.email.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        email: error.errors.email.properties.message
                    }
                });
            }
            else if (error && error.errors && error.errors.phone && error.errors.phone.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        phone: error.errors.phone.properties.message
                    }
                });
            }
            controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating customer'
            });
        }
    }
    async login(req, res) {
        try {
            const countryId = await common_service_1.default.findOneCountryShortTitleWithId(req.get('host'));
            if (countryId) {
                const validatedData = authSchema_1.loginSchema.safeParse(req.body);
                if (validatedData.success) {
                    const { email, password } = validatedData.data;
                    const user = await customers_model_1.default.findOne({ email: email });
                    if (user) {
                        const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
                        if (isPasswordValid) {
                            const token = jsonwebtoken_1.default.sign({
                                userId: user._id,
                                email: user.email,
                                phone: user.phone
                            }, `${process.env.CUSTOMER_AUTH_KEY}`);
                            const shipmentSettings = await website_setup_model_1.default.findOne({ countryId, block: website_setup_1.websiteSetup.basicSettings, blockReference: website_setup_1.blockReferences.shipmentSettings });
                            const defualtSettings = await website_setup_model_1.default.findOne({ countryId, block: website_setup_1.websiteSetup.basicSettings, blockReference: website_setup_1.blockReferences.defualtSettings });
                            const websiteSettings = await website_setup_model_1.default.findOne({ countryId, block: website_setup_1.websiteSetup.basicSettings, blockReference: website_setup_1.blockReferences.websiteSettings });
                            controller.sendSuccessResponse(res, {
                                requestedData: {
                                    userData: {
                                        token,
                                        userID: user._id,
                                        firstName: user.firstName,
                                        email: user.email,
                                        phone: user.phone,
                                        activeStatus: user.activeStatus
                                    },
                                    websiteSettings: websiteSettings && websiteSettings?.blockValues && websiteSettings.blockValues,
                                    shipmentSettings: shipmentSettings && shipmentSettings?.blockValues && shipmentSettings.blockValues,
                                    defualtSettings: defualtSettings && defualtSettings?.blockValues && defualtSettings.blockValues
                                },
                                message: 'Customer created successfully!'
                            });
                        }
                        else {
                            controller.sendErrorResponse(res, 200, {
                                message: 'Invalid password.',
                            });
                        }
                    }
                    else {
                        controller.sendErrorResponse(res, 200, {
                            message: 'User not found',
                        });
                    }
                }
                else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                    });
                }
            }
            else {
                controller.sendErrorResponse(res, 500, {
                    message: 'Country is missing'
                });
            }
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating customer'
            });
        }
    }
}
exports.default = new GuestController();
