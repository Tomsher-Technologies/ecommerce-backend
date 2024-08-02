import { Request, Response } from "express";
import bcrypt from 'bcrypt';

import { formatZodError } from "../../../utils/helpers";
import { changePassword, customerAddressSchema, updateCustomerSchema } from "../../../utils/schemas/frontend/auth/customer.schema";

import BaseController from "../../admin/base-controller";
import CommonService from "../../../services/frontend/guest/common-service";
import CustomerService from "../../../services/frontend/customer-service";
import CustomerAddress from "../../../model/frontend/customer-address-model";
import CustomerModel from "../../../model/frontend/customers-model";
import CustomerWalletTransactionsModel from "../../../model/frontend/customer-wallet-transaction-model";

const controller = new BaseController();

class CustomerController extends BaseController {

    async findCustomer(req: Request, res: Response): Promise<void> {
        try {
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                const currentUser = res.locals.user;

                const customerDetails = await CustomerService.findOne({
                    _id: currentUser._id,
                    status: '1',
                },
                    '_id email firstName phone customerImageUrl referralCode totalRewardPoint totalWalletAmount isVerified status'
                );

                controller.sendSuccessResponse(res, {
                    requestedData: customerDetails,
                    message: 'Success!'
                }, 200);

            } else {
                return controller.sendErrorResponse(res, 500, {
                    message: 'Country is missing'
                });
            }

        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching customer' });
        }
    }


    async getAllCustomerAddress(req: Request, res: Response): Promise<void> {
        let query: any = { _id: { $exists: true } };
        const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
        if (!countryId) {
            return controller.sendErrorResponse(res, 500, {
                message: 'Country is missing'
            });
        }
        const currentUser = res.locals.user;
        const { addressMode } = req.query;
        query = {
            ...query,
            status: '1',
            countryId,
            customerId: currentUser._id,
            isGuest: currentUser.isGuest ?? false,
        } as any;

        if (addressMode) {
            query = {
                ...query,
                addressMode
            } as any;
        }

        const customerAddress = await CustomerService.findCustomerAddressAll({
            query,
        });

        controller.sendSuccessResponse(res, {
            requestedData: customerAddress,
            message: 'Success!'
        }, 200);

    }

    async findWalletDetails(req: Request, res: Response): Promise<void> {
        try {
            const currentUser = res.locals.user;
            const customerDetails = await CustomerService.findOne({
                _id: currentUser._id,
                status: '1',
            },
                '_id email firstName phone customerImageUrl referralCode totalRewardPoint totalWalletAmount isVerified status'
            );
            if (!customerDetails) {
                return controller.sendErrorResponse(res, 500, {
                    message: 'Customer not found'
                });
            }

            const walletDetails = await CustomerWalletTransactionsModel.find({
                status: '1',
                customerId: currentUser._id
            })
                .populate({
                    path: 'referrerCustomerId',
                    select: '_id firstName email',
                })
                .populate({
                    path: 'referredCustomerId',
                    select: '_id firstName email',
                })
                .populate({
                    path: 'orderId',
                    select: '_id orderId',
                })

            return controller.sendSuccessResponse(res, {
                requestedData: { customerDetails, walletDetails },
                message: 'Success!'
            }, 200);

        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching customer' });
        }
    }

    async updateCustomerProfileDetails(req: Request, res: Response): Promise<void> {
        try {
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
            if (!countryId) {
                return controller.sendErrorResponse(res, 500, {
                    message: 'Country is missing'
                });
            }

            const validationResult = updateCustomerSchema.safeParse(req.body);
            if (!validationResult.success) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validationResult.error.errors)
                });
            }

            const { email, firstName, phone } = validationResult.data;
            const currentUser = res.locals.user;

            const updateResult = await CustomerModel.updateOne(
                { _id: currentUser._id },
                { $set: { email, firstName, phone } }
            );

            if (updateResult.modifiedCount === 0) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'No updates were necessary or data is already up-to-date'
                });
            }

            return controller.sendSuccessResponse(res, {
                message: 'Customer details updated successfully'
            }, 200);

        } catch (error: any) {
            if (error && error.errors && error.errors.email && error.errors.email.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        email: error.errors.email.properties.message
                    }
                }, req);
            } else if (error && error.errors && error.errors.phone && error.errors.phone.properties) {
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

    async changePassword(req: Request, res: Response): Promise<void> {
        try {
            const originCountryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
            if (!originCountryId) {
                return controller.sendErrorResponse(res, 200, { message: 'Country is missing' });
            }

            const validationResult = changePassword.safeParse(req.body);
            if (!validationResult.success) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validationResult.error.errors)
                });
            }

            const { oldPassword, newPassword } = validationResult.data;
            const currentUser = res.locals.user;

            const user = await CustomerModel.findById(currentUser._id);
            if (!user || !user.password) {
                return controller.sendErrorResponse(res, 200, { message: 'User not found or no password set.' });
            }

            const passwordMatch = await bcrypt.compare(oldPassword, user.password);
            if (!passwordMatch) {
                return controller.sendErrorResponse(res, 200, { message: 'Incorrect old password.' });
            }

            const updateResult = await CustomerModel.updateOne(
                { _id: currentUser._id },
                { $set: { password: await bcrypt.hash(newPassword, 10) } }
            );

            if (updateResult.modifiedCount === 0) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'No updates were necessary or data is already up-to-date'
                });
            }

            return controller.sendSuccessResponse(res, {
                message: 'Password updated successfully'
            }, 200);

        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'An error occurred while processing your request.' });
        }
    }

    async addEditCustomerAddress(req: Request, res: Response): Promise<void> {
        try {
            const originCountryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
            if (!originCountryId) {
                return controller.sendErrorResponse(res, 200, { message: 'Country is missing' });
            }

            const validationResult = customerAddressSchema.safeParse(req.body);
            if (!validationResult.success) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validationResult.error.errors)
                });
            }

            const { addressId, stateId, cityId, addressType, defaultAddress, addressMode, name, address1, address2, phoneNumber, country, state, city, street, zipCode, longitude, latitude } = validationResult.data;
            const currentUser = res.locals.user;

            if (addressId) {
                return await CustomerController.updateExistingAddress(addressId, req.body, res);
            } else {
                return await CustomerController.createNewAddress(currentUser._id, { countryId: originCountryId, stateId, cityId, isGuest: currentUser.isGuest, addressType, defaultAddress, addressMode, name, address1, address2, phoneNumber, country, state, city, street, zipCode, longitude, latitude }, res);
            }
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'An error occurred while processing your request.' });
        }
    }

    async removeCustomerAddress(req: Request, res: Response): Promise<void> {
        const addressId = req.params.id;
        if (!addressId) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Customer id is required',
            });
        }

        const checkExistingCustomer = await CustomerAddress.findOne({ _id: addressId });
        if (!checkExistingCustomer) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Customer detail not fund!',
            });
        }

        const retVal = await CustomerService.destroyCustomerAddress(checkExistingCustomer._id);

        if (retVal) {
            return controller.sendSuccessResponse(res, { message: 'Address deleted successfully!' }, 200);
        } else {
            return controller.sendErrorResponse(res, 200, {
                message: 'Something went wrong!',
            });
        }
    }

    async makeDefaultCustomerAddress(req: Request, res: Response): Promise<void> {
        const addressId = req.params.id;
        if (!addressId) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Customer id is required',
            });
        }

        const { defaultAddress } = req.body;

        const checkExistingCustomer = await CustomerAddress.findOne({ _id: addressId });
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
            await CustomerAddress.updateMany(
                { customerId: checkExistingCustomer.customerId, _id: { $ne: addressId } },
                { defaultAddress: false }
            );
        }

        const updateResponse = await CustomerAddress.updateOne(
            { _id: addressId },
            { defaultAddress: defaultAddress }
        );

        if (updateResponse.modifiedCount === 1) {
            return controller.sendSuccessResponse(res, { message: 'This address has been successfully updated as the default address!' }, 200);
        } else {
            return controller.sendErrorResponse(res, 200, {
                message: 'Something went wrong or no update was necessary!',
            });
        }
    }

    static async updateExistingAddress(addressId: string, updatedData: any, res: Response): Promise<void> {
        const existingAddress = await CustomerAddress.findOne({ _id: addressId, status: '1' });

        if (!existingAddress) {
            return controller.sendErrorResponse(res, 200, { message: 'Address not found' });
        }

        if (updatedData.defaultAddress) {
            await CustomerAddress.updateMany({ customerId: existingAddress.customerId, _id: { $ne: addressId } }, { defaultAddress: false });
        }

        updatedData.updatedAt = new Date();
        const updatedAddress = await CustomerService.updateCustomerAddress(existingAddress.id, { ...updatedData, isGuest: existingAddress.isGuest });
        if (updatedAddress) {
            controller.sendSuccessResponse(res, { requestedData: updatedAddress, message: "Address updated successfully" }, 200);
        } else {
            controller.sendErrorResponse(res, 200, { message: 'Failed to update the address' });
        }
    }

    static async createNewAddress(customerId: string, newAddressData: any, res: Response): Promise<void> {
        if (newAddressData.defaultAddress) {
            await CustomerAddress.updateMany({ customerId: customerId }, { defaultAddress: false });
        }

        newAddressData.customerId = customerId;
        newAddressData.status = '1';
        newAddressData.createdAt = new Date();

        const createdAddress = await CustomerService.createCustomerAddress(newAddressData);
        if (createdAddress) {
            controller.sendSuccessResponse(res, { requestedData: createdAddress, message: "Address created successfully" }, 200);
        } else {
            controller.sendErrorResponse(res, 200, { message: 'Failed to create the address' });
        }
    }

}
export default new CustomerController();