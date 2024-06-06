
import 'module-alias/register'
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { loginSchema, registerSchema } from '../../../utils/schemas/frontend/guest/authSchema';
import { formatZodError } from '../../../utils/helpers';
import { blockReferences, websiteSetup } from '../../../constants/website-setup';

import BaseController from '../../../controllers/admin/base-controller';
import CustomerService from '../../../services/frontend/customer-service';
import CustomerModel, { CustomrProps } from '../../../model/frontend/customers-model';
import WebsiteSetupModel from '../../../model/admin/setup/website-setup-model';
import CommonService from '../../../services/frontend/common-service';


const controller = new BaseController();

class GuestController extends BaseController {

    async register(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = registerSchema.safeParse(req.body);

            if (validatedData.success) {
                const { email, firstName, phone, password } = validatedData.data;

                const customerData = {
                    email,
                    firstName,
                    phone,
                    password: await bcrypt.hash(password, 10),
                    status: '1',
                    createdAt: new Date()
                };
                const newCustomer = await CustomerService.create(customerData);

                if (newCustomer) {
                    const token: string = jwt.sign({
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

                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'This user cant register! Please try again',
                    });
                }
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                });
            }
        } catch (error: any) {
            if (error && error.errors && error.errors.email && error.errors.email.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        email: error.errors.email.properties.message
                    }
                });
            } else if (error && error.errors && error.errors.phone && error.errors.phone.properties) {
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

    async login(req: Request, res: Response): Promise<void> {
        try {
            const countryId = await CommonService.findOneCountryShortTitleWithId(req.get('host'));
            if (countryId) {
                const validatedData = loginSchema.safeParse(req.body);
                if (validatedData.success) {
                    const { email, password } = validatedData.data;
                    const user: CustomrProps | null = await CustomerModel.findOne({ email: email });
                    if (user) {
                        const isPasswordValid = await bcrypt.compare(password, user.password);
                        if (isPasswordValid) {
                            const token: string = jwt.sign({
                                userId: user._id,
                                email: user.email,
                                phone: user.phone
                            }, `${process.env.CUSTOMER_AUTH_KEY}`);

                            const shipmentSettings: any = await WebsiteSetupModel.findOne({ countryId, block: websiteSetup.basicSettings, blockReference: blockReferences.shipmentSettings });
                            const defualtSettings: any = await WebsiteSetupModel.findOne({ countryId, block: websiteSetup.basicSettings, blockReference: blockReferences.defualtSettings });
                            const websiteSettings: any = await WebsiteSetupModel.findOne({ countryId, block: websiteSetup.basicSettings, blockReference: blockReferences.websiteSettings });

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
                        } else {
                            controller.sendErrorResponse(res, 200, {
                                message: 'Invalid password.',
                            });
                        }
                    } else {
                        controller.sendErrorResponse(res, 200, {
                            message: 'User not found',
                        });
                    }
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: formatZodError(validatedData.error.errors)
                    });
                }
            } else {
                controller.sendErrorResponse(res, 500, {
                    message: 'Country is missing'
                });
            }
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating customer'
            });
        }
    }
}

export default new GuestController();
