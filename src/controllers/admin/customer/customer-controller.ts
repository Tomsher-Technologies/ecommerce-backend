import 'module-alias/register';
import { Request, Response } from 'express';

import { getCountryId } from '../../../utils/helpers';

import BaseController from '../../../controllers/admin/base-controller';
import CustomerService from '../../../services/admin/customer/customer-service'
import CustomerServiceFrondend from '../../../services/frontend/customer-service'

import CountryService from '../../../services/admin/setup/country-service'

import { QueryParams } from '../../../utils/types/common';
import path from 'path';
import CustomerModel from '../../../model/frontend/customers-model';
import CountryModel from '../../../model/admin/setup/country-model';
const xlsx = require('xlsx');
import bcrypt from 'bcrypt';
import CustomerAddress from '../../../model/frontend/customer-address-model';
import { isValidEmail } from '../../../utils/schemas/frontend/guest/auth-schema';
import { exportCustomerReport } from '../../../utils/admin/excel/reports';

const controller = new BaseController();

class CustomerController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query as QueryParams;
            let query: any = { _id: { $exists: true } };
            const isExcel = req.query.isExcel
            const userData = await res.locals.user;
            const countryId = getCountryId(userData);
            if (countryId) {
                query.countryId = countryId;
            }

            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { firstName: keywordRegex },
                        { email: keywordRegex }
                    ],
                    ...query
                } as any;
            }

            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            } else {
                query.status = '1';
            }

            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            // if (isExcel === '1') {
            //     // query.isExcel = '1'
            // }
            const customers: any = await CustomerService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            },
                (isExcel === '1') ? '1' : "0"
            );
            if (customers && customers.length > 0 && isExcel !== '1') {
                return controller.sendSuccessResponse(res, {
                    requestedData: customers[0]?.customerData || [],
                    totalCount: customers[0]?.totalCount || 0,
                    message: 'Success!'
                }, 200);
            } else {

                if (customers[0].customerData && customers[0].customerData.length > 0) {
                    await exportCustomerReport(res, customers[0].customerData)
                } else {
                    return controller.sendErrorResponse(res, 200, { message: 'Customer Data not found' });
                }
            }
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching coupons' });
        }
    }



    async findCustomer(req: Request, res: Response): Promise<void> {
        try {
            const customerId = req.params.id;
            if (customerId) {
                const customer = await CustomerService.findOne(customerId);

                return controller.sendSuccessResponse(res, {
                    requestedData: customer,
                    message: 'Success'
                });
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'customer not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }


    async importExcel(req: Request, res: Response): Promise<void> {
        if (req && req.file && req.file?.filename) {
            const workbook = await xlsx.readFile(path.resolve(__dirname, `../../../../public/uploads/customer/excel/${req.file?.filename}`));
            if (workbook) {
                const sheetName = workbook.SheetNames[0];
                const validation: any = []

                if (workbook.SheetNames[0]) {
                    const worksheet = workbook.Sheets[sheetName];

                    if (worksheet) {
                        const jsonData = await xlsx.utils.sheet_to_json(worksheet);

                        if (jsonData) {
                            var index = 2

                            for await (let data of jsonData) {

                                // console.log("***********", data);
                                var countryData: any
                                var countryId;
                                var userExist;
                                var userphoneExist;

                                if (data.email) {


                                    const isValid = await isValidEmail(data.email);
                                    if (!isValid) {
                                        validation.push({ email: data.email, message: "email format wronf, row :" + index })

                                    } else {

                                        function isValidPhoneNumber(phoneNumber: any) {
                                            if (phoneNumber == null) {
                                                return false;
                                            }
                                            const phoneNumberStr = phoneNumber.toString();
                                            const minLength = 8;
                                            const maxLength = 15;

                                            // Check if the phone number length is within the specified range
                                            if (phoneNumberStr.length >= minLength && phoneNumberStr.length <= maxLength) {
                                                return true;
                                            } else {
                                                return false;
                                            }
                                        }

                                        // Example usage
                                        const isValid = await isValidPhoneNumber(data.phoneNumber);
                                        if (!isValid) {
                                            validation.push({ email: data.email, message: "phone format wrong, row :" + index })

                                        } else {
                                            userExist = await CustomerModel.findOne({ email: data.email })
                                            if (userExist) {
                                                validation.push({ email: data.email, message: "user is already existing, row :" + index })
                                            }

                                            else {

                                                userphoneExist = await CustomerModel.findOne({ phone: data.phoneNumber })
                                                if (userphoneExist) {
                                                    validation.push({ phone: data.phoneNumber, message: "pnone number is already existing, row :" + index })
                                                } else {
                                                    if (data.email && data.phoneNumber && data.name) {

                                                        if (data.countryCode) {
                                                            countryData = await CountryService.findCountryId({ countryCode: data.countryCode })
                                                            if (countryData) {
                                                                countryId = countryData._id
                                                            } else {
                                                                const countryDetails: any = await CountryModel.findOne({ isOrigin: true });
                                                                countryId = countryDetails._id

                                                            }
                                                        }
                                                        const generatedReferralCode = await CustomerServiceFrondend.generateReferralCode(data.name);

                                                        var customerData: any = {
                                                            countryId: countryId,
                                                            email: data.email,
                                                            firstName: data.name,
                                                            phone: data.phoneNumber,
                                                            password: await bcrypt.hash('12345678', 10),
                                                            isVerified: data.isVerified === 'FALSE' ? false : true,
                                                            totalRewardPoint: data.credits,
                                                            referralCode: generatedReferralCode,
                                                            totalWalletAmount: 0,
                                                            isExcel: true
                                                        }

                                                        const newCustomer = await CustomerService.create(customerData);
                                                        if (newCustomer && data.addressBook) {

                                                            const address = JSON.parse(data.addressBook)[0]
                                                            if (address.fullName && address.phone && address.address1 && address.country && address.state && address.city) {
                                                                var customerData: any = {
                                                                    customerId: newCustomer._id,
                                                                    addressType: 'others',
                                                                    addressMode: 'shipping-address',
                                                                    name: address.fullName,
                                                                    address1: address.address1,
                                                                    phoneNumber: address.phone,
                                                                    country: address.country,
                                                                    state: address.state,
                                                                    city: address.city,
                                                                    isExcel: true

                                                                }
                                                            }

                                                            const createAddress = await CustomerAddress.create(customerData)
                                                            console.log("ccccccccccccccccccc", createAddress);

                                                        }
                                                    }
                                                }
                                            }
                                        }

                                    }
                                }

                                index++


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

export default new CustomerController();

