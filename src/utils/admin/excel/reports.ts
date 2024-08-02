import { Response } from "express";
import { generateExcelFile } from "../../../lib/excel/excel-generator";

export const exportCustomerReport = async (res: Response, customerData: any) => {
    const customersData = customerData.map((customer: any) => {
        const addressBook: any = {};
        customer?.address.forEach((addr: any, index: number) => {
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
    const addressColumns = customerData.reduce((acc: any, customer: any) => {
        customer.address.forEach((_: any, index: number) => {
            acc.push(`addressBook[${index + 1}]State`, `addressBook[${index + 1}]City`);
        });
        return Array.from(new Set(acc));
    }, []);
    await generateExcelFile(res, customersData, ['id', 'name', 'phone', 'email', 'guestEmail', 'isVerified', 'lastOrderDate', ...addressColumns, 'created_date', 'fromGuest', 'addressBook', 'credits', 'orderTotalAmount', 'totalOrderCount'], 'Customers')
}

export const exportOrderReport = async (res: Response, orderData: any) => {
    const ordersData = orderData.map((order: any) => {

        return {
            id: order._id.toString(),
            orderId: order.cartDetails.orderId,
            orderComments: order.cartDetails.orderComments,
            productTitle: order.productsDetails.productvariants.extraProductTitle ? order.productsDetails.productvariants.extraProductTitle : order.productsDetails.productTitle,
            sku: order.productsDetails.productvariants.sku,
            mrp: order.productsDetails.productvariants.price,
            // discount: order.lastOrderDate,
            // subtotal: order.productAmount,
            // fromGuest: order.isGuest,
            // addressBook: order?.address && order.address.length > 0 ? JSON.stringify(order.address) : null,
            // credits: order.totalRewardPoint,
            // orderTotalAmount: order.orderTotalAmount,
            // totalOrderCount: order.totalOrderCount
        };
    });
    // const addressColumns = orderData.reduce((acc: any, order: any) => {
    //     order.address.forEach((_: any, index: number) => {
    //         acc.push(`addressBook[${index + 1}]State`, `addressBook[${index + 1}]City`);
    //     });
    //     return Array.from(new Set(acc));
    // }, []);
    await generateExcelFile(res, ordersData, ['id', 'orderId', 'orderComments', 'productTitle', 'sku', 'mrp'], 'Orders')
}