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
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const customer_service_1 = __importDefault(require("../../../services/frontend/customer-service"));
const customer_authorisation_model_1 = __importDefault(require("../../../model/frontend/customer-authorisation-model"));
const customers_model_1 = __importDefault(require("../../../model/frontend/customers-model"));
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
                    }, 'your-secret-key', { expiresIn: '1h' });
                    const authorisationValues = new customer_authorisation_model_1.default({
                        userID: newCustomer._id,
                        token,
                        expiresIn: '1h',
                        createdOn: new Date(),
                    });
                    const insertedValues = await authorisationValues.save();
                    if (insertedValues) {
                        controller.sendSuccessResponse(res, {
                            requestedData: newCustomer,
                            message: 'Customer created successfully!'
                        });
                    }
                    else {
                        controller.sendErrorResponse(res, 200, {
                            message: 'Something went wrong! Please try again',
                        });
                    }
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
                        }, 'your-secret-key', { expiresIn: '1h' });
                        const existingUserAuth = await customer_authorisation_model_1.default.findOne({ userID: user._id });
                        let insertedValues = {};
                        if (existingUserAuth) {
                            existingUserAuth.token = token;
                            existingUserAuth.loggedCounts += 1; // increment last loggedCounts + 1
                            existingUserAuth.lastLoggedOn = new Date();
                            insertedValues = await existingUserAuth.save();
                        }
                        else {
                            const authorisationValues = new customer_authorisation_model_1.default({
                                userID: user._id,
                                token,
                                expiresIn: '1h',
                                loggedCounts: 1,
                                lastLoggedOn: new Date(),
                                createdOn: new Date(),
                            });
                            insertedValues = await authorisationValues.save();
                        }
                        controller.sendSuccessResponse(res, {
                            requestedData: {
                                token: insertedValues.token,
                                userID: insertedValues.userID,
                                firstName: user.firstName,
                                email: user.email,
                                phone: user.phone,
                                activeStatus: user.activeStatus
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
        catch (error) {
            controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating customer'
            });
        }
    }
}
exports.default = new GuestController();
