import { Response } from "express";
import { generateExcelFile } from "../../../lib/excel/excel-generator";
import { orderProductStatusMap } from "../../../constants/cart";

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
        const categoryTitles = order.productsDetails.productCategory.map((cat: any) => cat.category.categoryTitle).join(', ');

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
            status: orderProductStatusMap[order.orderProductStatus].label,
            deliveredAt: order.orderProductStatus === '5' ? order.orderProductStatusAt : null,
            billingName: order.billingAddress.name,
            shippingName: order.shippingAddress.name,
            paymentMethod: order.paymentMethod.paymentMethodTitle,
            shippingAddress: JSON.stringify(order.shippingAddress),
            shippingPhone: order.shippingAddress.phoneNumber,
            billingAddress: JSON.stringify(order.billingAddress),
            billingPhone: order.billingAddress.phoneNumber,

        }
    });
    const totals = ordersData.reduce((acc: any, order: any) => {
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
    await generateExcelFile(res, ordersData, ['id', 'orderId', 'brand', 'orderComments', 'productTitle', 'sku', 'mrp', 'category', 'createdAt', 'deliveredAt'], 'Orders')
}