"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportOrderReport = exports.exportCustomerReport = void 0;
const excel_generator_1 = require("../../../lib/excel/excel-generator");
const cart_1 = require("../../../constants/cart");
const exportCustomerReport = async (res, customerData) => {
    const customersData = customerData.map((customer) => {
        const addressBook = {};
        customer?.address.forEach((addr, index) => {
            addressBook[`addressBook[${index + 1}]State`] = addr.state || '';
            addressBook[`addressBook[${index + 1}]City`] = addr.city || '';
        });
        return {
            id: customer._id.toString(),
            name: customer.firstName,
            phone: customer.phone,
            email: customer.email,
            guestEmail: customer.guestEmail,
            isVerified: customer.isVerified,
            lastOrderDate: customer.lastOrderDate,
            ...addressBook,
            created_date: customer.createdAt,
            fromGuest: customer.isGuest,
            addressBook: customer?.address && customer.address.length > 0 ? JSON.stringify(customer.address) : null,
            credits: customer.totalRewardPoint,
            orderTotalAmount: customer.orderTotalAmount,
            totalOrderCount: customer.totalOrderCount
        };
    });
    const addressColumns = customerData.reduce((acc, customer) => {
        customer.address.forEach((_, index) => {
            acc.push(`addressBook[${index + 1}]State`, `addressBook[${index + 1}]City`);
        });
        return Array.from(new Set(acc));
    }, []);
    await (0, excel_generator_1.generateExcelFile)(res, customersData, ['id', 'name', 'phone', 'email', 'guestEmail', 'isVerified', 'lastOrderDate', ...addressColumns, 'created_date', 'fromGuest', 'addressBook', 'credits', 'orderTotalAmount', 'totalOrderCount'], 'Customers');
};
exports.exportCustomerReport = exportCustomerReport;
const exportOrderReport = async (res, orderData) => {
    const ordersData = orderData.map((order) => {
        const categoryTitles = order.productsDetails.productCategory.map((cat) => cat.category.categoryTitle).join(', ');
        return {
            id: order._id.toString(),
            orderId: order.cartDetails.orderId,
            brand: order.productsDetails.brand.brandTitle,
            orderComments: order.cartDetails.orderComments,
            productTitle: order.productsDetails.productvariants.extraProductTitle ? order.productsDetails.productvariants.extraProductTitle : order.productsDetails.productTitle,
            sku: order.productsDetails.productvariants.variantSku,
            quantity: order.quantity,
            mrp: order.productsDetails.productvariants.price,
            subtotal: order.productAmount,
            totalWithCancel: order.returnedProductAmount > 0 ? (order.productAmount - order.returnedProductAmount) : 0,
            category: categoryTitles,
            createdAt: order.orderProductStatus === '1' ? order.orderProductStatusAt : null,
            status: cart_1.orderProductStatusMap[order.orderProductStatus].label,
            deliveredAt: order.orderProductStatus === '5' ? order.orderProductStatusAt : null,
            billingName: order.billingAddress.name,
            shippingName: order.shippingAddress.name,
            paymentMethod: order.paymentMethod.paymentMethodTitle,
            shippingAddress: JSON.stringify(order.shippingAddress),
            shippingPhone: order.shippingAddress.phoneNumber,
            billingAddress: JSON.stringify(order.billingAddress),
            billingPhone: order.billingAddress.phoneNumber,
        };
    });
    const totals = ordersData.reduce((acc, order) => {
        acc.subtotal += order.subtotal;
        acc.quantity += order.quantity;
        acc.mrp += order.mrp;
        return acc;
    }, { subtotal: 0, quantity: 0, mrp: 0 });
    ordersData.push({
        id: 'Total',
        orderId: '',
        brand: '',
        orderComments: '',
        productTitle: '',
        sku: '',
        quantity: totals.quantity,
        mrp: totals.mrp,
        subtotal: totals.subtotal,
        totalWithCancel: '',
        category: '',
        createdAt: '',
        status: '',
        deliveredAt: '',
        billingName: '',
        shippingName: '',
        paymentMethod: '',
        shippingAddress: '',
        shippingPhone: '',
        billingAddress: '',
        billingPhone: '',
    });
    await (0, excel_generator_1.generateExcelFile)(res, ordersData, ['id', 'orderId', 'brand', 'orderComments', 'productTitle', 'sku', 'mrp', 'category', 'createdAt', 'deliveredAt'], 'Orders');
};
exports.exportOrderReport = exportOrderReport;
