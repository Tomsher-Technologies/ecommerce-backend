
import 'module-alias/register'
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { loginSchema, registerSchema } from '@utils/schemas/frontend/guest/authSchema';
import { formatZodError } from '@utils/helpers';

import BaseController from '@controllers/admin/base-controller';
import CustomerService from '@services/frontend/customer-service';
import CustomerAuthorisationModel from '@model/frontend/customer-authorisation-model';
import CustomerModel, { CustomrProps } from '@model/frontend/customers-model';


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
                    }, 'your-secret-key', { expiresIn: '1h' });

                    const authorisationValues = new CustomerAuthorisationModel({
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
                    } else {
                        controller.sendErrorResponse(res, 200, {
                            message: 'Something went wrong! Please try again',
                        });
                    }
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
                        }, 'your-secret-key', { expiresIn: '1h' });
       
                        const existingUserAuth: any = await CustomerAuthorisationModel.findOne({ userID: user._id });
                        let insertedValues: any = {};
                        if (existingUserAuth) {
                            existingUserAuth.token = token;
                            existingUserAuth.loggedCounts += 1; // increment last loggedCounts + 1
                            existingUserAuth.lastLoggedOn = new Date()
                            insertedValues = await existingUserAuth.save();
                        } else {
                            const authorisationValues = new CustomerAuthorisationModel({
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
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating customer'
            });
        }
    }
}

export default new GuestController();
