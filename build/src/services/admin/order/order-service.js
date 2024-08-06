"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const website_setup_1 = require("../../../constants/website-setup");
const cart_order_model_1 = __importDefault(require("../../../model/frontend/cart-order-model"));
const cart_order_config_1 = require("../../../utils/config/cart-order-config");
const customer_config_1 = require("../../../utils/config/customer-config");
const product_config_1 = require("../../../utils/config/product-config");
const wishlist_config_1 = require("../../../utils/config/wishlist-config");
const settings_service_1 = __importDefault(require("../setup/settings-service"));
const helpers_1 = require("../../../utils/helpers");
const wallet_1 = require("../../../constants/wallet");
const customer_wallet_transaction_model_1 = __importDefault(require("../../../model/frontend/customer-wallet-transaction-model"));
const customer_service_1 = __importDefault(require("../../frontend/customer-service"));
const cart_order_product_model_1 = __importDefault(require("../../../model/frontend/cart-order-product-model"));
class OrderService {
    async OrderList(options) {
        const { query, skip, limit, sort, getTotalCount } = (0, pagination_1.pagination)(options.query || {}, options);
        const { getAddress, getCartProducts } = options;
        const defaultSort = { orderStatusAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        const modifiedPipeline = {
            $lookup: {
                ...cart_order_config_1.cartProductsLookup.$lookup,
                pipeline: [
                    product_config_1.productLookup,
                    // productBrandLookupValues,
                    // { $unwind: { path: "$productDetails.brand", preserveNullAndEmptyArrays: true } },
                    { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
                    (0, wishlist_config_1.productVariantsLookupValues)("1"),
                    // attributePipeline,
                    { $unwind: { path: "$productDetails.variantDetails", preserveNullAndEmptyArrays: true } },
                ]
            }
        };
        const pipeline = [
            ...((!getTotalCount && getCartProducts === '1') ? [modifiedPipeline] : [cart_order_config_1.cartProductsLookup]),
            ...((!getTotalCount && getCartProducts) ? [cart_order_config_1.couponLookup, { $unwind: { path: "$couponDetails", preserveNullAndEmptyArrays: true } }] : []),
            ...(!getTotalCount ? [cart_order_config_1.paymentMethodLookup, cart_order_config_1.customerLookup, cart_order_config_1.pickupStoreLookup, {
                    $unwind: {
                        path: "$pickupFromStore",
                        preserveNullAndEmptyArrays: true
                    }
                }, cart_order_config_1.orderListObjectLookup] : []),
            ...((!getTotalCount && getAddress === '1') ? (0, cart_order_config_1.shippingAndBillingLookup)('shippingId', 'shippingAddress') : []),
            ...((!getTotalCount && getAddress === '1') ? (0, cart_order_config_1.shippingAndBillingLookup)('billingId', 'billingAddress') : []),
            customer_config_1.countriesLookup,
            {
                $unwind: {
                    path: "$country",
                    preserveNullAndEmptyArrays: true
                }
            },
            { $match: query },
            ...((!getTotalCount && getCartProducts === '1') ? [cart_order_config_1.cartDeatilProject] : [cart_order_config_1.cartProject]),
        ];
        if (!getTotalCount) {
            pipeline.push({ $sort: finalSort });
        }
        if (!getTotalCount && skip) {
            pipeline.push({ $skip: skip });
        }
        if (!getTotalCount && limit) {
            pipeline.push({ $limit: limit });
        }
        const createdCartWithValues = await cart_order_model_1.default.aggregate(pipeline);
        return createdCartWithValues;
    }
    async getOrdeReturnProducts(options) {
        const { query, skip, limit, sort, getTotalCount } = (0, pagination_1.pagination)(options.query || {}, options);
        const defaultSort = { orderStatusAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        let pipeline = (0, cart_order_config_1.getOrderProductsWithCartLookup)(query, true);
        if (!getTotalCount) {
            if (skip) {
                pipeline.push({ $skip: skip });
            }
            if (limit) {
                pipeline.push({ $limit: limit });
            }
        }
        pipeline.push({ $sort: finalSort });
        if (getTotalCount) {
            const countPipeline = (0, cart_order_config_1.getOrderProductsWithCartLookup)(query, false);
            countPipeline.push({ $count: 'totalCount' });
            const [{ totalCount = 0 } = {}] = await cart_order_product_model_1.default.aggregate(countPipeline);
            return { totalCount };
        }
        else {
            return await cart_order_product_model_1.default.aggregate(pipeline);
        }
    }
    async orderStatusUpdate(orderId, orderData, getCartProducts = '0') {
        const updatedBrand = await cart_order_model_1.default.findByIdAndUpdate(orderId, orderData, { new: true, useFindAndModify: false });
        const modifiedPipeline = {
            $lookup: {
                ...cart_order_config_1.cartProductsLookup.$lookup,
                pipeline: [
                    product_config_1.productLookup,
                    { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
                    (0, wishlist_config_1.productVariantsLookupValues)("1"),
                    { $unwind: { path: "$productDetails.variantDetails", preserveNullAndEmptyArrays: true } },
                ]
            }
        };
        if (updatedBrand) {
            const pipeline = [
                { $match: { _id: updatedBrand._id } },
                ...(getCartProducts === '1' ? [modifiedPipeline] : [cart_order_config_1.cartProductsLookup]),
                cart_order_config_1.paymentMethodLookup,
                cart_order_config_1.customerLookup,
                cart_order_config_1.orderListObjectLookup,
                ...(getCartProducts === '1' ? [cart_order_config_1.cartDeatilProject] : [cart_order_config_1.cartProject]),
            ];
            const updatedBrandWithValues = await cart_order_model_1.default.aggregate(pipeline);
            return updatedBrandWithValues[0];
        }
        else {
            return null;
        }
    }
    async orderWalletAmountTransactions(orderStatus, orderDetails, customerDetails) {
        const walletTransactionDetails = await customer_wallet_transaction_model_1.default.findOne({ orderId: orderDetails._id });
        if ((orderStatus === '5' || orderStatus === '12') && !walletTransactionDetails) {
            const walletsDetails = await settings_service_1.default.findOne({ countryId: orderDetails.countryId, block: website_setup_1.websiteSetup.basicSettings, blockReference: website_setup_1.blockReferences.wallets });
            if ((walletsDetails) && (walletsDetails.blockValues) && (walletsDetails.blockValues.enableWallet) && (Number(walletsDetails.blockValues.orderAmount) > 0) && (orderDetails?.totalAmount >= Number(walletsDetails.blockValues.minimumOrderAmount))) {
                const rewarDetails = (0, helpers_1.calculateWalletRewardPoints)(walletsDetails.blockValues, orderDetails.totalAmount);
                await customer_wallet_transaction_model_1.default.create({
                    customerId: orderDetails.customerId,
                    orderId: orderDetails._id,
                    earnType: wallet_1.earnTypes.order,
                    walletAmount: rewarDetails.redeemableAmount,
                    walletPoints: rewarDetails.rewardPoints,
                    status: '1'
                });
                if (customerDetails) {
                    await customer_service_1.default.update(customerDetails?._id, {
                        totalRewardPoint: (customerDetails.totalRewardPoint + rewarDetails.rewardPoints),
                        totalWalletAmount: (customerDetails.totalWalletAmount + rewarDetails.redeemableAmount)
                    });
                }
                orderDetails.rewardAmount = rewarDetails.redeemableAmount;
                orderDetails.rewardPoints = rewarDetails.rewardPoints;
            }
        }
        else if ((orderStatus === '8' || orderStatus === '6') && walletTransactionDetails) {
            await customer_wallet_transaction_model_1.default.findByIdAndUpdate(walletTransactionDetails._id, {
                earnType: orderStatus === '8' ? wallet_1.earnTypes.orderReturned : wallet_1.earnTypes.orderCancelled,
                status: '3' // rejected
            });
            await customer_service_1.default.update(customerDetails?._id, {
                totalRewardPoint: (customerDetails.totalRewardPoint - walletTransactionDetails.walletPoints),
                totalWalletAmount: (customerDetails.totalWalletAmount - walletTransactionDetails.walletAmount)
            });
            orderDetails.rewardAmount = 0;
            orderDetails.rewardPoints = 0;
        }
    }
    async orderListExcelExport(options) {
        const { query, skip, limit, sort, getTotalCount } = (0, pagination_1.pagination)(options.query || {}, options);
        const defaultSort = { orderStatusAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        let pipeline = (0, cart_order_config_1.getOrderProductsWithCartLookup)(query, true, '1', '1');
        if (!getTotalCount) {
            if (skip) {
                pipeline.push({ $skip: skip });
            }
            if (limit) {
                pipeline.push({ $limit: limit });
            }
        }
        pipeline.push({ $sort: finalSort });
        return await cart_order_product_model_1.default.aggregate(pipeline);
    }
}
exports.default = new OrderService();
