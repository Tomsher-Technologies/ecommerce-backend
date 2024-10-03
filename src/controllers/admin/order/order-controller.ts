import 'module-alias/register';
import { Request, Response } from 'express';
import mongoose from 'mongoose';

import { calculateExpectedDeliveryDate, dateConvertPm, getCountryId } from '../../../utils/helpers';

import BaseController from '../../../controllers/admin/base-controller';
import OrderService from '../../../services/admin/order/order-service'

import { productDetailsWithVariant } from '../../../utils/config/product-config';
import { OrderQueryParams } from '../../../utils/types/order';
import { exportOrderReport } from '../../../utils/admin/excel/reports';
import { bulkInvoicePDFExport, findOrderStatusDateCheck, invoicePdfGenerator, orderProductCancelStatusChangeEmail, orderProductReturnQuantityChangeEmail, orderProductReturnStatusChangeEmail, orderProductStatusChangeEmail, orderStatusChangeEmail } from '../../../utils/admin/order';
import { cartStatus as cartStatusJson, deliveryTypesJson, orderProductCancelStatusJson, orderProductCancelStatusMessages, orderProductReturnQuantityStatusJson, orderProductReturnStatusJson, orderProductStatusJson, orderProductStatussMessages, orderReturnStatusMessages, orderStatusArray, orderStatusArrayJson, orderStatusMap, orderStatusMessages } from '../../../constants/cart';
import { blockReferences, websiteSetup } from '../../../constants/website-setup';
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../../constants/admin/task-log';
import { pdfGenerator } from '../../../lib/pdf/pdf-generator';

import CustomerService from '../../../services/frontend/customer-service';
import WebsiteSetupModel from '../../../model/admin/setup/website-setup-model';
import CartOrdersModel, { CartOrderProps } from '../../../model/frontend/cart-order-model';
import CartOrderProductsModel from '../../../model/frontend/cart-order-product-model';
import TaxsModel from '../../../model/admin/setup/tax-model';
import ProductVariantsModel from '../../../model/admin/ecommerce/product/product-variants-model';
import CountryModel from '../../../model/admin/setup/country-model';
import CustomerModel from '../../../model/frontend/customers-model';
import ProductsModel from '../../../model/admin/ecommerce/product-model';
import { collections } from '../../../constants/collections';
import GeneralService from '../../../services/admin/general-service';
import AdminTaskLogModel from '../../../model/admin/task-log';

const controller = new BaseController();

class OrdersController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, cartStatus = '', sortby = '', sortorder = '', keyword = '', countryId = '', customerId = '', pickupStoreId = '', paymentMethodId = '', couponId = '', cityId = '', stateId = '', fromDate, endDate, isExcel, isPdfExport, orderStatus = '', deliveryType } = req.query as OrderQueryParams;
            let query: any = { _id: { $exists: true } };

            const userData = await res.locals.user;

            const country = getCountryId(userData);
            query = { cartStatus: { $ne: cartStatusJson.active } }
            if (country) {
                query.countryId = country;
            } else if (countryId) {
                query.countryId = new mongoose.Types.ObjectId(countryId)
            }

            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { orderId: keywordRegex },
                        { 'country.countryShortTitle': keywordRegex },
                        { 'country.countryTitle': keywordRegex },
                        { 'customer.firstName': keywordRegex },
                        { 'customer.email': keywordRegex },
                        { 'paymentMethod.paymentMethodTitle': keywordRegex },
                    ],
                    ...query
                } as any;
            }
            if (customerId) {
                query = {
                    ...query, customerId: new mongoose.Types.ObjectId(customerId)
                } as any;
            }

            if (orderStatus) {
                query = {
                    ...query, orderStatus: orderStatus
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
            if (deliveryType === deliveryTypesJson.shipping) {
                query = {
                    ...query, pickupStoreId: null
                } as any;
            }
            if (deliveryType === deliveryTypesJson.pickupFromSrore) {
                query = {
                    ...query, pickupStoreId: { $ne: null }
                } as any;
            }
            if (stateId) {
                query = {
                    ...query, stateId: new mongoose.Types.ObjectId(stateId)
                } as any;
            }

            if (cityId) {
                query = {
                    ...query, cityId: new mongoose.Types.ObjectId(cityId)
                } as any;
            }


            if (fromDate || endDate) {
                const dateFilter: { $gte?: Date; $lte?: Date } = {};

                if (fromDate) dateFilter.$gte = new Date(fromDate);
                if (endDate) dateFilter.$lte = dateConvertPm(endDate);

                if (orderStatus) {
                    const statusField = findOrderStatusDateCheck(orderStatusMap[orderStatus].value);
                    query[statusField] = { ...dateFilter };
                }
            }

            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            if (isExcel !== '1') {
                const orders: any = await OrderService.OrderList({
                    page: parseInt(page_size as string),
                    limit: parseInt(limit as string),
                    query,
                    sort,
                    getCartProducts: '1',
                    getAddress: '1',
                    hostName: req.get('origin'),
                });

                if (orders.length > 0 && isPdfExport == '1') {
                    let websiteSettingsQuery: any = { _id: { $exists: true } };
                    websiteSettingsQuery = {
                        ...websiteSettingsQuery,
                        countryId: orders[0].country._id,
                        block: websiteSetup.basicSettings,
                        blockReference: { $in: [blockReferences.defualtSettings, blockReferences.basicDetailsSettings, blockReferences.socialMedia] },
                        status: '1',
                    } as any;

                    const settingsDetails = await WebsiteSetupModel.find(websiteSettingsQuery);
                    if (!settingsDetails) {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Settings details not found'
                        });
                    }

                    const defualtSettings = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.defualtSettings);
                    const basicDetailsSettings = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.basicDetailsSettings)?.blockValues;

                    if (!basicDetailsSettings) {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Basic details settings not found'
                        });
                    }

                    let commonDeliveryDays = '6';
                    if (defualtSettings && defualtSettings.blockValues && defualtSettings.blockValues.commonDeliveryDays) {
                        commonDeliveryDays = defualtSettings.blockValues.commonDeliveryDays;
                    }
                    const htmlArray: any[] = [];
                    for (const order of orders) {
                        const tax = await TaxsModel.findOne({ countryId: order.country._id, status: "1" });
                        const currencyCode = await CountryModel.findOne({ _id: order.country._id }, 'currencyCode');
                        await bulkInvoicePDFExport(htmlArray, order, basicDetailsSettings, tax, currencyCode?.currencyCode, commonDeliveryDays)
                    }
                    await pdfGenerator({
                        html: htmlArray,
                        res,
                        preview: req.query.preview || '0',
                        bulkExport: true
                    });
                } else {
                    const totalCount = await OrderService.OrderList({
                        page: parseInt(page_size as string),
                        query,
                        getTotalCount: true
                    })
                    return controller.sendSuccessResponse(res, {
                        requestedData: orders,
                        totalCount: totalCount.length,
                        message: 'Success!'
                    }, 200);
                }
            } else {
                const orderData: any = await OrderService.orderListExcelExport({
                    page: parseInt(page_size as string),
                    limit: parseInt(limit as string),
                    query,
                    sort
                });

                if (orderData.orders && orderData.orders.length > 0) {
                    await exportOrderReport(res, orderData.orders, orderData)
                } else {
                    return controller.sendErrorResponse(res, 200, { message: 'Order Data not found' });
                }
            }


        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching order' });
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
            // 'cartDetails.orderStatus': orderProductStatusJson.delivered,
            'cartDetails.cartStatus': { $ne: cartStatusJson.active },
            $or: [
                { orderRequestedProductQuantity: { $exists: true, $gt: 0 } },
                { orderRequestedProductQuantityStatus: { $exists: true, $ne: "0" } },
                { orderProductReturnStatus: { $exists: true, $ne: "0" } },
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

        if (Number(orderProduct.orderProductStatus) > Number(orderProductStatusJson.delivered)) {
            return controller.sendErrorResponse(res, 200, { message: 'Status can only be changed to a value before "Delivered".' });
        }
        const orderDetails = await CartOrdersModel.findById(orderProduct.cartId);
        if (!orderDetails) {
            return controller.sendErrorResponse(res, 200, { message: 'Order not found!' });
        }
        // if (Number(orderDetails.orderStatus) > Number(orderStatusArrayJson.delivered)) {
        //     return controller.sendErrorResponse(res, 200, { message: 'Cannot change status for an order with status before "Delivered".' });
        // }
        if (!newStatus || !Object.values(orderProductStatusJson).includes(newStatus)) {
            return controller.sendErrorResponse(res, 200, { message: 'Invalid status provided.' });
        }

        if ((Number(orderProduct.orderProductStatus) < Number(orderProductStatusJson.delivered)) && (newStatus === orderProductStatusJson.returned || newStatus === orderProductStatusJson.refunded)) {
            return controller.sendErrorResponse(res, 200, { message: 'Status can only be changed to a value after "Delivered"' });
        }

        let updateProductStatus: any = {
            orderProductStatus: newStatus,
            orderProductStatusAt: new Date()
        };
        const updateOrderStatus: Partial<CartOrderProps> = {};
        if (newStatus === orderProductStatusJson.canceled) {
            if (orderProduct.orderProductStatus !== orderProductStatusJson.pending) {
                return controller.sendErrorResponse(res, 200, { message: 'Pending products only to change cancelled status.' });
            } else {
                updateProductStatus = {
                    ...updateProductStatus,
                    orderRequestedProductCancelStatus: orderProductCancelStatusJson.pending,
                    orderRequestedProductCancelStatusAt: new Date()
                }
            }
        } else if (newStatus === orderProductStatusJson.returned) {
            updateProductStatus = {
                ...updateProductStatus,
                orderProductReturnStatus: orderProductReturnStatusJson.pending,
                orderProductReturnStatusAt: new Date()
            }
        } else if (newStatus === orderProductStatusJson.refunded) {
            updateOrderStatus.totalReturnedProductAmount = ((orderDetails.totalReturnedProductAmount + orderProduct.productAmount) || 0);
            updateProductStatus = {
                ...updateProductStatus,
                returnedProductAmount: orderProduct.productAmount,
                ...(orderProduct.orderProductStatus === orderProductStatusJson.canceled ? {
                    orderRequestedProductCancelStatus: orderProductCancelStatusJson.refunded,
                    orderRequestedProductCancelStatusAt: new Date()
                } : {})
            }
        }
        const updatedProduct: any = await CartOrderProductsModel.findByIdAndUpdate(orderProduct._id, updateProductStatus, { new: true });

        if (!updatedProduct) {
            return controller.sendErrorResponse(res, 200, { message: 'Failed to update product status. Please try again later.' });
        }
        if (orderProducts.length > 1) {
            const allProductsInOrder = await CartOrderProductsModel.find({ cartId: updatedProduct.cartId });
            if (updatedProduct.orderProductStatus === orderProductStatusJson.delivered) {
                const otherProductsDelivered = allProductsInOrder.filter((product: any) => product._id.toString() !== orderProductId).every((product: any) => product.orderProductStatus === orderProductStatusJson.delivered);
                if (otherProductsDelivered) {
                    updateOrderStatus.orderStatus = orderStatusArrayJson.delivered;
                    updateOrderStatus.deliveredStatusAt = new Date();
                } else {
                    updateOrderStatus.orderStatus = orderStatusArrayJson.partiallyDelivered;
                    updateOrderStatus.partiallyDeliveredStatusAt = new Date();
                }
            } else if (updatedProduct.orderProductStatus === orderProductStatusJson.shipped) {
                const otherProductsShipped = allProductsInOrder.filter((product: any) => product._id.toString() !== orderProductId).every((product: any) => product.orderProductStatus === orderProductStatusJson.shipped);
                if (otherProductsShipped) {
                    updateOrderStatus.orderStatus = orderStatusArrayJson.shipped;
                    updateOrderStatus.shippedStatusAt = new Date();
                } else {
                    updateOrderStatus.orderStatus = orderStatusArrayJson.partiallyShipped;
                    updateOrderStatus.partiallyShippedStatusAt = new Date();
                }
            } else if (updatedProduct.orderProductStatus === orderProductStatusJson.canceled) {
                await ProductVariantsModel.findByIdAndUpdate(
                    orderProduct.variantId,
                    { $inc: { quantity: orderProduct.quantity } },
                    { new: true, useFindAndModify: false }
                );
                const otherProductsCanceled = allProductsInOrder.filter((product: any) => product._id.toString() !== orderProductId).every((product: any) => product.orderProductStatus === orderProductStatusJson.canceled);
                if (otherProductsCanceled) {
                    updateOrderStatus.orderStatus = orderStatusArrayJson.canceled;
                    updateOrderStatus.canceledStatusAt = new Date();
                } else {
                    updateOrderStatus.orderStatus = orderStatusArrayJson.partiallyCanceled;
                    updateOrderStatus.partiallyCanceledStatusAt = new Date();
                }
            } else if (updatedProduct.orderProductStatus === orderProductStatusJson.returned) {
                const otherProductsReturned = allProductsInOrder.filter((product: any) => product._id.toString() !== orderProductId).every((product: any) => product.orderProductStatus === orderProductStatusJson.returned);
                if (otherProductsReturned) {
                    updateOrderStatus.orderStatus = orderStatusArrayJson.returned;
                    updateOrderStatus.returnedStatusAt = new Date();
                } else {
                    updateOrderStatus.orderStatus = orderStatusArrayJson.partiallyReturned;
                    updateOrderStatus.partiallyReturnedStatusAt = new Date();
                }


            } else if (updatedProduct.orderProductStatus === orderProductStatusJson.refunded) {
                const otherProductsRefunded = allProductsInOrder.filter((product: any) => product._id.toString() !== orderProductId).every((product: any) => product.orderProductStatus === orderProductStatusJson.refunded);
                if (otherProductsRefunded) {
                    updateOrderStatus.orderStatus = orderStatusArrayJson.refunded;
                    updateOrderStatus.refundedStatusAt = new Date();
                } else {
                    updateOrderStatus.orderStatus = orderStatusArrayJson.partiallyRefunded;
                    updateOrderStatus.partiallyRefundedStatusAt = new Date();
                }
            }
            if (Object.keys(updateOrderStatus).length > 0) {
                await CartOrdersModel.findByIdAndUpdate(orderProduct.cartId, updateOrderStatus);
            }
        }

        if (newStatus === orderProductStatusJson.delivered || newStatus === orderProductStatusJson.shipped) {
            const productDetails = await ProductsModel.aggregate(productDetailsWithVariant({ 'productvariants._id': orderProduct.variantId }))
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
                    await orderProductStatusChangeEmail(settingsDetails, orderDetails, newStatus, customerDetails, productDetails)
                }
            }
        }

        const updatedOrderDetails: any = await OrderService.OrderList({
            query: {
                _id: orderProduct.cartId
            },
            getAddress: '1',
            getCartProducts: '1',
            hostName: req.get('origin'),
        })

        if (updatedOrderDetails && updatedOrderDetails?.length > 0) {
            const user = res.locals.user;
            return controller.sendSuccessResponse(res, {
                requestedData: updatedOrderDetails[0],
                message: orderProductStatussMessages[newStatus]
            }, 200, { // task log
                userId: user._id,
                countryId: user.countryId,
                sourceCollection: collections.cart.cartorders,
                referenceData: JSON.stringify({
                    orderId: orderDetails.orderId,
                    allValues: updatedOrderDetails[0]
                }, null, 2),
                sourceFromId: orderID,
                sourceFromReferenceId: orderProductId,
                sourceFrom: adminTaskLog.orders.order,
                activityComment: `Order product status changed to: ${orderReturnStatusMessages[newStatus]}`,
                activity: adminTaskLogActivity.update,
                activityStatus: adminTaskLogStatus.success
            });
        } else {
            return controller.sendErrorResponse(res, 200, {
                message: 'Order not fount'
            });
        }

    }

    async orderProductCancelStatusChange(req: Request, res: Response): Promise<void> {
        try {
            const orderProductId = req.params.orderProductId;
            const orderProductDetails = await CartOrderProductsModel.findOne({ _id: new mongoose.Types.ObjectId(orderProductId) });
            const { newStatus } = req.body;

            if (!orderProductDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'Your order product not found!' });
            }
            if (orderProductDetails.orderProductStatus === orderProductCancelStatusJson.refunded) {
                return controller.sendErrorResponse(res, 200, { message: `This product allready refunded` });
            }
            if (orderProductDetails.orderProductStatus !== orderProductStatusJson.canceled) {
                return controller.sendErrorResponse(res, 200, { message: 'The product must be canceled before it can be refunded.' });
            }

            if (orderProductDetails.orderRequestedProductCancelStatus !== orderProductCancelStatusJson.pending) {
                return controller.sendErrorResponse(res, 200, { message: 'You cannot change to this status without canceling the pending status.' });
            }
            const orderDetails = await CartOrdersModel.findById(orderProductDetails.cartId);
            if (!orderDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'Your order not found!' });
            }
            const updateOrderStatus = { totalReturnedProductAmount: ((orderDetails.totalReturnedProductAmount + orderProductDetails.productAmount) || 0) };
            await CartOrdersModel.findByIdAndUpdate(orderDetails._id, updateOrderStatus);
            const updateProductStatus = {
                returnedProductAmount: orderProductDetails.productAmount,
                orderRequestedProductCancelStatus: orderProductCancelStatusJson.refunded,
                orderProductStatus: orderProductStatusJson.refunded,
                orderProductStatusAt: new Date(),
                orderRequestedProductCancelStatusAt: new Date()
            }
            const updatedProduct: any = await CartOrderProductsModel.findByIdAndUpdate(orderProductDetails._id, updateProductStatus, { new: true });
            if (updatedProduct) {
                const customerDetails = await CustomerModel.findOne({ _id: orderDetails.customerId });
                if (customerDetails) {
                    const productDetails = await ProductsModel.aggregate(productDetailsWithVariant({ 'productvariants._id': orderProductDetails.variantId }))
                    let query: any = { _id: { $exists: true } };
                    query = {
                        ...query,
                        countryId: orderDetails.countryId,
                        block: websiteSetup.basicSettings,
                        blockReference: { $in: [blockReferences.defualtSettings, blockReferences.basicDetailsSettings, blockReferences.socialMedia, blockReferences.appUrls] },
                        status: '1',
                    } as any;

                    const settingsDetails = await WebsiteSetupModel.find(query);
                    await orderProductCancelStatusChangeEmail(settingsDetails, orderDetails, newStatus, customerDetails, productDetails)
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
                const user = res.locals.user;
                return controller.sendSuccessResponse(res, {
                    requestedData: updatedOrderDetails[0],
                    message: 'Your Order is ready!'
                }, 200, { // task log
                    userId: user._id,
                    countryId: user.countryId,
                    sourceCollection: collections.cart.cartorders,
                    referenceData: JSON.stringify({
                        orderId: orderDetails.orderId,
                        allValues: updatedOrderDetails[0]
                    }, null, 2),
                    sourceFromId: orderProductDetails.cartId as any,
                    sourceFromReferenceId: orderProductId,
                    sourceFrom: adminTaskLog.orders.order,
                    activityComment: `Order product status changed to: ${orderProductCancelStatusMessages[newStatus]}`,
                    activity: adminTaskLogActivity.update,
                    activityStatus: adminTaskLogStatus.success
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

    async orderProductReturnStatusChange(req: Request, res: Response): Promise<void> {
        try {
            const orderProductId = req.params.id;
            const orderProductDetails = await CartOrderProductsModel.findOne({ _id: new mongoose.Types.ObjectId(orderProductId) });
            if (!orderProductDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'Your order product not found!' });
            }
            if (orderProductDetails.orderProductStatus !== orderProductStatusJson.delivered && orderProductDetails.orderProductStatus !== orderProductStatusJson.returned) {
                return controller.sendErrorResponse(res, 200, { message: `You cant change to this status without delivered or returned product` });
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
            const currentDate = new Date();
            const orderProductUpdateFields: any = {
                [quantityChange ? 'orderRequestedProductQuantityStatus' : 'orderProductReturnStatus']: newStatus,
                [quantityChange ? 'orderRequestedProductQuantityStatusAt' : 'orderProductReturnStatusAt']: currentDate,
            };
            if (newStatus === statusJson.approved) {
                orderProductUpdateFields[quantityChange ? 'orderProductReturnQuantityApprovedStatusAt' : 'orderProductReturnApprovedStatusAt'] = currentDate;
            } else if (newStatus === statusJson.refunded) {
                orderProductUpdateFields[quantityChange ? 'orderProductReturnQuantityRefundStatusAt' : 'orderProductReturnRefundStatusAt'] = currentDate;
                const newQuantity = orderProductDetails.orderRequestedProductQuantity;
                const perUnitPrice = orderProductDetails.productAmount / orderProductDetails.quantity;
                orderProductUpdateFields['returnedProductAmount'] = quantityChange ? ((orderProductDetails.quantity - newQuantity) * perUnitPrice) : orderProductDetails.productAmount;
                orderProductUpdateFields['orderProductStatus'] = orderProductStatusJson.refunded;
                orderProductUpdateFields['orderProductStatusAt'] = currentDate;
                orderUpdateFields['orderStatus'] = orderDetails.length > 1 ? orderStatusArrayJson.partiallyRefunded : orderStatusArrayJson.refunded;
                orderUpdateFields[orderDetails.length > 1 ? 'partiallyRefundedStatusAt' : 'refundedStatusAt'] = currentDate;
                orderUpdateFields['totalReturnedProductAmount'] = quantityChange ? (orderDetails?.totalReturnedProductAmount || 0) + ((orderProductDetails.quantity - newQuantity) * perUnitPrice) : (orderDetails?.totalReturnedProductAmount || 0) + orderProductDetails.productAmount;
            } else if (newStatus === statusJson.received) {
                orderProductUpdateFields['orderProductStatus'] = orderProductStatusJson.returned;
                orderProductUpdateFields['orderProductStatusAt'] = currentDate;
                orderProductUpdateFields[quantityChange ? 'orderProductReturnQuantityReceivedStatusAt' : 'orderProductReturnReceivedStatusAt'] = currentDate;
                if (!quantityChange) {
                    updateVariantProductQuantity = orderProductDetails.quantity;
                } else {
                    updateVariantProductQuantity = orderProductDetails.orderRequestedProductQuantity;
                }
                orderUpdateFields['orderStatus'] = orderDetails.length > 1 ? orderStatusArrayJson.partiallyReturned : orderStatusArrayJson.returned;
                orderUpdateFields[orderDetails.length > 1 ? 'partiallyReturnedStatusAt' : 'returnedStatusAt'] = currentDate;

            } else if (newStatus === statusJson.rejected) {
                orderProductUpdateFields[quantityChange ? 'orderProductReturnQuantityRejectedStatusAt' : 'orderProductReturnRejectedStatusAt'] = currentDate;
            }

            const updatedOrderProductDetails = await CartOrderProductsModel.findByIdAndUpdate(orderProductDetails._id, orderProductUpdateFields);
            if (!updatedOrderProductDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'Something went wrong please try again.' });
            }
            if (orderUpdateFields && (orderUpdateFields?.totalReturnedProductAmount || newStatus === statusJson.received)) {
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
                        await orderProductReturnStatusChangeEmail(settingsDetails, orderDetails, newStatus, customerDetails, productDetails)
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
                const user = res.locals.user;
                return controller.sendSuccessResponse(res, {
                    requestedData: updatedOrderDetails[0],
                    message: 'Your Order is ready!'
                }, 200, { // task log
                    userId: user._id,
                    countryId: user.countryId,
                    sourceCollection: collections.cart.cartorders,
                    referenceData: JSON.stringify({
                        orderId: orderDetails.orderId,
                        allValues: updatedOrderDetails[0]
                    }, null, 2),
                    sourceFromId: orderProductDetails.cartId as any,
                    sourceFromReferenceId: orderProductId,
                    sourceFrom: adminTaskLog.orders.order,
                    activityComment: `Order product status changed to: ${orderReturnStatusMessages[newStatus]}`,
                    activity: adminTaskLogActivity.update,
                    activityStatus: adminTaskLogStatus.success
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
            orderProductUpdateFields['returnedProductAmount'] = ((orderProductDetails.quantity - changedQuantity) * perUnitPrice);
            orderUpdateFields['totalReturnedProductAmount'] = (orderDetails?.totalReturnedProductAmount || 0) + (orderProductUpdateFields['returnedProductAmount'] || 0);

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
                    await orderProductReturnQuantityChangeEmail(settingsDetails, orderDetails, newStatus, changedQuantity, customerDetails, productDetails)
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
                const user = res.locals.user;
                return controller.sendSuccessResponse(res, {
                    requestedData: updatedOrderDetails[0],
                    message: 'Your Order is ready!'
                }, 200, { // task log
                    userId: user._id,
                    countryId: user.countryId,
                    sourceCollection: collections.cart.cartorders,
                    referenceData: JSON.stringify({
                        orderId: orderDetails.orderId,
                        allValues: updatedOrderDetails[0]
                    }, null, 2),
                    sourceFromId: orderProductDetails.cartId as any,
                    sourceFromReferenceId: orderProductId,
                    sourceFrom: adminTaskLog.orders.order,
                    activityComment: `Order product status changed to: ${orderReturnStatusMessages[newStatus]}`,
                    activity: adminTaskLogActivity.update,
                    activityStatus: adminTaskLogStatus.success
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
            if (orderDetails.orderStatus === orderStatusArrayJson.delivered && [
                orderStatusArrayJson.pending,
                orderStatusArrayJson.processing,
                orderStatusArrayJson.packed,
                orderStatusArrayJson.shipped,
                orderStatusArrayJson.partiallyShipped,
                orderStatusArrayJson.pickup,
                orderStatusArrayJson.onHold,
            ].includes(orderStatus)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Cannot change the status back to a previous state once delivered'
                });
            }
            // Ensure that the order cannot be changed to Canceled after Delivered

            if (orderDetails.orderStatus === orderStatusArrayJson.delivered && orderStatus === orderStatusArrayJson.canceled) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Cannot change the status to Canceled once delivered'
                });
            }
            // Ensure that Returned status is only possible after Delivered
            if (orderStatus === orderStatusArrayJson.returned && orderDetails.orderStatus !== orderStatusArrayJson.delivered) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Returned status is only possible after Delivered'
                });
            }

            // Ensure that Refunded status is only possible after Returned
            if (orderStatus === orderStatusArrayJson.refunded && ![
                orderStatusArrayJson.returned,
                orderStatusArrayJson.canceled,
                orderStatusArrayJson.partiallyCanceled,
                orderStatusArrayJson.partiallyReturned
            ].includes(orderDetails.orderStatus)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Refunded status is only possible after Returned or Canceled'
                });
            }

            if (orderStatus === orderStatusArrayJson.canceled && [
                orderStatusArrayJson.returned,
                orderStatusArrayJson.partiallyReturned
            ].includes(orderDetails.orderStatus)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Canceled status is only possible after Returned or Partially Returned'
                });
            }

            const nonCancelableStatuses = [
                orderStatusArrayJson.processing,
                orderStatusArrayJson.packed,
                orderStatusArrayJson.shipped,
                orderStatusArrayJson.pickup,
                orderStatusArrayJson.delivered,
                orderStatusArrayJson.returned,
                orderStatusArrayJson.refunded,
                orderStatusArrayJson.partiallyShipped,
                orderStatusArrayJson.onHold,
                orderStatusArrayJson.failed,
                orderStatusArrayJson.completed,
                orderStatusArrayJson.partiallyDelivered,
                orderStatusArrayJson.partiallyReturned,
                orderStatusArrayJson.partiallyRefunded,
            ];
            if (orderStatus === orderStatusArrayJson.canceled && nonCancelableStatuses.includes(orderDetails.orderStatus)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Cannot change the status of a Canceled Order',
                });
            }
            // Ensure that Completed status is only possible after Delivered
            if (orderStatus === orderStatusArrayJson.completed && orderDetails.orderStatus !== orderStatusArrayJson.delivered) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Completed status is only possible after Delivered'
                });
            }
            // Ensure that the order cannot be changed from Completed to any other status
            if (orderDetails.orderStatus === orderStatusArrayJson.completed) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Cannot change the status once it is completed'
                });
            }
            // Ensure that the order cannot be changed from Failed
            if (orderDetails.orderStatus === orderStatusArrayJson.failed) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Cannot change the status once it is failed'
                });
            }
            // Ensure that the order cannot be changed from Refunded
            if (orderDetails.orderStatus === orderStatusArrayJson.refunded) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Cannot change the status once it is refunded'
                });
            }


            if ((orderDetails.orderStatus === orderStatusArrayJson.failed) && (orderStatus === orderStatusArrayJson.pending || orderStatus === orderStatusArrayJson.packed || orderStatus === orderStatusArrayJson.processing || orderStatus === orderStatusArrayJson.shipped || orderStatus === orderStatusArrayJson.delivered)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Failed status is cannot change to this status'
                });
            }

            if (orderDetails.orderStatus === orderStatusArrayJson.returned && (orderStatus !== orderStatusArrayJson.refunded)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Completed status is only possible after Refunded'
                });
            }

            const orderProductDetails = await CartOrderProductsModel.find({ cartId: orderDetails._id });
            if (orderProductDetails.length === 0) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Order products are not found!'
                });
            }

            orderDetails.orderStatus = orderStatus;
            const currentDate = new Date();
            let orderProductStatus = orderDetails.orderStatus;

            let allMatchFinalProductStatus = false
            if (orderProductDetails.length > 1) {
                const partialStatusMapping: Record<string, string> = {
                    [orderProductStatusJson.delivered]: orderStatusArrayJson.partiallyDelivered,
                    [orderProductStatusJson.shipped]: orderStatusArrayJson.partiallyShipped,
                    [orderProductStatusJson.canceled]: orderStatusArrayJson.partiallyCanceled,
                    [orderProductStatusJson.returned]: orderStatusArrayJson.partiallyReturned,
                    [orderProductStatusJson.refunded]: orderStatusArrayJson.partiallyRefunded,
                };

                for (const [productStatus, partialStatus] of Object.entries(partialStatusMapping)) {
                    const hasPartialStatus = orderProductDetails.some((product: any) =>
                        product.orderProductStatus === productStatus
                    );
                    if (hasPartialStatus) {
                        orderDetails.orderStatus = partialStatus;
                        break;
                    }
                }

                const statusToCheckMapping: Record<string, string> = {
                    [orderStatusArrayJson.partiallyDelivered]: orderProductStatusJson.delivered,
                    [orderStatusArrayJson.partiallyShipped]: orderProductStatusJson.shipped,
                    [orderStatusArrayJson.partiallyCanceled]: orderProductStatusJson.canceled,
                    [orderStatusArrayJson.partiallyReturned]: orderProductStatusJson.returned,
                    [orderStatusArrayJson.partiallyRefunded]: orderProductStatusJson.refunded,
                };

                const currentPartialStatus = orderDetails.orderStatus;

                if (statusToCheckMapping[currentPartialStatus]) {
                    allMatchFinalProductStatus = orderProductDetails.every((product: any) =>
                        (product.orderProductStatus === statusToCheckMapping[currentPartialStatus] || product.orderProductStatus === orderStatus)
                    );

                    if (allMatchFinalProductStatus) {
                        orderDetails.orderStatus = orderStatus;
                        orderProductStatus = orderStatus;
                    }
                }
            }

            switch (orderStatus) {
                case orderStatusArrayJson.pending: orderDetails.orderStatusAt = currentDate; break;
                case orderStatusArrayJson.processing: orderDetails.processingStatusAt = currentDate; break;
                case orderStatusArrayJson.packed: orderDetails.packedStatusAt = currentDate; break;
                case orderStatusArrayJson.shipped: orderDetails.shippedStatusAt = currentDate; break;
                case orderStatusArrayJson.delivered: orderDetails.deliveredStatusAt = currentDate; break;
                case orderStatusArrayJson.canceled: orderDetails.canceledStatusAt = currentDate; break;
                case orderStatusArrayJson.returned: orderDetails.returnedStatusAt = currentDate; break;
                case orderStatusArrayJson.refunded: orderDetails.refundedStatusAt = currentDate; break;
                case orderStatusArrayJson.partiallyShipped: orderDetails.partiallyShippedStatusAt = currentDate; break;
                case orderStatusArrayJson.onHold: orderDetails.onHoldStatusAt = currentDate; break;
                case orderStatusArrayJson.failed: orderDetails.failedStatusAt = currentDate; break;
                case orderStatusArrayJson.completed: orderDetails.completedStatusAt = currentDate; break;
                case orderStatusArrayJson.pickup: orderDetails.pickupStatusAt = currentDate; break;
                case orderStatusArrayJson.partiallyDelivered: orderDetails.partiallyDeliveredStatusAt = currentDate; break;
                case orderStatusArrayJson.partiallyCanceled: orderDetails.partiallyCanceledStatusAt = currentDate; break;
                case orderStatusArrayJson.partiallyReturned: orderDetails.partiallyReturnedStatusAt = currentDate; break;
                case orderStatusArrayJson.partiallyRefunded: orderDetails.partiallyRefundedStatusAt = currentDate; break;
                default: break;
            }
            const updatedOrderDetails: any = await OrderService.orderStatusUpdate(orderDetails._id, orderDetails, '1');
            if (!updatedOrderDetails) {
                return controller.sendErrorResponse(res, 500, {
                    message: 'Something went wrong!'
                });
            }
            if ([orderStatusArrayJson.completed, orderStatusArrayJson.delivered, orderStatusArrayJson.pickup, orderStatusArrayJson.shipped, orderStatusArrayJson.packed, orderStatusArrayJson.processing, orderStatusArrayJson.onHold].includes(orderStatus)) {
                switch (orderProductStatus) {
                    case orderStatusArrayJson.partiallyCanceled:
                        orderProductStatus = orderStatusArrayJson.canceled;
                        break;
                    case orderStatusArrayJson.partiallyReturned:
                        orderProductStatus = orderStatusArrayJson.returned;
                        break;
                    case orderStatusArrayJson.partiallyRefunded:
                        orderProductStatus = orderStatusArrayJson.refunded;
                        break;
                    default:
                        break;
                }
            }

            const allMatchOrderProductStatus = orderProductDetails.every((product: any) =>
                product.orderProductStatus === orderProductDetails[0].orderProductStatus
            );
            let exclusionMappingStatus: Record<string, string[]> = {};
            if (!allMatchOrderProductStatus) {
                const commonExclusionsStatus = [
                    orderProductStatusJson.pending,
                    orderProductStatusJson.processing,
                    orderProductStatusJson.packed,
                    orderProductStatusJson.shipped,
                    orderProductStatusJson.delivered,
                    orderProductStatusJson.pickup,
                    orderProductStatusJson.canceled,
                    orderProductStatusJson.returned,
                    orderProductStatusJson.refunded,
                ];
                exclusionMappingStatus = {
                    [orderStatusArrayJson.pending]: commonExclusionsStatus,
                    [orderStatusArrayJson.processing]: commonExclusionsStatus,
                    [orderStatusArrayJson.shipped]: commonExclusionsStatus,
                    [orderStatusArrayJson.packed]: commonExclusionsStatus,
                    [orderStatusArrayJson.partiallyShipped]: commonExclusionsStatus,
                    [orderStatusArrayJson.onHold]: commonExclusionsStatus,
                    [orderStatusArrayJson.delivered]: commonExclusionsStatus,
                    [orderStatusArrayJson.partiallyDelivered]: [

                    ],
                    [orderStatusArrayJson.partiallyCanceled]: [
                        orderProductStatusJson.returned,
                        orderProductStatusJson.refunded,
                    ],
                    [orderStatusArrayJson.partiallyReturned]: [
                        orderProductStatusJson.canceled,
                        orderProductStatusJson.refunded,
                    ],
                    [orderStatusArrayJson.partiallyRefunded]: [
                        orderProductStatusJson.canceled,
                        orderProductStatusJson.returned,
                    ],
                    [orderStatusArrayJson.canceled]: [
                        orderProductStatusJson.returned,
                        orderProductStatusJson.refunded,
                    ],
                    [orderStatusArrayJson.returned]: [
                        orderProductStatusJson.canceled,
                        orderProductStatusJson.refunded,
                    ],
                    [orderStatusArrayJson.refunded]: [
                        orderProductStatusJson.canceled,
                        orderProductStatusJson.returned,
                    ],
                };
            }

            const exclusionStatuses = allMatchFinalProductStatus ? [] : (exclusionMappingStatus[orderProductStatus] || []);
            await CartOrderProductsModel.updateMany(
                {
                    cartId: orderDetails._id,
                    orderProductStatus: {
                        $nin: exclusionStatuses
                    }
                },
                {
                    $set: {
                        orderProductStatus: orderProductStatus,
                        orderProductStatusAt: currentDate
                    }
                }
            );

            if (orderStatus === orderStatusArrayJson.failed || orderStatus === orderStatusArrayJson.returned || orderStatus === orderStatusArrayJson.canceled) {
                const cartProducts = await CartOrderProductsModel.find({ cartId: orderDetails._id }).select('variantId quantity');
                const updateProductVariant: any = cartProducts.map((products: any) => ({
                    updateOne: {
                        filter: { _id: products.variantId },
                        update: { $inc: { quantity: products.quantity } },
                    }
                }));
                await ProductVariantsModel.bulkWrite(updateProductVariant);
            }
            if (orderStatus === orderStatusArrayJson.refunded || orderStatus === orderStatusArrayJson.partiallyRefunded) {
                const cartProducts = await CartOrderProductsModel.find({ cartId: orderDetails._id, orderProductStatus: { $in: [orderProductStatusJson.returned, orderProductStatusJson.refunded] } }).select('productAmount');
                if (cartProducts && cartProducts.length > 0) {
                    const bulkOperations = cartProducts.map((product) => ({
                        updateOne: {
                            filter: { _id: product._id },
                            update: { $set: { returnedProductAmount: product.productAmount } }
                        }
                    }));
                    await CartOrderProductsModel.bulkWrite(bulkOperations, { ordered: false });
                    const totalReturnedAmount = cartProducts.reduce((sum, product) => sum + product.productAmount, 0);
                    await CartOrdersModel.findByIdAndUpdate(
                        orderDetails._id,
                        { returnedProductAmount: totalReturnedAmount },
                        { new: true, useFindAndModify: false }
                    );
                }
            }
            let customerDetails: any = null;
            if (orderDetails.customerId) {
                customerDetails = await CustomerService.findOne({ _id: orderDetails?.customerId });
                if (orderStatus === orderStatusArrayJson.completed && customerDetails) {
                    await OrderService.orderWalletAmountTransactions(orderStatus, orderDetails, customerDetails);
                }
            }
            if (orderStatus === orderStatusArrayJson.shipped || orderStatus === orderStatusArrayJson.delivered || orderStatus === orderStatusArrayJson.canceled) {
                let query: any = { _id: { $exists: true } };
                query = {
                    ...query,
                    countryId: orderDetails.countryId,
                    block: websiteSetup.basicSettings,
                    blockReference: { $in: [blockReferences.defualtSettings, blockReferences.basicDetailsSettings, blockReferences.socialMedia, blockReferences.appUrls] },
                    status: '1',
                } as any;

                const settingsDetails = await WebsiteSetupModel.find(query);
                const tax = await TaxsModel.findOne({ countryId: orderDetails.countryId, status: "1" })
                await orderStatusChangeEmail(settingsDetails, orderDetails, orderStatus, updatedOrderDetails, tax, customerDetails)
            }
            const user = res.locals.user;

            return controller.sendSuccessResponse(res, {
                requestedData: updatedOrderDetails,
                message: orderStatusMessages[orderStatus] || 'Order status updated successfully!'
            }, 200, { // task log
                userId: user._id,
                countryId: user.countryId,
                sourceCollection: collections.cart.cartorders,
                referenceData: JSON.stringify({
                    orderId: orderDetails.orderId,
                    allValues: updatedOrderDetails[0]
                }, null, 2),
                sourceFromId: orderId,
                sourceFrom: adminTaskLog.orders.order,
                activityComment: `Order product status changed to: ${orderStatusMessages[orderStatus]}`,
                activity: adminTaskLogActivity.update,
                activityStatus: adminTaskLogStatus.success
            });
        } catch (error: any) {
            console.log('error', error);

            return controller.sendErrorResponse(res, 500, {
                message: 'Something went wrong'
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
                const currencyCode = await CountryModel.findOne({ _id: orderDetails[0].country._id }, 'countryTitle currencyCode')

                const expectedDeliveryDate = calculateExpectedDeliveryDate(orderDetails[0].orderStatusAt, Number(commonDeliveryDays))

                // const user = res.locals.user;
                // const insertTaskLogs = {
                //     countryId: user.countryId,
                //     sourceCollection: collections.cart.cartorders,
                //     userId: user._id,
                //     referenceData: JSON.stringify({
                //         orderId: orderDetails.orderId,
                //         countryTitle: currencyCode?.countryTitle,
                //         allValues: orderDetails
                //     }, null, 2),
                //     sourceFromId: orderDetails._id.toString(),
                //     sourceFrom: adminTaskLog.orders.order,
                //     activityComment: `Generate Order PDF: ${orderDetails.orderId}`,
                //     activity: adminTaskLogActivity.create,
                //     activityStatus: adminTaskLogStatus.success
                // };
                // console.log('insertTaskLogs', insertTaskLogs);

                // await AdminTaskLogModel.create(insertTaskLogs);

                const invoicePdfGeneratorResponse = await invoicePdfGenerator(res, req, orderDetails, basicDetailsSettings, tax, expectedDeliveryDate, currencyCode?.currencyCode);
                if (!invoicePdfGeneratorResponse) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Error generating invoice'
                    });
                }
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

