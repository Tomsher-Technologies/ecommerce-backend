"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const cart_order_model_1 = __importDefault(require("../../../model//frontend/cart-order-model"));
const customer_config_1 = require("../../../utils/config/customer-config");
const customers_model_1 = __importDefault(require("../../../model/frontend/customers-model"));
const product_variants_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-variants-model"));
class DashboardService {
    async findAll(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        const pipeline = [
            customer_config_1.whishlistLookup,
            customer_config_1.orderLookup,
            customer_config_1.addField,
            customer_config_1.customerProject,
            { $match: query },
            { $sort: finalSort },
            { $limit: limit },
            { $sort: finalSort },
        ];
        console.log("query", query.countryId);
        const totalOrders = await cart_order_model_1.default.aggregate([
            {
                $match: { countryId: query.countryId }
            },
            {
                $group: {
                    _id: { countryId: "$countryId" }
                }
            },
            {
                $count: "totalOrders"
            }
        ]);
        const totalOrdersCount = totalOrders.length > 0 ? totalOrders[0].totalOrders : 0;
        const totalUsers = await customers_model_1.default.countDocuments();
        const totalSKUs = await product_variants_model_1.default.aggregate([
            {
                $match: { countryId: query.countryId }
            },
            {
                $group: {
                    _id: { variantSku: "$variantSku", countryId: "$countryId" }
                }
            },
            {
                $count: "totalSKUs"
            }
        ]);
        const totalSKUsCount = totalSKUs.length > 0 ? totalSKUs[0].totalSKUs : 0;
        const outOfStockSKUs = await product_variants_model_1.default.aggregate([
            {
                $match: { quantity: 0, countryId: query.countryId }
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
        console.log("***", totalOrders, totalSKUs, totalUsers, outOfStockSKUs);
        const counts = {
            totalOrders: totalOrdersCount,
            totalSKUs: totalSKUsCount,
            totalUsers: totalUsers,
            outOfStockSKUs: outOfStockSKUsCount
        };
        return counts;
        // const createdCartWithValues = await CartOrderModel.aggregate(pipeline);
        // return createdCartWithValues;
    }
    async findSalesComparison(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
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
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const todayOrders = await cart_order_model_1.default.find({ createdAt: { $gte: today, $lt: tomorrow } });
        const yesterdayOrders = await cart_order_model_1.default.find({ createdAt: { $gte: yesterday, $lt: today } });
        const todaySales = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const yesterdaySales = yesterdayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const orderComparison = todayOrders.length - yesterdayOrders.length;
        const salesComparison = todaySales - yesterdaySales;
        const counts = {
            todayOrders: todayOrders.length,
            todaySales: todaySales,
            orderComparison: orderComparison,
            salesComparison: salesComparison
        };
        return counts;
        // const createdCartWithValues = await CartOrderModel.aggregate(pipeline);
        // return createdCartWithValues;
    }
    async findTotalSales(options = {}) {
        const { salesQuery, fromDate, endDate } = options;
        console.log(salesQuery, "dfdsf");
        const salesData = await cart_order_model_1.default.aggregate([
            {
                $match: salesQuery
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
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
        console.log("-----------", dateRange);
        const labels = dateRange;
        const sales = dateRange.map((date) => salesMap[date] || 0);
        const salesGraph = {
            labels: labels,
            sales: sales
        };
        return salesGraph;
        // const createdCartWithValues = await CartOrderModel.aggregate(pipeline);
        // return createdCartWithValues;
    }
    async findTotalOrder(options = {}) {
        const { salesQuery, fromDate, endDate } = options;
        console.log(salesQuery, "dfdsf");
        const ordersData = await cart_order_model_1.default.aggregate([
            {
                $match: {
                    createdAt: salesQuery
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    totalOrders: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);
        const dateRange = await this.generateDateRange(fromDate, endDate);
        const orderMap = ordersData.reduce((map, item) => {
            map[item._id] = item.totalOrders;
            return map;
        }, {});
        console.log("-----------", ordersData);
        const labels = dateRange;
        const orders = dateRange.map((date) => orderMap[date] || 0);
        const orderGraph = {
            labels: labels,
            orders: orders
        };
        return orderGraph;
        // const createdCartWithValues = await CartOrderModel.aggregate(pipeline);
        // return createdCartWithValues;
    }
    async generateDateRange(startDate, endDate) {
        const dates = [];
        let currentDate = new Date(startDate);
        while (currentDate <= new Date(endDate)) {
            dates.push(new Date(currentDate).toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    }
}
exports.default = new DashboardService();