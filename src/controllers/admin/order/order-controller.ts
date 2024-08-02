import 'module-alias/register';
import { Request, Response } from 'express';
import path from 'path';
const ejs = require('ejs');
const { convert } = require('html-to-text');

import { calculateExpectedDeliveryDate, dateConvertPm, formatZodError, getCountryId, handleFileUpload, slugify, stringToArray } from '../../../utils/helpers';

import BaseController from '../../../controllers/admin/base-controller';
import OrderService from '../../../services/admin/order/order-service'

import mongoose from 'mongoose';
import { OrderQueryParams } from '../../../utils/types/order';
import CartOrdersModel, { CartOrderProps } from '../../../model/frontend/cart-order-model';
import { cartStatus as cartStatusJson, orderProductReturnQuantityStatusJson, orderProductReturnStatusJson, orderProductStatusJson, orderReturnStatusMessages, orderStatusArray, orderStatusArrayJason, orderStatusMessages } from '../../../constants/cart';
import { blockReferences, websiteSetup } from '../../../constants/website-setup';
import CustomerService from '../../../services/frontend/customer-service';
import { mailChimpEmailGateway } from '../../../lib/emails/mail-chimp-sms-gateway';
import WebsiteSetupModel from '../../../model/admin/setup/website-setup-model';
import CartOrderProductsModel from '../../../model/frontend/cart-order-product-model';
import { pdfGenerator } from '../../../lib/pdf/pdf-generator';
import TaxsModel from '../../../model/admin/setup/tax-model';
import ProductVariantsModel from '../../../model/admin/ecommerce/product/product-variants-model';
import { smtpEmailGateway } from '../../../lib/emails/smtp-nodemailer-gateway';
import CountryModel from '../../../model/admin/setup/country-model';
import CustomerModel from '../../../model/frontend/customers-model';
import { productDetailsWithVariant } from '../../../utils/config/product-config';
import ProductsModel from '../../../model/admin/ecommerce/product-model';
import { exportOrderReport } from '../../../utils/admin/excel/reports';

const controller = new BaseController();

class OrdersController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, cartStatus = '', sortby = '', sortorder = '', keyword = '', countryId = '', customerId = '', pickupStoreId = '', paymentMethodId = '', couponId = '', orderFromDate, orderEndDate, processingFromDate, processingEndDate, packedFromDate, packedEndDate, shippedFromDate, shippedEndDate, deliveredFromDate, deliveredEndDate, canceledFromDate, canceledEndDate, returnedFromDate, returnedEndDate, refundedFromDate, refundedEndDate, partiallyShippedFromDate, partiallyShippedEndDate, onHoldFromDate, onHoldEndDate, failedFromDate, failedEndDate, completedFromDate, completedEndDate, pickupFromDate, pickupEndDate, cartFromDate, cartEndDate, isExcel } = req.query as OrderQueryParams;
            let query: any = { _id: { $exists: true } };

            const userData = await res.locals.user;

            const country = getCountryId(userData);
            query = { cartStatus: { $ne: cartStatusJson.active } }
            if (country) {
                query.countryId = country;
            } else if (countryId) {
                query.countryId = new mongoose.Types.ObjectId(countryId)
            }

            if (customerId) {
                query = {
                    ...query, customerId: new mongoose.Types.ObjectId(customerId)
                } as any;
            }

            if (cartStatus) {
                query = {
                    ...query, cartStatus: cartStatus
                } as any;
            }

            if (couponId) {
                query = {
                    ...query, couponId: new mongoose.Types.ObjectId(couponId)
                } as any;
            }

            if (paymentMethodId) {
                query = {
                    ...query, paymentMethodId: new mongoose.Types.ObjectId(paymentMethodId)
                } as any;
            }

            if (pickupStoreId) {
                query = {
                    ...query, pickupStoreId: new mongoose.Types.ObjectId(pickupStoreId)
                } as any;
            }

            if (orderFromDate || orderEndDate) {
                query.orderStatusAt = {
                    ...(orderFromDate && { $gte: new Date(orderFromDate) }),
                    ...(orderEndDate && { $lte: dateConvertPm(orderEndDate) })
                };

            }

            if (processingFromDate || processingEndDate) {
                query.processingStatusAt = {
                    ...(processingFromDate && { $gte: new Date(processingFromDate) }),
                    ...(processingEndDate && { $lte: dateConvertPm(processingEndDate) })
                };
            }

            if (packedFromDate || packedEndDate) {
                query.packedStatusAt = {
                    ...(packedFromDate && { $gte: new Date(packedFromDate) }),
                    ...(packedEndDate && { $lte: dateConvertPm(packedEndDate) })
                };
            }

            if (shippedFromDate || shippedEndDate) {
                query.shippedStatusAt = {
                    ...(shippedFromDate && { $gte: new Date(shippedFromDate) }),
                    ...(shippedEndDate && { $lte: dateConvertPm(shippedEndDate) })
                };

            }

            if (deliveredFromDate || deliveredEndDate) {
                query.deliveredStatusAt = {
                    ...(deliveredFromDate && { $gte: new Date(deliveredFromDate) }),
                    ...(deliveredEndDate && { $lte: dateConvertPm(deliveredEndDate) })
                };

            }
            if (canceledFromDate || canceledEndDate) {
                query.canceledStatusAt = {
                    ...(canceledFromDate && { $gte: new Date(canceledFromDate) }),
                    ...(canceledEndDate && { $lte: dateConvertPm(canceledEndDate) })
                };

            }
            if (returnedFromDate || returnedEndDate) {
                query.returnedStatusAt = {
                    ...(returnedFromDate && { $gte: new Date(returnedFromDate) }),
                    ...(returnedEndDate && { $lte: dateConvertPm(returnedEndDate) })
                };

            }
            if (refundedFromDate || refundedEndDate) {
                query.refundedStatusAt = {
                    ...(refundedFromDate && { $gte: new Date(refundedFromDate) }),
                    ...(refundedEndDate && { $lte: dateConvertPm(refundedEndDate) })
                };

            }

            if (partiallyShippedFromDate || partiallyShippedEndDate) {
                query.partiallyShippedStatusAt = {
                    ...(partiallyShippedFromDate && { $gte: new Date(partiallyShippedFromDate) }),
                    ...(partiallyShippedEndDate && { $lte: dateConvertPm(partiallyShippedEndDate) })
                };

            }

            if (onHoldFromDate || onHoldEndDate) {
                query.onHoldStatusAt = {
                    ...(onHoldFromDate && { $gte: new Date(onHoldFromDate) }),
                    ...(onHoldEndDate && { $lte: dateConvertPm(onHoldEndDate) })
                };

            }

            if (failedFromDate || failedEndDate) {
                query.failedStatusAt = {
                    ...(failedFromDate && { $gte: new Date(failedFromDate) }),
                    ...(failedEndDate && { $lte: dateConvertPm(failedEndDate) })
                };

            }

            if (completedFromDate || completedEndDate) {
                query.completedStatusAt = {
                    ...(completedFromDate && { $gte: new Date(completedFromDate) }),
                    ...(completedEndDate && { $lte: dateConvertPm(completedEndDate) })
                };

            }

            if (pickupFromDate || pickupEndDate) {
                query.pickupStatusAt = {
                    ...(pickupFromDate && { $gte: new Date(pickupFromDate) }),
                    ...(pickupEndDate && { $lte: dateConvertPm(pickupEndDate) })
                };

            }

            if (cartFromDate || cartEndDate) {
                query.cartStatusAt = {
                    ...(cartFromDate && { $gte: new Date(cartFromDate) }),
                    ...(cartEndDate && { $lte: dateConvertPm(cartEndDate) })
                };
            }

            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            if (isExcel !== '1') {
                const order = await OrderService.OrderList({
                    page: parseInt(page_size as string),
                    limit: parseInt(limit as string),
                    query,
                    sort
                });
                const totalCount = await OrderService.OrderList({
                    page: parseInt(page_size as string),
                    query,
                    getTotalCount: true
                })
                return controller.sendSuccessResponse(res, {
                    requestedData: order,
                    totalCount: totalCount.length,
                    message: 'Success!'
                }, 200);
            } else {
                const orders: any = await OrderService.orderListExcelExport({
                    page: parseInt(page_size as string),
                    limit: parseInt(limit as string),
                    query,
                    sort
                });
                if (orders[0].orderData && orders[0].orderData.length > 0) {
                    await exportOrderReport(res, orders[0].orderData)
                } else {
                    return controller.sendErrorResponse(res, 200, { message: 'Order Data not found' });

                }
            }


        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching coupons' });
        }
    }

    async getOrderDetails(req: Request, res: Response): Promise<void> {
        try {
            const orderId = req.params.id;

            const orderDetails: any = await OrderService.OrderList({
                query: {
                    _id: new mongoose.Types.ObjectId(orderId)
                },
                getAddress: '1',
                getCartProducts: '1',
                hostName: req.get('origin'),
            })

            if (orderDetails && orderDetails?.length > 0) {
                return controller.sendSuccessResponse(res, {
                    requestedData: orderDetails[0],
                    message: 'Your Order is ready!'
                });
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Order not fount'
                });
            }

        } catch (error: any) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Order not fount'
            });

        }
    }

    async getOrdeReturnProducts(req: Request, res: Response): Promise<void> {
        const { page_size = 1, limit = 10, sortby = '', sortorder = '', countryId = '', customerId = '', paymentMethodId = '', orderProductReturnStatus = '', orderProductReturnStatusFromDate = '', orderProductReturnStatusEndDate = '' } = req.query as OrderQueryParams;
        const userData = await res.locals.user;
        let query: any = {
            _id: { $exists: true },
            'cartDetails.orderStatus': orderProductStatusJson.delivered,
            'cartDetails.cartStatus': { $ne: cartStatusJson.active },
            $or: [
                { orderRequestedProductQuantity: { $gt: 0 } },
                { orderRequestedProductQuantityStatus: { $ne: "0" } },
                { orderProductReturnStatus: { $ne: "0" } },
            ]
        };

        const country = getCountryId(userData);
        if (country) {
            query['cartDetails.countryId'] = country;
        } else if (countryId) {
            query['cartDetails.countryId'] = new mongoose.Types.ObjectId(countryId);
        }

        if (customerId) {
            query['cartDetails.customerId'] = new mongoose.Types.ObjectId(customerId);
        }

        if (paymentMethodId) {
            query['cartDetails.paymentMethodId'] = new mongoose.Types.ObjectId(paymentMethodId);
        }

        if (orderProductReturnStatus) {
            query = {
                ...query, orderProductReturnStatus: orderProductReturnStatus
            } as any;
        }

        if (orderProductReturnStatusFromDate || orderProductReturnStatusEndDate) {
            query.orderProductReturnStatusStatusAt = {
                ...(orderProductReturnStatusFromDate && { $gte: new Date(orderProductReturnStatusFromDate) }),
                ...(orderProductReturnStatusEndDate && { $lte: dateConvertPm(orderProductReturnStatusEndDate) })
            };
        }

        const sort: any = {};
        if (sortby && sortorder) {
            sort[sortby] = sortorder === 'desc' ? -1 : 1;
        }

        const order = await OrderService.getOrdeReturnProducts({
            page: parseInt(page_size as string),
            limit: parseInt(limit as string),
            query,
            sort,
            getTotalCount: false
        });
        const totalCount = await OrderService.getOrdeReturnProducts({
            page: parseInt(page_size as string),
            query,
            getTotalCount: true
        })

        return controller.sendSuccessResponse(res, {
            requestedData: order,
            totalCount: totalCount?.totalCount || 0,
            message: 'Success!'
        }, 200);
    }

    async orderProductStatusChange(req: Request, res: Response): Promise<void> {
        const { orderID, orderProductId } = req.params;
        const { newStatus } = req.body;
        const orderProducts = await CartOrderProductsModel.find({ cartId: new mongoose.Types.ObjectId(orderID) });

        if (orderProducts.length === 0) {
            return controller.sendErrorResponse(res, 200, { message: 'Order not found!' });
        }
        if (orderProducts.length === 1) {
            return controller.sendErrorResponse(res, 200, { message: 'Please update the status through the main order status!' });
        }
        const orderProduct = orderProducts.find(product => product._id.toString() === orderProductId);
        if (!orderProduct) {
            return controller.sendErrorResponse(res, 200, { message: 'Order product not found!' });
        }
        const invalidStatuses = [orderProductStatusJson.returned, orderProductStatusJson.refunded, orderProductStatusJson.canceled, orderProductStatusJson.delivered];
        if (invalidStatuses.includes(orderProduct.orderProductStatus)) {
            return controller.sendErrorResponse(res, 200, { message: 'Status change not allowed for the current product status.' });
        }
        if (Number(orderProductStatusJson.delivered) > Number(orderProduct.orderProductStatus)) {
            return controller.sendErrorResponse(res, 200, { message: 'Status can only be changed to a value before "Delivered".' });
        }
        const orderDetails = await CartOrdersModel.findById(orderProduct.cartId);
        if (!orderDetails) {
            return controller.sendErrorResponse(res, 200, { message: 'Order not found!' });
        }
        if (Number(orderStatusArrayJason.delivered) > Number(orderDetails.orderStatus)) {
            return controller.sendErrorResponse(res, 200, { message: 'Cannot change status for an order with status before "Delivered".' });
        }
        if (!newStatus || !Object.values(orderProductStatusJson).includes(newStatus)) {
            return controller.sendErrorResponse(res, 200, { message: 'Invalid status provided.' });
        }
        const updateProductStatus = {
            orderProductStatus: newStatus,
            orderProductStatusAt: new Date()
        };
        const updatedProduct = await CartOrderProductsModel.findByIdAndUpdate(orderProduct._id, updateProductStatus, { new: true });

        if (!updatedProduct) {
            return controller.sendErrorResponse(res, 200, { message: 'Failed to update product status. Please try again later.' });
        }

        const updateOrderStatus: Partial<CartOrderProps> = {};
        if (orderProduct.orderProductStatus === orderProductStatusJson.delivered) {
            const otherProductsDelivered = orderProducts.filter(product => product._id.toString() !== orderProductId).every(product => product.orderProductStatus === orderProductStatusJson.delivered);
            if (otherProductsDelivered) {
                updateOrderStatus.orderStatus = orderStatusArrayJason.delivered;
                updateOrderStatus.deliveredStatusAt = new Date();
            } else {
                updateOrderStatus.orderStatus = orderStatusArrayJason.partiallyDelivered;
                updateOrderStatus.partiallyDeliveredStatusAt = new Date();
            }
        } else if (orderProduct.orderProductStatus === orderProductStatusJson.shipped) {
            const otherProductsShipped = orderProducts.filter(product => product._id.toString() !== orderProductId).every(product => product.orderProductStatus === orderProductStatusJson.shipped);
            if (otherProductsShipped) {
                updateOrderStatus.orderStatus = orderStatusArrayJason.shipped;
                updateOrderStatus.shippedStatusAt = new Date();
            } else {
                updateOrderStatus.orderStatus = orderStatusArrayJason.partiallyShipped;
                updateOrderStatus.partiallyShippedStatusAt = new Date();
            }
        }

        if (Object.keys(updateOrderStatus).length > 0) {
            await CartOrdersModel.findByIdAndUpdate(orderProduct.cartId, updateOrderStatus);
        }

    }
    async orderProductReturnStatusChange(req: Request, res: Response): Promise<void> {
        try {
            const orderProductId = req.params.id;
            const orderProductDetails = await CartOrderProductsModel.findOne({ _id: new mongoose.Types.ObjectId(orderProductId) });
            if (!orderProductDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'Your order product not found!' });
            }
            if (orderProductDetails.orderProductStatus !== orderProductStatusJson.delivered) {
                return controller.sendErrorResponse(res, 200, { message: `You cant change to this status without delivered product` });
            }

            if (orderProductDetails.quantity < orderProductDetails.orderRequestedProductQuantity) {
                return controller.sendErrorResponse(res, 200, { message: `You cant change quantity out of ${orderProductDetails.quantity}` });
            }

            const orderDetails: any = await CartOrdersModel.findOne({ _id: orderProductDetails.cartId });
            if (!orderDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'Your order not found!' });
            }

            const { quantityChange, newStatus } = req.body;
            if (!newStatus) {
                return controller.sendErrorResponse(res, 200, { message: 'Invalid order return status!' });
            }

            const currentStatus = quantityChange ? orderProductDetails.orderRequestedProductQuantityStatus : orderProductDetails.orderProductReturnStatus;
            const statusJson = quantityChange ? orderProductReturnQuantityStatusJson : orderProductReturnStatusJson;
            if (currentStatus === statusJson.refunded) {
                return controller.sendErrorResponse(res, 200, { message: 'No further status changes are allowed once the product is refunded.' });
            }
            if (!newStatus) {
                return controller.sendErrorResponse(res, 200, { message: 'Invalid order return status!' });
            }
            if (currentStatus === newStatus) {
                return controller.sendErrorResponse(res, 200, { message: 'This status has already been applied. Please choose a different status.' });
            }
            if (newStatus === statusJson.received && currentStatus !== statusJson.approved) {
                return controller.sendErrorResponse(res, 200, { message: 'The item must be approved before it can be received.' });
            }
            if (newStatus === statusJson.refunded && currentStatus !== statusJson.received) {
                return controller.sendErrorResponse(res, 200, { message: 'The item can only be refunded after it has been received.' });
            }
            let updateVariantProductQuantity = null;
            let orderUpdateFields: any = {};
            const orderProductUpdateFields: any = {
                [quantityChange ? 'orderRequestedProductQuantityStatus' : 'orderProductReturnStatus']: newStatus,
                [quantityChange ? 'orderRequestedProductQuantityStatusAt' : 'orderProductReturnStatusAt']: new Date(),
            };
            if (newStatus === statusJson.approved) {
                orderProductUpdateFields[quantityChange ? 'orderProductReturnQuantityApprovedStatusAt' : 'orderProductReturnApprovedStatusAt'] = new Date();
            } else if (newStatus === statusJson.refunded) {
                orderProductUpdateFields[quantityChange ? 'orderProductReturnQuantityRefundStatusAt' : 'orderProductReturnRefundStatusAt'] = new Date();
                const newQuantity = orderProductDetails.orderRequestedProductQuantity;
                const perUnitPrice = orderProductDetails.productAmount / orderProductDetails.quantity;
                orderProductUpdateFields['returnedProductAmount'] = quantityChange ? newQuantity * perUnitPrice : orderProductDetails.productAmount;
                orderUpdateFields['totalReturnedProductAmount'] = quantityChange ? (orderDetails?.totalReturnedProductAmount || 0) + (newQuantity * perUnitPrice) : (orderDetails?.totalReturnedProductAmount || 0) + orderProductDetails.productAmount;
                orderProductUpdateFields['orderProductStatus'] = orderProductStatusJson.canceled;
            } else if (newStatus === statusJson.received) {
                orderProductUpdateFields[quantityChange ? 'orderProductReturnQuantityReceivedStatusAt' : 'orderProductReturnReceivedStatusAt'] = new Date();
                if (!quantityChange) {
                    updateVariantProductQuantity = orderProductDetails.quantity;
                } else {
                    updateVariantProductQuantity = orderProductDetails.orderRequestedProductQuantity;
                }
            } else if (newStatus === statusJson.rejected) {
                orderProductUpdateFields[quantityChange ? 'orderProductReturnQuantityRejectedStatusAt' : 'orderProductReturnRejectedStatusAt'] = new Date();
            }

            const updatedOrderProductDetails = await CartOrderProductsModel.findByIdAndUpdate(orderProductDetails._id, orderProductUpdateFields);
            if (!updatedOrderProductDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'Something went wrong please try again.' });
            }
            if (orderUpdateFields && orderUpdateFields?.totalReturnedProductAmount) {
                await CartOrdersModel.findOneAndUpdate(orderDetails._id, orderUpdateFields)
            }

            if (newStatus === statusJson.approved || newStatus === statusJson.rejected || newStatus === statusJson.refunded || newStatus === statusJson.received) {
                const productDetails = await ProductsModel.aggregate(productDetailsWithVariant({ 'productvariants._id': orderProductDetails.variantId }))
                if (newStatus === statusJson.received && updateVariantProductQuantity) {
                    await ProductVariantsModel.findOneAndUpdate(orderProductDetails.variantId, { quantity: (productDetails[0].productvariants.quantity + (orderProductDetails.quantity - updateVariantProductQuantity)) });
                }

                if (productDetails && productDetails?.length > 0) {
                    const customerDetails = await CustomerModel.findOne({ _id: orderDetails.customerId });
                    if (customerDetails) {
                        let query: any = { _id: { $exists: true } };
                        query = {
                            ...query,
                            countryId: orderDetails.countryId,
                            block: websiteSetup.basicSettings,
                            blockReference: { $in: [blockReferences.defualtSettings, blockReferences.basicDetailsSettings, blockReferences.socialMedia, blockReferences.appUrls] },
                            status: '1',
                        } as any;

                        const settingsDetails = await WebsiteSetupModel.find(query);
                        const basicDetailsSettings = settingsDetails?.find((setting: any) => setting.blockReference === blockReferences.basicDetailsSettings)?.blockValues;
                        const socialMedia = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.socialMedia)?.blockValues;
                        const appUrls = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.appUrls)?.blockValues;

                        ejs.renderFile(path.join(__dirname, '../../../views/email/order/order-product-status-change.ejs'), {
                            firstName: customerDetails?.firstName,
                            orderId: orderDetails.orderId,
                            content: `Your order for the product "${productDetails[0].productvariants.extraProductTitle !== '' ? productDetails[0].productvariants.extraProductTitle : productDetails[0].productTitle}" has been updated to the status: ${orderReturnStatusMessages[newStatus]}.`,
                            subject: orderReturnStatusMessages[newStatus],
                            storeEmail: basicDetailsSettings?.storeEmail,
                            shopName: basicDetailsSettings?.shopName || `${process.env.SHOPNAME}`,
                            shopLogo: `${process.env.SHOPLOGO}`,
                            shopDescription: convert(basicDetailsSettings?.shopDescription, { wordwrap: 130, }),
                            appUrl: `${process.env.APPURL}`,
                            socialMedia,
                            appUrls,
                        }, async (err: any, template: any) => {
                            const customerEmail = customerDetails.isGuest ? (customerDetails.guestEmail !== '' ? customerDetails.guestEmail : customerDetails?.email) : customerDetails?.email
                            if (err) {
                                console.log(err);
                                return;
                            }
                            if (process.env.SHOPNAME === 'Timehouse') {
                                await mailChimpEmailGateway({
                                    subject: orderReturnStatusMessages[newStatus],
                                    email: customerEmail
                                }, template)

                            } else if (process.env.SHOPNAME === 'Homestyle') {
                                const sendEmail = await smtpEmailGateway({
                                    subject: orderReturnStatusMessages[newStatus],
                                    email: customerEmail,
                                }, template)

                            }
                            else if (process.env.SHOPNAME === 'Beyondfresh') {
                                const sendEmail = await smtpEmailGateway({
                                    subject: orderReturnStatusMessages[newStatus],
                                    email: customerEmail,
                                }, template)
                            }
                            else if (process.env.SHOPNAME === 'Smartbaby') {
                                const sendEmail = await smtpEmailGateway({
                                    subject: orderReturnStatusMessages[newStatus],
                                    email: customerEmail,
                                }, template)
                            }
                        });
                    }

                }
            }

            const updatedOrderDetails: any = await OrderService.OrderList({
                query: {
                    _id: orderProductDetails.cartId
                },
                getAddress: '1',
                getCartProducts: '1',
                hostName: req.get('origin'),
            })

            if (updatedOrderDetails && updatedOrderDetails?.length > 0) {
                return controller.sendSuccessResponse(res, {
                    requestedData: updatedOrderDetails[0],
                    message: 'Your Order is ready!'
                });
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Order not fount'
                });
            }
        } catch (error: any) {
            console.log('error', error);

            return controller.sendErrorResponse(res, 500, {
                message: 'Order not fount'
            });
        }
    }

    async orderProductReturnQuantityChange(req: Request, res: Response): Promise<void> {
        try {
            const orderProductId = req.params.id;
            const { changedQuantity, newStatus } = req.body;

            const orderProductDetails = await CartOrderProductsModel.findOne({ _id: new mongoose.Types.ObjectId(orderProductId) });
            if (!orderProductDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'Your order product not found!' });
            }
            if (orderProductDetails.orderProductStatus !== orderProductStatusJson.pending) {
                return controller.sendErrorResponse(res, 200, { message: `You cant change to this status without pending product` });
            }

            if (changedQuantity >= orderProductDetails.quantity) {
                return controller.sendErrorResponse(res, 200, { message: `Changed quantity cannot be greater than or equal to the original quantity` });
            }

            const orderDetails: any = await CartOrdersModel.findOne({ _id: orderProductDetails.cartId });
            if (!orderDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'Your order not found!' });
            }

            let orderUpdateFields: any = {};
            const orderProductUpdateFields: any = {
                ['changedQuantity']: changedQuantity,
                ['changedQuantityStatusAt']: new Date(),
            };

            const perUnitPrice = orderProductDetails.productAmount / orderProductDetails.quantity;
            orderProductUpdateFields['returnedProductAmount'] = changedQuantity * perUnitPrice;
            orderUpdateFields['totalReturnedProductAmount'] = (orderDetails?.totalReturnedProductAmount || 0) + (changedQuantity * perUnitPrice);

            const updatedOrderProductDetails = await CartOrderProductsModel.findByIdAndUpdate(orderProductDetails._id, orderProductUpdateFields);
            if (!updatedOrderProductDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'Something went wrong please try again.' });
            }
            if (orderUpdateFields && orderUpdateFields?.totalReturnedProductAmount) {
                await CartOrdersModel.findOneAndUpdate(orderDetails._id, orderUpdateFields)
            }
            const productDetails = await ProductsModel.aggregate(productDetailsWithVariant({ 'productvariants._id': orderProductDetails.variantId }));
            if (productDetails && productDetails?.length > 0) {
                if (orderProductDetails.changedQuantity === 0) {
                    await ProductVariantsModel.findOneAndUpdate(orderProductDetails.variantId, { quantity: (((productDetails[0].productvariants.quantity) + (orderProductDetails.quantity - changedQuantity))) });
                }

                const customerDetails = await CustomerModel.findOne({ _id: orderDetails.customerId });
                if (customerDetails) {
                    let query: any = { _id: { $exists: true } };
                    query = {
                        ...query,
                        countryId: orderDetails.countryId,
                        block: websiteSetup.basicSettings,
                        blockReference: { $in: [blockReferences.defualtSettings, blockReferences.basicDetailsSettings, blockReferences.socialMedia, blockReferences.appUrls] },
                        status: '1',
                    } as any;

                    const settingsDetails = await WebsiteSetupModel.find(query);
                    const basicDetailsSettings = settingsDetails?.find((setting: any) => setting.blockReference === blockReferences.basicDetailsSettings)?.blockValues;
                    const socialMedia = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.socialMedia)?.blockValues;
                    const appUrls = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.appUrls)?.blockValues;

                    ejs.renderFile(path.join(__dirname, '../../../views/email/order/order-product-status-change.ejs'), {
                        firstName: customerDetails?.firstName,
                        orderId: orderDetails.orderId,
                        content: `Your order for the product "${productDetails[0].productvariants.extraProductTitle !== '' ? productDetails[0].productvariants.extraProductTitle : productDetails[0].productTitle}" has been quantity changed to: ${changedQuantity}.`,
                        subject: orderReturnStatusMessages[newStatus],
                        storeEmail: basicDetailsSettings?.storeEmail,
                        shopName: basicDetailsSettings?.shopName || `${process.env.SHOPNAME}`,
                        shopLogo: `${process.env.SHOPLOGO}`,
                        shopDescription: convert(basicDetailsSettings?.shopDescription, { wordwrap: 130, }),
                        appUrl: `${process.env.APPURL}`,
                        socialMedia,
                        appUrls,
                    }, async (err: any, template: any) => {
                        const customerEmail = customerDetails.isGuest ? (customerDetails.guestEmail !== '' ? customerDetails.guestEmail : customerDetails?.email) : customerDetails?.email
                        if (err) {
                            console.log(err);
                            return;
                        }
                        if (process.env.SHOPNAME === 'Timehouse') {
                            await mailChimpEmailGateway({
                                subject: orderReturnStatusMessages[newStatus],
                                email: customerEmail
                            }, template)

                        } else if (process.env.SHOPNAME === 'Homestyle') {
                            const sendEmail = await smtpEmailGateway({
                                subject: orderReturnStatusMessages[newStatus],
                                email: customerEmail,
                            }, template)

                        }
                        else if (process.env.SHOPNAME === 'Beyondfresh') {
                            const sendEmail = await smtpEmailGateway({
                                subject: orderReturnStatusMessages[newStatus],
                                email: customerEmail,
                            }, template)
                        }
                        else if (process.env.SHOPNAME === 'Smartbaby') {
                            const sendEmail = await smtpEmailGateway({
                                subject: orderReturnStatusMessages[newStatus],
                                email: customerEmail,
                            }, template)
                        }
                    });
                }
            }

            const updatedOrderDetails: any = await OrderService.OrderList({
                query: {
                    _id: orderProductDetails.cartId
                },
                getAddress: '1',
                getCartProducts: '1',
                hostName: req.get('origin'),
            })

            if (updatedOrderDetails && updatedOrderDetails?.length > 0) {
                return controller.sendSuccessResponse(res, {
                    requestedData: updatedOrderDetails[0],
                    message: 'Your Order is ready!'
                });
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Order not fount'
                });
            }
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, {
                message: 'Order not fount'
            });
        }
    }

    async orderStatusChange(req: Request, res: Response): Promise<void> {
        try {
            const orderId = req.params.id;
            const orderStatus = req.body.orderStatus;
            const isValidStatus = orderStatusArray.some(status => status.value === orderStatus);
            if (!isValidStatus) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Invalid order status'
                });
            }
            const orderDetails: any = await CartOrdersModel.findById(orderId)
            if (!orderDetails) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Order not fount'
                });
            }
            // Ensure that the order cannot go back to a previous status once delivered
            if (orderDetails.orderStatus === orderStatusArrayJason.delivered && [
                orderStatusArrayJason.pending,
                orderStatusArrayJason.processing,
                orderStatusArrayJason.packed,
                orderStatusArrayJason.shipped,
                orderStatusArrayJason.partiallyShipped,
                orderStatusArrayJason.onHold,
                orderStatusArrayJason.pickup
            ].includes(orderStatus)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Cannot change the status back to a previous state once delivered'
                });
            }
            // Ensure that the order cannot be changed to Canceled after Delivered
            if (orderDetails.orderStatus === orderStatusArrayJason.delivered && orderStatus === orderStatusArrayJason.canceled) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Cannot change the status to Canceled once delivered'
                });
            }
            // Ensure that Returned status is only possible after Delivered
            if (orderStatus === orderStatusArrayJason.returned && orderDetails.orderStatus !== orderStatusArrayJason.delivered) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Returned status is only possible after Delivered'
                });
            }
            // Ensure that Refunded status is only possible after Returned
            if (orderStatus === orderStatusArrayJason.refunded && orderDetails.orderStatus !== orderStatusArrayJason.returned) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Refunded status is only possible after Returned'
                });
            }
            // Ensure that Completed status is only possible after Delivered
            if (orderStatus === orderStatusArrayJason.completed && orderDetails.orderStatus !== orderStatusArrayJason.delivered) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Completed status is only possible after Delivered'
                });
            }
            // Ensure that the order cannot be changed from Completed to any other status
            if (orderDetails.orderStatus === orderStatusArrayJason.completed) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Cannot change the status once it is completed'
                });
            }
            // Ensure that the order cannot be changed from Failed
            if (orderDetails.orderStatus === orderStatusArrayJason.failed) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Cannot change the status once it is failed'
                });
            }
            // Ensure that the order cannot be changed from Refunded
            if (orderDetails.orderStatus === orderStatusArrayJason.refunded) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Cannot change the status once it is refunded'
                });
            }
            let customerDetails: any = null;
            if (orderDetails.customerId) {
                customerDetails = await CustomerService.findOne({ _id: orderDetails?.customerId });
                if (orderStatus === orderStatusArrayJason.completed && customerDetails) {
                    await OrderService.orderWalletAmountTransactions(orderStatus, orderDetails, customerDetails);
                }
            }
            orderDetails.orderStatus = orderStatus;
            // Update cart status if the order status is Completed or Delivered
            if (orderStatus === orderStatusArrayJason.completed || orderStatus === orderStatusArrayJason.delivered) {
                orderDetails.cartStatus = cartStatusJson.delivered;
            }
            const currentDate = new Date();
            switch (orderStatus) {
                case orderStatusArrayJason.pending: orderDetails.orderStatusAt = currentDate; break;
                case orderStatusArrayJason.processing: orderDetails.processingStatusAt = currentDate; break;
                case orderStatusArrayJason.packed: orderDetails.packedStatusAt = currentDate; break;
                case orderStatusArrayJason.shipped: orderDetails.shippedStatusAt = currentDate; break;
                case orderStatusArrayJason.delivered: orderDetails.deliveredStatusAt = currentDate; break;
                case orderStatusArrayJason.canceled: orderDetails.canceledStatusAt = currentDate; break;
                case orderStatusArrayJason.returned: orderDetails.returnedStatusAt = currentDate; break;
                case orderStatusArrayJason.refunded: orderDetails.refundedStatusAt = currentDate; break;
                case orderStatusArrayJason.partiallyShipped: orderDetails.partiallyShippedStatusAt = currentDate; break;
                case orderStatusArrayJason.onHold: orderDetails.onHoldStatusAt = currentDate; break;
                case orderStatusArrayJason.failed: orderDetails.failedStatusAt = currentDate; break;
                case orderStatusArrayJason.completed: orderDetails.completedStatusAt = currentDate; break;
                case orderStatusArrayJason.pickup: orderDetails.pickupStatusAt = currentDate; break;
                case orderStatusArrayJason.partiallyDelivered: orderDetails.partiallyDeliveredStatusAt = currentDate; break;
                default: break;
            }

            const updatedOrderDetails: any = await OrderService.orderStatusUpdate(orderDetails._id, orderDetails, '1');
            if (!updatedOrderDetails) {
                return controller.sendErrorResponse(res, 500, {
                    message: 'Something went wrong!'
                });
            }
            await CartOrderProductsModel.updateMany(
                { cartId: orderDetails._id },
                {
                    $set: {
                        orderProductStatus: orderStatus,
                        orderProductStatusAt: currentDate
                    }
                }
            );
            if (orderStatus === orderStatusArrayJason.failed || orderStatus === orderStatusArrayJason.returned) {
                const cartProducts = await CartOrderProductsModel.find({ cartId: orderDetails._id }).select('variantId quantity');
                const updateProductVariant: any = cartProducts.map((products: any) => ({
                    updateOne: {
                        filter: { _id: products.variantId },
                        update: { $inc: { quantity: products.quantity } },
                    }
                }));
                await ProductVariantsModel.bulkWrite(updateProductVariant);
            }
            if (orderStatus === orderStatusArrayJason.shipped || orderStatus === orderStatusArrayJason.delivered) {
                let query: any = { _id: { $exists: true } };
                query = {
                    ...query,
                    countryId: orderDetails.countryId,
                    block: websiteSetup.basicSettings,
                    blockReference: { $in: [blockReferences.defualtSettings, blockReferences.basicDetailsSettings, blockReferences.socialMedia, blockReferences.appUrls] },
                    status: '1',
                } as any;

                const settingsDetails = await WebsiteSetupModel.find(query);
                const defualtSettings = settingsDetails?.find((setting: any) => setting.blockReference === blockReferences.defualtSettings);
                const basicDetailsSettings = settingsDetails?.find((setting: any) => setting.blockReference === blockReferences.basicDetailsSettings)?.blockValues;
                const socialMedia = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.socialMedia)?.blockValues;
                const appUrls = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.appUrls)?.blockValues;

                let commonDeliveryDays = '8';
                if (defualtSettings && defualtSettings.blockValues && defualtSettings.blockValues.commonDeliveryDays) {
                    commonDeliveryDays = defualtSettings.blockValues.commonDeliveryDays
                }
                const tax = await TaxsModel.findOne({ countryId: orderDetails.countryId, status: "1" })

                const expectedDeliveryDate = calculateExpectedDeliveryDate(orderDetails.orderStatusAt, Number(commonDeliveryDays))
                ejs.renderFile(path.join(__dirname, '../../../views/email/order', orderStatus === '4' ? 'order-shipping-email.ejs' : 'order-delivered-email.ejs'), {
                    firstName: customerDetails?.firstName,
                    orderId: orderDetails.orderId,
                    totalAmount: orderDetails.totalAmount,
                    totalShippingAmount: orderDetails.totalShippingAmount,
                    totalProductAmount: orderDetails.totalProductAmount,
                    expectedDeliveryDate: expectedDeliveryDate,
                    storeEmail: basicDetailsSettings?.storeEmail,
                    products: updatedOrderDetails.products,
                    shopName: basicDetailsSettings?.shopName || `${process.env.SHOPNAME}`,
                    shopLogo: `${process.env.SHOPLOGO}`,
                    shopDescription: convert(basicDetailsSettings?.shopDescription, { wordwrap: 130, }),
                    appUrl: `${process.env.APPURL}`,
                    socialMedia,
                    appUrls,
                    tax: tax
                }, async (err: any, template: any) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    if (process.env.SHOPNAME === 'Timehouse') {
                        await mailChimpEmailGateway({
                            subject: orderStatusMessages[orderStatus],
                            email: customerDetails?.email,
                        }, template)

                    } else if (process.env.SHOPNAME === 'Homestyle') {
                        const sendEmail = await smtpEmailGateway({
                            subject: orderStatusMessages[orderStatus],
                            email: customerDetails?.email,
                        }, template)

                    }
                    else if (process.env.SHOPNAME === 'Beyondfresh') {
                        const sendEmail = await smtpEmailGateway({
                            subject: orderStatusMessages[orderStatus],
                            email: customerDetails?.email,
                        }, template)
                    }
                    else if (process.env.SHOPNAME === 'Smartbaby') {
                        const sendEmail = await smtpEmailGateway({
                            subject: orderStatusMessages[orderStatus],
                            email: customerDetails?.email,
                        }, template)
                    }
                });
            }
            // console.log('aaaaaaaa', updatedOrderDetails);

            return controller.sendSuccessResponse(res, {
                requestedData: updatedOrderDetails,
                message: orderStatusMessages[orderStatus] || 'Order status updated successfully!'
            });
        } catch (error: any) {
            console.log('error', error);

            return controller.sendErrorResponse(res, 500, {
                message: 'Order not fount'
            });
        }
    }

    async getInvoice(req: Request, res: Response): Promise<void> {
        try {
            const orderId = req.params.id;

            const orderDetails: any = await OrderService.OrderList({
                query: {
                    _id: new mongoose.Types.ObjectId(orderId)
                },
                getAddress: '1',
                getCartProducts: '1',
                hostName: req.get('origin'),
            });
            if (orderDetails && orderDetails.length > 0) {
                let websiteSettingsQuery: any = { _id: { $exists: true } };
                websiteSettingsQuery = {
                    ...websiteSettingsQuery,
                    countryId: orderDetails[0].country._id,
                    block: websiteSetup.basicSettings,
                    blockReference: { $in: [blockReferences.defualtSettings, blockReferences.basicDetailsSettings, blockReferences.socialMedia] },
                    status: '1',
                } as any;

                const settingsDetails = await WebsiteSetupModel.find(websiteSettingsQuery);
                if (!settingsDetails) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Settings details not fount'
                    });
                }
                const defualtSettings = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.defualtSettings);
                const basicDetailsSettings = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.basicDetailsSettings)?.blockValues;

                if (!basicDetailsSettings) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Basic details settings not fount'
                    });
                }

                let commonDeliveryDays = '6';
                if (defualtSettings && defualtSettings.blockValues && defualtSettings.blockValues.commonDeliveryDays) {
                    commonDeliveryDays = defualtSettings.blockValues.commonDeliveryDays
                }
                const tax = await TaxsModel.findOne({ countryId: orderDetails[0].country._id, status: "1" })
                const currencyCode = await CountryModel.findOne({ _id: orderDetails[0].country._id }, 'currencyCode')

                const expectedDeliveryDate = calculateExpectedDeliveryDate(orderDetails[0].orderStatusAt, Number(commonDeliveryDays))

                ejs.renderFile(path.join(__dirname, '../../../views/order', 'invoice-pdf.ejs'),
                    {
                        orderDetails: orderDetails[0],
                        expectedDeliveryDate,
                        storeEmail: basicDetailsSettings?.storeEmail,
                        storePhone: basicDetailsSettings?.storePhone,
                        storeAppartment: basicDetailsSettings?.storeAppartment,
                        storeStreet: basicDetailsSettings?.storeStreet,
                        storeCity: basicDetailsSettings?.storeCity,
                        storeState: basicDetailsSettings?.storeState,
                        storePostalCode: basicDetailsSettings?.storePostalCode,
                        shopName: basicDetailsSettings?.shopName || `${process.env.SHOPNAME}`,
                        shopLogo: `${process.env.SHOPLOGO}`,
                        appUrl: `${process.env.APPURL}`,
                        tax: tax,
                        currencyCode: currencyCode?.currencyCode
                    },
                    async (err: any, html: any) => {
                        if (err) {
                            return controller.sendErrorResponse(res, 200, {
                                message: 'Error generating invoice'
                            });
                        }
                        await pdfGenerator({ html, res })
                    });
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Order not fount'
                });
            }
        } catch (error) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Error generating invoice'
            });
        }
    }

}

export default new OrdersController();

