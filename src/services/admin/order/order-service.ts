import { pagination } from '../../../components/pagination';
import { blockReferences, websiteSetup } from '../../../constants/website-setup';
import CartOrderModel, { CartOrderProps } from '../../../model/frontend/cart-order-model';
import { cartDeatilProject, cartProductsLookup, cartProject, couponLookup, customerLookup, getOrderProductsWithCartLookup, orderListObjectLookup, paymentMethodLookup, pickupStoreLookup, shippingAndBillingLookup, } from '../../../utils/config/cart-order-config';
import { countriesLookup } from '../../../utils/config/customer-config';
import { productLookup } from '../../../utils/config/product-config';
import { productVariantsLookupValues } from '../../../utils/config/wishlist-config';
import SettingsService from '../setup/settings-service';
import { calculateWalletRewardPoints } from '../../../utils/helpers';
import { earnTypes } from '../../../constants/wallet';

import CustomerWalletTransactionsModel from '../../../model/frontend/customer-wallet-transaction-model';
import CustomerService from '../../frontend/customer-service';
import CartOrderProductsModel from '../../../model/frontend/cart-order-product-model';

class OrderService {

    async OrderList(options: any): Promise<CartOrderProps[]> {
        const { query, skip, limit, sort, getTotalCount } = pagination(options.query || {}, options);
        const { getAddress, getCartProducts } = options;

        const defaultSort = { orderStatusAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        const modifiedPipeline = {
            $lookup: {
                ...cartProductsLookup.$lookup,
                pipeline: [
                    productLookup,
                    // productBrandLookupValues,
                    // { $unwind: { path: "$productDetails.brand", preserveNullAndEmptyArrays: true } },
                    { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
                    productVariantsLookupValues("1"),
                    // attributePipeline,
                    { $unwind: { path: "$productDetails.variantDetails", preserveNullAndEmptyArrays: true } },
                ]
            }
        };
        const pipeline: any[] = [
            ...((!getTotalCount && getCartProducts === '1') ? [modifiedPipeline] : [cartProductsLookup]),
            ...((!getTotalCount && getCartProducts) ? [couponLookup, { $unwind: { path: "$couponDetails", preserveNullAndEmptyArrays: true } }] : []),
            ...(!getTotalCount ? [paymentMethodLookup, customerLookup, pickupStoreLookup, {
                $unwind: {
                    path: "$pickupFromStore",
                    preserveNullAndEmptyArrays: true
                }
            }, orderListObjectLookup] : []),
            ...((!getTotalCount && getAddress === '1') ? shippingAndBillingLookup('shippingId', 'shippingAddress') : []),
            ...((!getTotalCount && getAddress === '1') ? shippingAndBillingLookup('billingId', 'billingAddress') : []),
            countriesLookup,
            {
                $unwind: {
                    path: "$country",
                    preserveNullAndEmptyArrays: true
                }
            },
            { $match: query },
            ...((!getTotalCount && getCartProducts === '1') ? [cartDeatilProject] : [cartProject]),
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

        const createdCartWithValues = await CartOrderModel.aggregate(pipeline);
        return createdCartWithValues;
    }

    async getOrdeReturnProducts(options: any): Promise<any> {
        const { query, skip, limit, sort, getTotalCount } = pagination(options.query || {}, options);
        const defaultSort = { orderStatusAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        let pipeline = getOrderProductsWithCartLookup(query, true);
        if (!getTotalCount) {
            if (skip) {
                pipeline.push({ $skip: skip } as any);
            }
            if (limit) {
                pipeline.push({ $limit: limit } as any);
            }
        }
        pipeline.push({ $sort: finalSort } as any);
        if (getTotalCount) {
            const countPipeline = getOrderProductsWithCartLookup(query, false);
            countPipeline.push({ $count: 'totalCount' } as any);
            const [{ totalCount = 0 } = {}] = await CartOrderProductsModel.aggregate(countPipeline);
            return { totalCount };
        } else {
            return await CartOrderProductsModel.aggregate(pipeline);
        }
    }


    async orderStatusUpdate(orderId: string, orderData: any, getCartProducts: string = '0'): Promise<CartOrderProps | null> {
        const updatedBrand = await CartOrderModel.findByIdAndUpdate(
            orderId,
            orderData,
            { new: true, useFindAndModify: false }
        );
        const modifiedPipeline = {
            $lookup: {
                ...cartProductsLookup.$lookup,
                pipeline: [
                    productLookup,
                    { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
                    productVariantsLookupValues("1"),
                    { $unwind: { path: "$productDetails.variantDetails", preserveNullAndEmptyArrays: true } },
                ]
            }
        };
        if (updatedBrand) {
            const pipeline = [
                { $match: { _id: updatedBrand._id } },
                ...(getCartProducts === '1' ? [modifiedPipeline] : [cartProductsLookup]),
                paymentMethodLookup,
                customerLookup,
                countriesLookup,
                {
                    $unwind: {
                        path: "$country",
                        preserveNullAndEmptyArrays: true
                    }
                },
                orderListObjectLookup,
                ...(getCartProducts === '1' ? [cartDeatilProject] : [cartProject]),
            ];

            const updatedBrandWithValues = await CartOrderModel.aggregate(pipeline);

            return updatedBrandWithValues[0];
        } else {
            return null;
        }
    }
    async orderWalletAmountTransactions(orderStatus: string, orderDetails: any, customerDetails: any): Promise<any> {
        const walletTransactionDetails = await CustomerWalletTransactionsModel.findOne({ orderId: orderDetails._id })
        if ((orderStatus === '5' || orderStatus === '12') && !walletTransactionDetails) {
            const walletsDetails = await SettingsService.findOne({ countryId: orderDetails.countryId, block: websiteSetup.basicSettings, blockReference: blockReferences.wallets });
            if ((walletsDetails) && (walletsDetails.blockValues) && (walletsDetails.blockValues.enableWallet) && (Number(walletsDetails.blockValues.orderAmount) > 0) && (orderDetails?.totalAmount >= Number(walletsDetails.blockValues.minimumOrderAmount))) {
                const rewarDetails = calculateWalletRewardPoints(walletsDetails.blockValues, orderDetails.totalAmount)
                await CustomerWalletTransactionsModel.create({
                    customerId: orderDetails.customerId,
                    orderId: orderDetails._id,
                    earnType: earnTypes.order,
                    walletAmount: rewarDetails.redeemableAmount,
                    walletPoints: rewarDetails.rewardPoints,
                    status: '1'
                });
                if (customerDetails) {
                    await CustomerService.update(customerDetails?._id, {
                        totalRewardPoint: (customerDetails.totalRewardPoint + rewarDetails.rewardPoints),
                        totalWalletAmount: (customerDetails.totalWalletAmount + rewarDetails.redeemableAmount)
                    });
                }
                orderDetails.rewardAmount = rewarDetails.redeemableAmount;
                orderDetails.rewardPoints = rewarDetails.rewardPoints;
            }
        } else if ((orderStatus === '8' || orderStatus === '6') && walletTransactionDetails) {
            await CustomerWalletTransactionsModel.findByIdAndUpdate(walletTransactionDetails._id, {
                earnType: orderStatus === '8' ? earnTypes.orderReturned : earnTypes.orderCancelled,
                status: '3' // rejected
            });
            await CustomerService.update(customerDetails?._id, {
                totalRewardPoint: (customerDetails.totalRewardPoint - walletTransactionDetails.walletPoints),
                totalWalletAmount: (customerDetails.totalWalletAmount - walletTransactionDetails.walletAmount)
            });
            orderDetails.rewardAmount = 0;
            orderDetails.rewardPoints = 0;
        }
    }

    async orderListExcelExport(options: any): Promise<any> {
        const { query, skip, limit, sort, getTotalCount } = pagination(options.query || {}, options);

        const defaultSort = { 'cartDetails.orderStatusAt': -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        let pipeline = getOrderProductsWithCartLookup(query, true, '1', '1');
        pipeline.push({ $sort: finalSort } as any);

        if (!getTotalCount) {
            if (skip) {
                pipeline.push({ $skip: skip } as any);
            }
            if (limit) {
                pipeline.push({ $limit: limit } as any);
            }
        }

        pipeline.push({
            $group: {
                _id: null,
                totalCartAmount: { $sum: "$cartDetails.totalAmount" },
                totalQuantity: { $sum: "$quantity" },
                totalMRP: { $sum: "$productsDetails.productvariants.price" },
                totalSubtotal: { $sum: "$productAmount" },
                totalDiscountAmount: { $sum: "$productDiscountAmount" },
                orders: { $push: "$$ROOT" }
            }
        });

        pipeline.push({
            $project: {
                _id: 0,
                totalCartAmount: 1,
                totalQuantity: 1,
                totalMRP: 1,
                totalSubtotal: 1,
                totalDiscountAmount: 1,
                orders: 1,
            }
        });

        const results = await CartOrderProductsModel.aggregate(pipeline);
        const [aggregatedData] = results; // Assuming there is only one result from the aggregation

        if (!aggregatedData) {
            return {
                totalCartAmount: 0,
                totalQuantity: 0,
                totalMRP: 0,
                totalSubtotal: 0,
                totalDiscountAmount: 0,
                orders: [],
            };
        }

        const paginatedOrders = aggregatedData.orders;

        // Define pagination parameters for cartDetails
        const cartLimit = 2; // Number of cartDetails per page, adjust as needed

        // Paginate cartDetails within each order
        const finalResult = paginatedOrders.map((order: any) => {
            // Check if cartDetails is an array and paginate
            const cartDetailsArray = Array.isArray(order.cartDetails) ? order.cartDetails : [];

            // Paginate cartDetails
            const paginatedCartDetails = cartDetailsArray.slice(0, cartLimit);

            return {
                ...order,
                cartDetails: paginatedCartDetails, // Paginate items within the order
            };
        });

        return {
            totalCartAmount: aggregatedData.totalCartAmount,
            totalQuantity: aggregatedData.totalQuantity,
            totalMRP: aggregatedData.totalMRP,
            totalSubtotal: aggregatedData.totalSubtotal,
            totalDiscountAmount: aggregatedData.totalDiscountAmount,
            orders: finalResult,
        };
    }
}

export default new OrderService();
