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

export const exportOrderReport = async (res: Response, orderData: any, orderSum: any) => {
    const ordersData = orderData.map((order: any) => {
        const categoryTitles = order.productsDetails.productCategory.map((cat: any) => cat.category.categoryTitle).join(', ');

        return {
            Id: order._id.toString(),
            'Order Id': order.cartDetails.orderId,
            Brand: order.productsDetails.brand.brandTitle,
            Category: categoryTitles,
            'Delivery instructions': order.cartDetails.orderComments,
            'Product Title': order.productsDetails.productvariants.extraProductTitle ? order.productsDetails.productvariants.extraProductTitle : order.productsDetails.productTitle,
            SKU: order.productsDetails.productvariants.variantSku,
            Quantity: order.quantity,
            MRP: order.productsDetails.productvariants.price,
            'Discount Amount': order.productDiscountAmount,
            'Sub Total': order.productAmount,
            'Total With Cancel': order.returnedProductAmount > 0 ? (order.productAmount - order.returnedProductAmount) : 0,
            'Created At': order.orderProductStatus === '1' ? order.orderProductStatusAt : null,
            Status: order.orderProductStatus ? orderProductStatusMap[order.orderProductStatus].label : null,
            'Delivered At': order.orderProductStatus === '5' ? order.orderProductStatusAt : null,
            'Billing Name': order.billingAddress.name,
            'Shipping Name': order.shippingAddress.name,
            'Payment Method': order.paymentMethod.paymentMethodTitle,
            'Shipping Address': JSON.stringify(order.shippingAddress),
            'Shipping Phone': order.shippingAddress.phoneNumber,
            'Billing Address': JSON.stringify(order.billingAddress),
            'Billing Phone': order.billingAddress.phoneNumber,

        }
    });

    ordersData.push({
        Id: 'Total',
        'Order Id': '',
        Brand: '',
        Category: '',
        'Delivery instructions': '',
        'Product Title': '',
        SKU: '',
        Quantity: orderSum.totalQuantity,
        MRP: orderSum.totalMRP,
        'Discount Amount': orderSum.totalDiscountAmount,
        'Sub Total': orderSum.totalSubtotal,
        'Total With Cancel': '',
        'Created At': '',
        Status: '',
        'Delivered At': '',
        'Billing Name': '',
        'Shipping Name': '',
        'Payment Method': '',
        'Shipping Address': '',
        'Shipping Phone': '',
        'Billing Address': '',
        'Billing Phone': '',
    });
    await generateExcelFile(res, ordersData, ['Id', 'Order Id', 'Brand', 'Category', 'Delivery instructions', 'Product Title', 'SKU', 'Quantity', 'MRP', 'Discount Amount', 'Sub Total', 'Total With Cancel', 'Created At', 'Status', 'Delivered At', 'Billing Name', 'Shipping Name', 'Payment Method', 'Shipping Address', 'Shipping Phone', 'Billing Address', 'Billing Phone'], 'Orders')
}