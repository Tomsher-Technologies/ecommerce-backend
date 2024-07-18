"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const ejs = require('ejs');
const { convert } = require('html-to-text');
const cart_1 = require("../../constants/cart");
const helpers_1 = require("../../utils/helpers");
const coupon_service_1 = __importDefault(require("./auth/coupon-service"));
const cart_service_1 = __importDefault(require("./cart-service"));
const product_model_1 = __importDefault(require("../../model/admin/ecommerce/product-model"));
const product_category_link_model_1 = __importDefault(require("../../model/admin/ecommerce/product/product-category-link-model"));
const cart_order_model_1 = __importDefault(require("../../model/frontend/cart-order-model"));
const payment_transaction_model_1 = __importDefault(require("../../model/frontend/payment-transaction-model"));
const customers_model_1 = __importDefault(require("../../model/frontend/customers-model"));
const website_setup_1 = require("../../constants/website-setup");
const website_setup_model_1 = __importDefault(require("../../model/admin/setup/website-setup-model"));
const mail_chimp_sms_gateway_1 = require("../../lib/emails/mail-chimp-sms-gateway");
const customer_address_model_1 = __importDefault(require("../../model/frontend/customer-address-model"));
const cart_order_config_1 = require("../../utils/config/cart-order-config");
const tax_model_1 = __importDefault(require("../../model/admin/setup/tax-model"));
const product_variants_model_1 = __importDefault(require("../../model/admin/ecommerce/product/product-variants-model"));
const smtp_nodemailer_gateway_1 = require("../../lib/emails/smtp-nodemailer-gateway");
class CheckoutService {
    async paymentResponse(options) {
        const { paymentDetails, allPaymentResponseData, paymentStatus } = options;
        if (!paymentDetails) {
            return {
                status: false,
                message: 'Payment transactions not found'
            };
        }
        const cartDetails = await cart_order_model_1.default.findOne({ _id: paymentDetails?.orderId, cartStatus: "1" });
        if (!cartDetails) {
            const cartUpdation = this.cartUpdation(cartDetails, false);
            return {
                _id: null,
                status: false,
                message: 'Active cart not found'
            };
        }
        if (paymentStatus === cart_1.orderPaymentStatus.success) {
            const updateTransaction = await payment_transaction_model_1.default.findByIdAndUpdate(paymentDetails?._id, {
                data: JSON.stringify(allPaymentResponseData),
                status: paymentStatus,
                createdAt: new Date(),
            }, { new: true, useFindAndModify: false });
            this.cartUpdation({
                ...cartDetails,
                _id: cartDetails?._id,
                totalAmount: cartDetails?.totalAmount,
                customerId: cartDetails.customerId,
                couponId: cartDetails?.couponId,
                countryId: cartDetails?.countryId,
                shippingId: cartDetails?.shippingId,
                orderStatusAt: cartDetails?.orderStatusAt,
                orderStatus: cartDetails?.orderStatus,
                paymentMethodId: cartDetails?.paymentMethodId,
                totalShippingAmount: cartDetails.totalShippingAmount,
                totalProductAmount: cartDetails.totalProductAmount,
                orderComments: cartDetails?.orderComments,
            }, true);
            if (updateTransaction) {
                return {
                    _id: cartDetails._id,
                    orderId: cartDetails.orderId,
                    status: true,
                    message: 'Payment success'
                };
            }
            else {
                return {
                    _id: cartDetails._id,
                    orderId: cartDetails.orderId,
                    status: false,
                    message: 'update transaction is fail please contact administrator'
                };
            }
        }
        else {
            const updateTransaction = await payment_transaction_model_1.default.findByIdAndUpdate(paymentDetails?._id, {
                data: JSON.stringify(allPaymentResponseData),
                status: paymentStatus,
                createdAt: new Date(),
            }, { new: true, useFindAndModify: false });
            this.cartUpdation(cartDetails, false);
            return {
                _id: cartDetails._id,
                orderId: cartDetails.orderId,
                status: false,
                message: paymentStatus
            };
        }
    }
    async getNextSequenceValue() {
        const maxOrder = await cart_order_model_1.default.find().sort({ orderId: -1 }).limit(1);
        if (Array.isArray(maxOrder) && maxOrder.length > 0 && maxOrder[0].orderId) {
            const maxOrderId = maxOrder[0].orderId;
            const nextOrderId = (parseInt(maxOrderId, 10) + 1).toString().padStart(6, '0');
            return nextOrderId;
        }
        else {
            return '000001';
        }
    }
    async cartUpdation(cartDetails, paymentSuccess) {
        if (cartDetails) {
            let cartUpdate = {
                cartStatus: cart_1.cartStatus.active,
                totalAmount: cartDetails?.totalAmount,
                totalCouponAmount: 0,
                couponId: cartDetails?.couponId,
                paymentMethodId: cartDetails?.paymentMethodId
            };
            if (!paymentSuccess) {
                cartUpdate = {
                    ...cartUpdate,
                    cartStatus: cart_1.cartStatus.active,
                    couponId: null,
                    paymentMethodId: null
                };
                await cart_service_1.default.update(cartDetails?._id, cartUpdate);
                return {
                    _id: cartDetails?._id,
                    orderId: null,
                    status: false,
                    message: 'Cart updation failed'
                };
            }
            const couponDetails = await coupon_service_1.default.findOne({ _id: cartDetails?.couponId });
            if (couponDetails) {
                const cartProductDetails = await cart_service_1.default.findAllCart({ cartId: cartDetails?._id });
                const productIds = cartProductDetails.map((product) => product.productId.toString());
                const couponAmount = couponDetails?.discountAmount;
                const discountType = couponDetails.discountType;
                const updateTotalCouponAmount = (productAmount, discountAmount, discountType) => {
                    if (productAmount) {
                        const totalCouponAmount = (0, helpers_1.calculateTotalDiscountAmountDifference)(productAmount, discountType, discountAmount);
                        const cartTotalAmount = cartDetails?.totalAmount - (0, helpers_1.calculateTotalDiscountAmountDifference)(productAmount, discountType, discountAmount);
                        cartUpdate = {
                            ...cartUpdate,
                            totalAmount: cartTotalAmount,
                            totalCouponAmount: totalCouponAmount
                        };
                    }
                };
                var totalAmount = 0;
                if (couponDetails?.couponType == cart_1.couponTypes.entireOrders) {
                    updateTotalCouponAmount(cartDetails?.totalAmount, couponAmount, discountType);
                }
                else if (couponDetails?.couponType == cart_1.couponTypes.forProduct) {
                    cartProductDetails.map(async (product) => {
                        if (couponDetails?.couponApplyValues.includes((product.productId))) {
                            totalAmount += product.productAmount;
                        }
                    });
                    updateTotalCouponAmount(totalAmount, couponAmount, discountType);
                }
                else if (couponDetails?.couponType == cart_1.couponTypes.forCategory) {
                    const productCategoryDetails = await product_category_link_model_1.default.find({ productId: { $in: productIds } });
                    const categoryIds = productCategoryDetails.map((product) => product.categoryId);
                    categoryIds.map(async (product) => {
                        if (couponDetails?.couponApplyValues.includes((product.productId.toString()))) {
                            totalAmount += product.productAmount;
                        }
                    });
                    updateTotalCouponAmount(totalAmount, couponAmount, discountType);
                }
                else if (couponDetails?.couponType == cart_1.couponTypes.forBrand) {
                    const productDetails = await product_model_1.default.find({ _id: { $in: productIds } });
                    const brandIds = productDetails.map((product) => product.brand);
                    brandIds.map(async (product) => {
                        if (couponDetails?.couponApplyValues.includes((product.productId))) {
                            totalAmount += product.productAmount;
                        }
                    });
                    updateTotalCouponAmount(totalAmount, couponAmount, discountType);
                }
            }
            const orderId = await this.getNextSequenceValue();
            cartUpdate = {
                ...cartUpdate,
                orderId: orderId,
                cartStatus: cart_1.cartStatus.order,
                orderStatus: cart_1.orderStatusMap['1'].value,
                processingStatusAt: new Date(),
                orderStatusAt: new Date(),
            };
            let cartProducts = cartDetails?.products || null;
            let customerDetails = cartDetails?.customerDetails || null;
            let paymentMethodDetails = cartDetails?.paymentMethod || null;
            const updateCart = await cart_service_1.default.update(cartDetails?._id, cartUpdate);
            if (!updateCart) {
                return {
                    _id: cartDetails?._id,
                    orderId: orderId,
                    status: false,
                    message: 'Cart updation failed'
                };
            }
            else {
                if (!cartProducts) {
                    const pipeline = (0, cart_order_config_1.buildOrderPipeline)(paymentMethodDetails, customerDetails, cartDetails);
                    const createdCartWithValues = await cart_order_model_1.default.aggregate(pipeline);
                    if (createdCartWithValues && createdCartWithValues.length > 0) {
                        if (createdCartWithValues[0]?.products) {
                            cartProducts = createdCartWithValues[0].products;
                        }
                        if (paymentMethodDetails == null) {
                            paymentMethodDetails = createdCartWithValues[0]?.paymentMethod;
                        }
                        if (customerDetails == null) {
                            customerDetails = createdCartWithValues[0]?.customer;
                        }
                    }
                }
                if (cartProducts) {
                    const updateProductVariant = cartProducts.map((products) => ({
                        updateOne: {
                            filter: { _id: products.variantId },
                            update: { $inc: { quantity: -products.quantity } },
                        }
                    }));
                    await product_variants_model_1.default.bulkWrite(updateProductVariant);
                    if (customerDetails === null) {
                        customerDetails = await customers_model_1.default.findOne({ _id: cartDetails.customerId });
                    }
                    let websiteSettingsQuery = { _id: { $exists: true } };
                    websiteSettingsQuery = {
                        ...websiteSettingsQuery,
                        countryId: cartDetails.countryId,
                        block: website_setup_1.websiteSetup.basicSettings,
                        blockReference: { $in: [website_setup_1.blockReferences.defualtSettings, website_setup_1.blockReferences.basicDetailsSettings, website_setup_1.blockReferences.socialMedia, website_setup_1.blockReferences.appUrls] },
                        status: '1',
                    };
                    const settingsDetails = await website_setup_model_1.default.find(websiteSettingsQuery);
                    const defualtSettings = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.defualtSettings);
                    const basicDetailsSettings = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.basicDetailsSettings)?.blockValues;
                    const socialMedia = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.socialMedia)?.blockValues;
                    const appUrls = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.appUrls)?.blockValues;
                    const shippingAddressDetails = await customer_address_model_1.default.findById(cartDetails.shippingId);
                    let commonDeliveryDays = '6';
                    if (defualtSettings && defualtSettings.blockValues && defualtSettings.blockValues.commonDeliveryDays) {
                        commonDeliveryDays = defualtSettings.blockValues.commonDeliveryDays;
                    }
                    const expectedDeliveryDate = (0, helpers_1.calculateExpectedDeliveryDate)(cartDetails.orderStatusAt, Number(commonDeliveryDays));
                    const tax = await tax_model_1.default.findOne({ countryId: cartDetails.countryId, status: "1" });
                    const options = {
                        wordwrap: 130,
                        // ...
                    };
                    ejs.renderFile(path_1.default.join(__dirname, '../../views/email/order', 'order-creation-email.ejs'), {
                        firstName: customerDetails?.firstName,
                        orderId: orderId,
                        totalAmount: cartUpdate.totalAmount,
                        totalShippingAmount: cartDetails.totalShippingAmount,
                        totalProductAmount: cartDetails.totalProductAmount,
                        orderComments: cartDetails?.orderComments,
                        paymentMethod: paymentMethodDetails?.paymentMethodTitle,
                        shippingAddressDetails: {
                            name: shippingAddressDetails?.name,
                            addressType: shippingAddressDetails?.addressType,
                            address1: shippingAddressDetails?.address1,
                            address2: shippingAddressDetails?.address2,
                            city: shippingAddressDetails?.city,
                            state: shippingAddressDetails?.state,
                            country: shippingAddressDetails?.country,
                            phoneNumber: shippingAddressDetails?.phoneNumber,
                            landlineNumber: shippingAddressDetails?.landlineNumber,
                            email: customerDetails.email
                        },
                        expectedDeliveryDate,
                        socialMedia,
                        appUrls,
                        storeEmail: basicDetailsSettings?.storeEmail,
                        storePhone: basicDetailsSettings?.storePhone,
                        shopDescription: convert(basicDetailsSettings?.shopDescription, options),
                        products: cartProducts,
                        shopName: basicDetailsSettings?.shopName || `${process.env.SHOPNAME}`,
                        shopLogo: `${process.env.SHOPLOGO}`,
                        appUrl: `${process.env.APPURL}`,
                        tax: tax
                    }, async (err, template) => {
                        if (err) {
                        }
                        if (process.env.SHOPNAME === 'Timehouse') {
                            const sendEmail = await (0, mail_chimp_sms_gateway_1.mailChimpEmailGateway)({
                                subject: cart_1.orderStatusMessages['1'],
                                email: customerDetails.email,
                                ccmail: [basicDetailsSettings?.storeEmail, socialMedia.email]
                            }, template);
                        }
                        else if (process.env.SHOPNAME === 'Homestyle') {
                            const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({
                                subject: cart_1.orderStatusMessages['1'],
                                email: customerDetails.email,
                                ccmail: [basicDetailsSettings?.storeEmail, socialMedia.email]
                            }, template);
                        }
                        else if (process.env.SHOPNAME === 'Beyondfresh') {
                            const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({
                                subject: cart_1.orderStatusMessages['1'],
                                email: customerDetails.email,
                                ccmail: [basicDetailsSettings?.storeEmail, socialMedia.email]
                            }, template);
                        }
                        else if (process.env.SHOPNAME === 'Smartbaby') {
                            const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({
                                subject: cart_1.orderStatusMessages['1'],
                                email: customerDetails.email,
                                ccmail: [basicDetailsSettings?.storeEmail, socialMedia.email]
                            }, template);
                        }
                    });
                }
                return {
                    _id: cartDetails?._id,
                    orderId: orderId,
                    status: true,
                    message: 'Cart updation success'
                };
            }
        }
    }
}
exports.default = new CheckoutService();
