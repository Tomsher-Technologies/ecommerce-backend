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
const cart_order_product_model_1 = __importDefault(require("../../model/frontend/cart-order-product-model"));
const country_model_1 = __importDefault(require("../../model/admin/setup/country-model"));
const bulk_sms_gateway_1 = require("../../lib/sms/bulk-sms-gateway");
const messages_1 = require("../../constants/messages");
class CheckoutService {
    async paymentResponse(options) {
        const { paymentDetails, allPaymentResponseData, paymentStatus } = options;
        if (!paymentDetails) {
            return {
                status: false,
                message: 'Payment transactions not found'
            };
        }
        const cartDetails = await cart_order_model_1.default.findOne({ _id: paymentDetails?.orderId, cartStatus: "1" }).lean();
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
                data: allPaymentResponseData,
                status: paymentStatus,
                createdAt: new Date(),
            }, { new: true, useFindAndModify: false });
            this.cartUpdation({
                ...cartDetails,
                _id: cartDetails?._id,
                customerId: cartDetails.customerId,
                couponId: cartDetails?.couponId,
                countryId: cartDetails?.countryId,
                shippingId: cartDetails?.shippingId,
                paymentMethodId: cartDetails?.paymentMethodId,
                pickupStoreId: cartDetails?.pickupStoreId,
                stateId: cartDetails?.stateId,
                cityId: cartDetails?.cityId,
                totalAmount: cartDetails?.totalAmount,
                totalShippingAmount: cartDetails.totalShippingAmount,
                totalProductAmount: cartDetails.totalProductAmount,
                orderStatus: cartDetails?.orderStatus,
                orderComments: cartDetails?.orderComments,
                orderStatusAt: cartDetails?.orderStatusAt,
            }, true);
            if (updateTransaction) {
                return {
                    _id: cartDetails._id,
                    orderId: cartDetails.orderId,
                    status: true,
                    message: 'Payment successfully recieved'
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
                totalShippingAmount: cartDetails?.totalShippingAmount,
                totalCouponAmount: cartDetails.totalCouponAmount > 0 ? cartDetails.totalCouponAmount : 0,
                couponId: cartDetails?.couponId,
                paymentMethodId: cartDetails?.paymentMethodId,
                pickupStoreId: cartDetails?.pickupStoreId
            };
            if (!paymentSuccess) {
                cartUpdate = {
                    ...cartUpdate,
                    cartStatus: cart_1.cartStatus.active,
                    couponId: null,
                    paymentMethodId: null,
                    billingId: null,
                    pickupStoreId: null,
                    stateId: null,
                    cityId: null,
                    totalCouponAmount: 0,
                    totalAmount: cartUpdate.totalCouponAmount > 0 ? cartUpdate.totalAmount + cartUpdate.totalCouponAmount : cartUpdate.totalAmount,
                };
                await cart_order_model_1.default.findByIdAndUpdate(cartDetails._id, cartUpdate, { new: true, useFindAndModify: false });
                return {
                    _id: cartDetails?._id,
                    orderId: null,
                    status: false,
                    message: 'Cart updation failed'
                };
            }
            if (cartDetails?.couponId && cartUpdate.totalCouponAmount === 0) {
                const couponDetails = await coupon_service_1.default.findOne({ _id: cartDetails?.couponId });
                cartUpdate = await this.updateCouponCodeOrder(couponDetails, cartDetails, cartUpdate);
            }
            let cartProducts = cartDetails?.products || null;
            let customerDetails = cartDetails?.customerDetails || null;
            let paymentMethodDetails = cartDetails?.paymentMethod || null;
            let shippingChargeDetails = cartDetails?.shippingChargeDetails || null;
            let shippingAddressDetails = cartDetails?.shippingAddressDetails || null;
            let countryData = cartDetails?.countryData || null;
            if (customerDetails === null) {
                customerDetails = await customers_model_1.default.findOne({ _id: cartDetails.customerId });
            }
            if (!countryData) {
                countryData = await country_model_1.default.findOne({ _id: cartDetails.countryId }, '_id countryTitle currencyCode');
            }
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
            if ((!shippingChargeDetails) && (!cartDetails.pickupStoreId) && (cartDetails.stateId)) {
                shippingChargeDetails = await website_setup_model_1.default.findOne({ blockReference: website_setup_1.blockReferences.shipmentSettings, countryId: cartDetails.countryId });
                if ((shippingChargeDetails.blockValues && shippingChargeDetails.blockValues.shippingType) && (shippingChargeDetails.blockValues.shippingType === website_setup_1.shippingTypes[1])) {
                    const areaWiseDeliveryChargeValues = shippingChargeDetails.blockValues.areaWiseDeliveryChargeValues || [];
                    if (areaWiseDeliveryChargeValues?.length > 0) {
                        const matchedValue = areaWiseDeliveryChargeValues.find((item) => {
                            if (item.stateId === cartDetails.stateId) {
                                if (cartDetails.cityId) {
                                    return item.cityId === cartDetails.cityId;
                                }
                                return true;
                            }
                            return false;
                        });
                        if (matchedValue) {
                            const shippingCharge = matchedValue?.shippingCharge || 0;
                            const finalShippingCharge = Number(shippingCharge) > 0 ? ((cartDetails.totalProductAmount) - (Number(matchedValue.freeShippingThreshold)) > 0 ? 0 : shippingCharge) : 0;
                            cartUpdate = {
                                ...cartUpdate,
                                totalShippingAmount: finalShippingCharge,
                                totalAmount: (cartDetails.totalAmount - cartUpdate.totalShippingAmount) + finalShippingCharge,
                            };
                        }
                    }
                }
                else if (cartDetails.pickupStoreId && (paymentMethodDetails && paymentMethodDetails.slug !== cart_1.paymentMethods.cashOnDelivery && paymentMethodDetails.slug !== cart_1.paymentMethods.cardOnDelivery)) {
                    cartUpdate = {
                        ...cartUpdate,
                        totalShippingAmount: 0,
                        totalAmount: (parseInt(cartDetails.totalAmount) - parseInt(cartUpdate.totalShippingAmount)),
                    };
                }
                else {
                    if (!shippingAddressDetails) {
                        shippingAddressDetails = await customer_address_model_1.default.findOne({ _id: cartDetails.shippingId });
                        if (shippingAddressDetails && shippingAddressDetails.country !== countryData.countryTitle) {
                            shippingChargeDetails = await website_setup_model_1.default.findOne({ blockReference: website_setup_1.blockReferences.shipmentSettings, countryId: countryData._id });
                            if ((shippingChargeDetails.blockValues && shippingChargeDetails.blockValues.shippingType) && (shippingChargeDetails.blockValues.shippingType === website_setup_1.shippingTypes[2])) {
                                const { internationalShippingCharge, internationalFreeShippingThreshold } = shippingChargeDetails.blockValues || null;
                                if (internationalShippingCharge && Number(internationalShippingCharge) > 0) {
                                    const finalShippingCharge = Number(internationalShippingCharge) > 0 ? ((cartDetails.totalProductAmount) - (Number(internationalFreeShippingThreshold)) > 0 ? 0 : internationalShippingCharge) : 0;
                                    cartUpdate = {
                                        ...cartUpdate,
                                        totalShippingAmount: finalShippingCharge,
                                        totalAmount: ((parseInt(cartDetails.totalAmount) - parseInt(cartDetails.totalShippingAmount)) + parseInt(finalShippingCharge)),
                                    };
                                }
                            }
                        }
                    }
                }
            }
            // const orderId = await this.getNextSequenceValue();
            cartUpdate = {
                ...cartUpdate,
                // orderId: orderId,
                cartStatus: cart_1.cartStatus.order,
                isGuest: customerDetails.isGuest ?? false,
                orderStatus: cart_1.orderStatusMap['1'].value,
                orderStatusAt: new Date(),
            };
            const updateCart = await cart_order_model_1.default.findByIdAndUpdate(cartDetails._id, cartUpdate, { new: true, useFindAndModify: false });
            if (!updateCart) {
                return {
                    _id: cartDetails?._id,
                    orderId: cartDetails.orderId,
                    status: false,
                    message: 'Cart updation failed'
                };
            }
            else {
                if (cartProducts) {
                    await cart_order_product_model_1.default.updateMany({ cartId: cartDetails._id }, { orderProductStatusAt: new Date() }, { new: true, useFindAndModify: false });
                    const updateProductVariant = cartProducts.map((products) => ({
                        updateOne: {
                            filter: { _id: products.variantId },
                            update: { $inc: { quantity: -products.quantity } },
                        }
                    }));
                    await product_variants_model_1.default.bulkWrite(updateProductVariant);
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
                    if (!shippingAddressDetails) {
                        shippingAddressDetails = await customer_address_model_1.default.findById(cartDetails.shippingId);
                    }
                    let commonDeliveryDays = '6';
                    if (defualtSettings && defualtSettings.blockValues && defualtSettings.blockValues.commonDeliveryDays) {
                        commonDeliveryDays = defualtSettings.blockValues.commonDeliveryDays;
                    }
                    const expectedDeliveryDate = (0, helpers_1.calculateExpectedDeliveryDate)(cartUpdate.orderStatusAt, Number(commonDeliveryDays));
                    const taxDetails = await tax_model_1.default.findOne({ countryId: cartDetails.countryId, status: "1" });
                    if (cartUpdate.pickupStoreId) {
                    }
                    ejs.renderFile(path_1.default.join(__dirname, '../../views/email/order', 'order-creation-email.ejs'), {
                        firstName: customerDetails?.firstName,
                        orderId: updateCart.orderId,
                        totalAmount: cartUpdate.totalAmount,
                        totalShippingAmount: updateCart.totalShippingAmount,
                        totalProductAmount: updateCart.totalProductAmount,
                        totalTaxAmount: updateCart.totalTaxAmount,
                        totalProductOriginalPrice: updateCart.totalProductOriginalPrice,
                        totalGiftWrapAmount: updateCart.totalGiftWrapAmount,
                        totalCouponAmount: updateCart.totalCouponAmount,
                        totalDiscountAmount: updateCart.totalDiscountAmount,
                        paymentMethodCharge: updateCart.paymentMethodCharge,
                        orderComments: updateCart?.orderComments,
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
                        currencyCode: countryData?.currencyCode,
                        expectedDeliveryDate,
                        socialMedia,
                        appUrls,
                        storeEmail: basicDetailsSettings?.storeEmail,
                        storePhone: basicDetailsSettings?.storePhone,
                        shopDescription: convert(basicDetailsSettings?.shopDescription, { wordwrap: 130 }),
                        products: cartProducts,
                        shopName: basicDetailsSettings?.shopName || `${process.env.SHOPNAME}`,
                        shopLogo: `${process.env.SHOPLOGO}`,
                        appUrl: `${process.env.APPURL}`,
                        tax: taxDetails
                    }, async (err, template) => {
                        if (err) {
                            console.log("err", err);
                        }
                        const emailValues = {
                            subject: cart_1.orderStatusMessages['1'],
                            email: customerDetails.email,
                            ccmail: [basicDetailsSettings?.storeEmail]
                        };
                        if (process.env.SHOPNAME === 'Timehouse') {
                            const sendEmail = await (0, mail_chimp_sms_gateway_1.mailChimpEmailGateway)(emailValues, template);
                        }
                        else if (process.env.SHOPNAME === 'Homestyle') {
                            const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)(emailValues, template);
                        }
                        else if (process.env.SHOPNAME === 'Beyondfresh') {
                            const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)(emailValues, template);
                        }
                        else if (process.env.SHOPNAME === 'Smartbaby') {
                            const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)(emailValues, template);
                            const sendsms = await (0, bulk_sms_gateway_1.bulkSmsGateway)({ ...customerDetails.toObject(), message: (0, messages_1.createOrder)(cartDetails?.orderId) });
                        }
                    });
                }
                return {
                    _id: cartDetails?._id,
                    orderId: cartDetails?.orderId,
                    status: true,
                    message: 'Cart updation success'
                };
            }
        }
    }
    async updateCouponCodeOrder(couponDetails, cartDetails, cartUpdate) {
        if (couponDetails) {
            const cartProductDetails = await cart_order_product_model_1.default.find({ cartId: cartDetails?._id });
            const productIds = cartProductDetails.map((product) => product.productId.toString());
            const couponAmount = couponDetails?.discountAmount;
            const discountType = couponDetails.discountType;
            const updateTotalCouponAmount = (productAmount, discountAmount, discountType) => {
                if (productAmount) {
                    const couponDiscountAmount = (0, helpers_1.calculateTotalDiscountAmountDifference)(productAmount, discountType, discountAmount);
                    const totalCouponAmount = Number((discountType === cart_1.couponDiscountType.percentage) ? Math.min(couponDiscountAmount, Number(couponDetails?.discountMaxRedeemAmount)) : couponDiscountAmount);
                    const cartTotalAmount = (parseFloat(cartDetails?.totalAmount.toFixed(2)) || 0) - totalCouponAmount;
                    cartUpdate = {
                        ...cartUpdate,
                        couponId: couponDetails._id,
                        totalAmount: Number(cartTotalAmount.toFixed(2)),
                        totalCouponAmount: Number(totalCouponAmount.toFixed(2))
                    };
                }
            };
            var totalAmount = 0;
            if (couponDetails?.couponType == cart_1.couponTypes.entireOrders) {
                updateTotalCouponAmount(cartDetails?.totalProductAmount, couponAmount, discountType);
            }
            else if (couponDetails?.couponType == cart_1.couponTypes.forProduct) {
                cartProductDetails.map(async (product) => {
                    if (couponDetails?.couponApplyValues.includes((product.productId.toString()))) {
                        totalAmount += Number(product.productAmount.toFixed(2));
                    }
                });
                updateTotalCouponAmount(totalAmount, couponAmount, discountType);
            }
            else if (couponDetails?.couponType == cart_1.couponTypes.forCategory) {
                const productCategoryDetails = await product_category_link_model_1.default.find({ productId: { $in: productIds } });
                productCategoryDetails.map(async (category) => {
                    if (couponDetails?.couponApplyValues.includes((category.categoryId.toString()))) {
                        const matchProduct = cartProductDetails.find((cartProduct) => cartProduct.productId.toString() === category.productId.toString());
                        if (matchProduct) {
                            totalAmount += Number(matchProduct.productAmount.toFixed(2));
                        }
                    }
                });
                updateTotalCouponAmount(totalAmount, couponAmount, discountType);
            }
            else if (couponDetails?.couponType == cart_1.couponTypes.forBrand) {
                const productDetails = await product_model_1.default.find({ _id: { $in: productIds } });
                productDetails.map(async (product) => {
                    if (couponDetails?.couponApplyValues.includes((product.brand.toString()))) {
                        const matchProduct = cartProductDetails.find((cartProduct) => cartProduct.productId.toString() === product._id.toString());
                        if (matchProduct) {
                            totalAmount += Number(matchProduct.productAmount.toFixed(2));
                        }
                    }
                });
                updateTotalCouponAmount(totalAmount, couponAmount, discountType);
            }
            return cartUpdate;
        }
    }
}
exports.default = new CheckoutService();
