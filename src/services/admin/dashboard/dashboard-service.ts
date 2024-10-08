import mongoose from 'mongoose';
import { FilterOptionsProps, pagination } from '../../../components/pagination';
import CartOrderModel from '../../../model//frontend/cart-order-model';
import { whishlistLookup, customerProject, addField, orderLookup, billingLookup, shippingLookup, customerDetailProject, orderWalletTransactionLookup, referredWalletTransactionLookup, referrerWalletTransactionLookup } from '../../../utils/config/customer-config';
import CustomerModel from '../../../model/frontend/customers-model';
import ProductVariantsModel from '../../../model/admin/ecommerce/product/product-variants-model';


class DashboardService {
    async findAll(options: FilterOptionsProps = {}): Promise<any | null> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);

        const totalOrders = await CartOrderModel.aggregate([
            {
                $match: query
            },
            // {
            //     $group: {
            //         _id: { countryId: "$countryId" }
            //     }
            // },
            {
                $count: "totalOrders"
            }
        ])
        const totalOrdersCount = totalOrders.length > 0 ? totalOrders[0].totalOrders : 0;

        const totalUsers = await CustomerModel.countDocuments();
        const totalSKUs = await ProductVariantsModel.aggregate([
            {
                $match: query
            },
            {
                $group: {
                    _id: { variantSku: "$variantSku", countryId: "$countryId" }
                }
            },
            {
                $count: "totalSKUs"
            }
        ])

        const totalSKUsCount = totalSKUs.length > 0 ? totalSKUs[0].totalSKUs : 0;

        const outOfStockSKUs = await ProductVariantsModel.aggregate([
            {
                $match: {
                    quantity: 0,
                    ...query
                }
            },
            {
                $group: {
                    _id: { variantSku: "$variantSku", countryId: "$countryId" }
                }
            },
            {
                $count: "outOfStockSKUs"
            }
        ]);

        const outOfStockSKUsCount = outOfStockSKUs.length > 0 ? outOfStockSKUs[0].outOfStockSKUs : 0;
        const counts = {
            totalOrders: totalOrdersCount,
            totalSKUs: totalSKUsCount,
            totalUsers: totalUsers,
            outOfStockSKUs: outOfStockSKUsCount
        }
        return counts

        // const createdCartWithValues = await CartOrderModel.aggregate(pipeline);
        // return createdCartWithValues;
    }
    async findSalesComparison(options: FilterOptionsProps = {}): Promise<any | null> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);

        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        yesterday.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const todayOrders = await CartOrderModel.find({ $and: [{ orderStatusAt: { $gte: today, $lt: tomorrow } }, query] });
        const yesterdayOrders = await CartOrderModel.find({ $and: [{ orderStatusAt: { $gte: yesterday, $lt: today } }, query] });

        const todaySales = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const yesterdaySales = yesterdayOrders.reduce((sum, order) => sum + order.totalAmount, 0);

        const orderComparison = todayOrders.length - yesterdayOrders.length;
        const salesComparison = todaySales - yesterdaySales;

        const counts = {
            todayOrders: todayOrders.length,
            todaySales: todaySales,
            orderComparison: orderComparison,
            salesComparison: salesComparison.toFixed(2)
        };
        return counts

    }

    async findTotalSales(options: any = {}): Promise<any | null> {
        const { salesQuery, fromDate, endDate } = options;


        const salesData = await CartOrderModel.aggregate([
            {
                $match: { $and: [{ cartStatus: { $ne: "1" } }, salesQuery] },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$orderStatusAt" }
                    },
                    totalSales: { $sum: "$totalAmount" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);
        const dateRange = await this.generateDateRange(fromDate, endDate);
        const salesMap = salesData.reduce((map, item) => {
            map[item._id] = item.totalSales;
            return map;
        }, {});

        const labels = dateRange;
        const sales = dateRange.map((date: any) => salesMap[date] || 0);

        const salesGraph = {
            labels: labels,
            sales: sales
        };
        return salesGraph

        // const createdCartWithValues = await CartOrderModel.aggregate(pipeline);
        // return createdCartWithValues;
    }

    async findTotalOrder(options: any = {}): Promise<any | null> {
        const { salesQuery, fromDate, endDate } = options;

        // console.log(salesQuery, "dfdsf");

        const ordersData = await CartOrderModel.aggregate([
            {
                $match: { $and: [{ cartStatus: { $ne: "1" } }, salesQuery] },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$orderStatusAt" }
                    },
                    totalOrders: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ])
        const dateRange = await this.generateDateRange(fromDate, endDate);
        const orderMap = ordersData.reduce((map, item) => {
            map[item._id] = item.totalOrders;
            return map;
        }, {});

        const labels = dateRange;
        const orders = dateRange.map((date: any) => orderMap[date] || 0);

        const orderGraph = {
            labels: labels,
            orders: orders
        };
        return orderGraph

        // const createdCartWithValues = await CartOrderModel.aggregate(pipeline);
        // return createdCartWithValues;
    }

    async generateDateRange(startDate: any, endDate: any): Promise<any | null> {
        const dates = [];
        let currentDate = new Date(startDate);

        while (currentDate <= new Date(endDate)) {
            dates.push(new Date(currentDate).toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    }
}

export default new DashboardService();
