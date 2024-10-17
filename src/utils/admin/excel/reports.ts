import { Response } from "express";
import { generateExcelFile } from "../../../lib/excel/excel-generator";
import { orderProductStatusMap } from "../../../constants/cart";

export const exportCustomerReport = async (res: Response, customerData: any) => {
    const customersData = customerData.map((customer: any) => {
        const addressBook: any = {};
        if (customer && customer?.address && customer?.address.length > 0) {
            customer?.address.forEach((addr: any, index: number) => {
                addressBook[`addressBook[${index + 1}]State`] = addr.state || '';
                addressBook[`addressBook[${index + 1}]City`] = addr.city || '';
            });
        }
        return {
            // id: customer._id.toString(),
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
        if (customer && customer?.address && customer?.address.length > 0) {
            customer.address.forEach((_: any, index: number) => {
                acc.push(`addressBook[${index + 1}]State`, `addressBook[${index + 1}]City`);
            });
        }
        return Array.from(new Set(acc));
    }, []);
    await generateExcelFile(res, customersData, ['name', 'phone', 'email', 'guestEmail', 'isVerified', 'lastOrderDate', ...addressColumns, 'created_date', 'fromGuest', 'addressBook', 'credits', 'orderTotalAmount', 'totalOrderCount'], 'Customers')
}

export const exportOrderReport = async (res: Response, orderData: any, orderSum: any) => {
    const ordersData = orderData.map((order: any) => {
        const categoryTitles = order.productsDetails.productCategory.map((cat: any) => cat.category.categoryTitle).join(', ');
        const shippingAddress = {
            name: order.shippingAddress?.name,
            address1: order.shippingAddress?.address1,
            address2: order.shippingAddress?.address2,
            phoneNumber: order.shippingAddress?.phoneNumber,
            landlineNumber: order.shippingAddress?.landlineNumber,
            addressType: order.shippingAddress?.addressType,
            defaultAddress: order.shippingAddress?.defaultAddress,
            country: order.shippingAddress?.country,
            state: order.shippingAddress?.state,
            city: order.shippingAddress?.city,
            street: order.shippingAddress?.street,
            longitude: order.shippingAddress?.longitude,
            latitude: order.shippingAddress?.latitude,
            isGuest: order.shippingAddress?.isGuest,
        }
        const billingAddress = {
            name: order.billingAddress?.name,
            address1: order.billingAddress?.address1,
            address2: order.billingAddress?.address2,
            phoneNumber: order.billingAddress?.phoneNumber,
            landlineNumber: order.billingAddress?.landlineNumber,
            addressType: order.billingAddress?.addressType,
            defaultAddress: order.billingAddress?.defaultAddress,
            country: order.billingAddress?.country,
            state: order.billingAddress?.state,
            city: order.billingAddress?.city,
            street: order.billingAddress?.street,
            longitude: order.billingAddress?.longitude,
            latitude: order.billingAddress?.latitude,
            isGuest: order.billingAddress?.isGuest,
        }
        return {
            // Id: order._id.toString(),
            'Order Id': order.cartDetails?.orderId,
            Brand: order.productsDetails?.brand.brandTitle,
            Category: categoryTitles,
            'Delivery instructions': order.cartDetails.orderComments,
            'Product Title': order.productsDetails.productvariants?.extraProductTitle ? order.productsDetails.productvariants?.extraProductTitle : order.productsDetails?.productTitle,
            SKU: order.productsDetails.productvariants?.variantSku,
            Quantity: order.quantity,
            MRP: order.productsDetails.productvariants?.price,
            'Discount Amount': order.productDiscountAmount,
            'Sub Total': order.productAmount,
            'Total With Cancel': order.returnedProductAmount > 0 ? (order.productAmount - order.returnedProductAmount) : 0,
            'Created At': order.orderProductStatus === '1' ? order.orderProductStatusAt : null,
            Status: order.orderProductStatus ? orderProductStatusMap[order.orderProductStatus].label : null,
            'Delivered At': order.orderProductStatus === '5' ? order.orderProductStatusAt : null,
            'Billing Name': order.billingAddress?.name,
            'Shipping Name': order.shippingAddress?.name,
            'Payment Method': order.paymentMethod.paymentMethodTitle,
            'Shipping Address': JSON.stringify(shippingAddress),
            'Shipping Phone': order.shippingAddress?.phoneNumber,
            'Billing Address': JSON.stringify(billingAddress),
            'Billing Phone': order.billingAddress?.phoneNumber,
        }
    });

    ordersData.push({
        // Id: 'Total',
        'Order Id': 'Total',
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
    await generateExcelFile(res, ordersData, ['Order Id', 'Brand', 'Category', 'Delivery instructions', 'Product Title', 'SKU', 'Quantity', 'MRP', 'Discount Amount', 'Sub Total', 'Total With Cancel', 'Created At', 'Status', 'Delivered At', 'Billing Name', 'Shipping Name', 'Payment Method', 'Shipping Address', 'Shipping Phone', 'Billing Address', 'Billing Phone'], 'Orders')
}

export const exportProductExcel = async (res: Response, products: any) => {
    const productData: any[] = [];
    const allGalleryImageKeys: Set<string> = new Set();
    const allAttributeKeys: Set<string> = new Set();
    const allSpecificationKeys: Set<string> = new Set();

    products.forEach((product: any) => {
        product.productVariants.forEach((variant: any) => {
            if (Array.isArray(variant.variantImageGallery) && variant.variantImageGallery.length > 0) {
                
                variant.variantImageGallery.forEach((image: any, imgIndex: number) => {
                    allGalleryImageKeys.add(`Gallery_Image_${imgIndex + 1}`);
                });
            }
            if (Array.isArray(variant.productVariantAttributes) && variant.productVariantAttributes.length > 0) {
                variant.productVariantAttributes.forEach((attribute: any, attrIndex: number) => {
                    allAttributeKeys.add(`Attribute_Option_${attrIndex + 1}`);
                    allAttributeKeys.add(`Attribute_Type_${attrIndex + 1}`);
                    allAttributeKeys.add(`Attribute_Name_${attrIndex + 1}`);
                    allAttributeKeys.add(`Attribute_Value_${attrIndex + 1}`);
                });
            }
            if (Array.isArray(variant.productSpecification) && variant.productSpecification.length > 0) {
                variant.productSpecification.forEach((specification: any, specIndex: number) => {
                    allSpecificationKeys.add(`Specification_Option_${specIndex + 1}`);
                    allSpecificationKeys.add(`Specification_Display_Name_${specIndex + 1}`);
                    allSpecificationKeys.add(`Specification_Name_${specIndex + 1}`);
                    allSpecificationKeys.add(`Specification_Value_${specIndex + 1}`);
                });
            }
        });
    });

    products.forEach((product: any) => {
        const categoryTitles = product.productCategory.map((cat: any) => cat.category.slug).join(', ');
        const variantImages: { [key: string]: any } = {};
        const attributes: { [key: string]: any } = {};
        const specifications: { [key: string]: any } = {};

        allGalleryImageKeys.forEach((key) => {
            variantImages[key] = null;
        });

        allAttributeKeys.forEach((key) => {
            attributes[key] = null;
        });

        allSpecificationKeys.forEach((key) => {
            specifications[key] = null;
        });

        let totalQuantity = 0;

        if (product && product.productVariants[0] && product.productVariants[0].productVariantAttributes && product.productVariants[0].productVariantAttributes.length > 0) {
            let itemType: any;

            product.productVariants.forEach((variant: any, index: number) => {

                if (index === 0) {
                    totalQuantity = product.productVariants.reduce((sum: number, v: any) => sum + v.quantity, 0);
                }
                if (Array.isArray(variant.variantImageGallery) && variant.variantImageGallery.length > 0) {
                    variant.variantImageGallery.forEach((image: any, imgIndex: number) => {
                        variantImages[`Gallery_Image_${imgIndex + 1}`] = image.galleryImageUrl;
                    });
                }
                if (Array.isArray(variant.productVariantAttributes) && variant.productVariantAttributes.length > 0) {
                    variant.productVariantAttributes.forEach((attribute: any, attrIndex: number) => {
                        attributes[`Attribute_Option_${attrIndex + 1}`] = attribute.attributeTitle;
                        attributes[`Attribute_Type_${attrIndex + 1}`] = attribute.attributeType;
                        attributes[`Attribute_Name_${attrIndex + 1}`] = attribute.attributeDetail.itemName;
                        attributes[`Attribute_Value_${attrIndex + 1}`] = attribute.attributeDetail.itemValue;
                    });
                }
                if (Array.isArray(variant.productSpecification) && variant.productSpecification.length > 0) {
                    variant.productSpecification.forEach((specification: any, specIndex: number) => {
                        specifications[`Specification_Option_${specIndex + 1}`] = specification.specificationTitle;
                        specifications[`Specification_Display_Name_${specIndex + 1}`] = specification.specificationType;
                        specifications[`Specification_Name_${specIndex + 1}`] = specification.specificationDetail.itemName;
                        specifications[`Specification_Value_${specIndex + 1}`] = specification.specificationDetail.itemValue;
                    });
                }
                itemType = (product.sku === variant.variantSku) ? 'config-item' : 'variant';

                // Parent_SKU: variant.isDefault === '1' ? null : product.sku,
                // Item_Type: variant.isDefault === '1' ? 'config-item' : 'variant',

                productData.push({
                    Product_Title: product.isVariant === 1 ? variant.extraProductTitle : product.productTitle,
                    Description: variant.variantDescription,
                    Parent_SKU: itemType === 'config-item' ? null : product.sku,
                    SKU: variant.variantSku,
                    Item_Type: itemType,
                    Category: categoryTitles,
                    Image: product.productImageUrl,
                    ...variantImages,
                    Unit: product.unit,
                    Hight: product.measurements.hight,
                    Length: product.measurements.length,
                    Width: product.measurements.width,
                    Weight: product.measurements.Weight,
                    Tags: product.tags,
                    Brand: product.brand.brandTitle,
                    Country: variant?.country[0].countryTitle,
                    Warehouse: product.warehouse,
                    Price: variant.price,
                    Discount_Price: variant.discountPrice,
                    Quantity: variant.quantity,
                    Total_Quantity: itemType === 'config-item' ? totalQuantity : null,
                    Cart_Min_Quantity: variant.cartMinQuantity,
                    Cart_Max_Quantity: variant.cartMaxQuantity,
                    Is_Default: variant.isDefault,
                    Meta_Title: variant.productSeo?.metaTitle,
                    Meta_Keywords: variant.productSeo?.metaKeywords,
                    Meta_Description: variant.productSeo?.metaDescription,
                    OG_Title: variant.productSeo?.ogTitle,
                    OG_Description: variant.productSeo?.ogDescription,
                    Twitter_Title: variant.productSeo?.twitterTitle,
                    Twitter_Description: variant.productSeo?.twitterDescription,
                    ...attributes,
                    ...specifications
                });
            });
        } else {
            product.productVariants.forEach((variant: any, index: number) => {
                if (Array.isArray(variant.variantImageGallery) && variant.variantImageGallery.length > 0) {
                    variant.variantImageGallery.forEach((image: any, imgIndex: number) => {
                        variantImages[`Gallery_Image_${imgIndex + 1}`] = image.galleryImageUrl;
                    });
                } else if (Array.isArray(product.imageGallery) && product.imageGallery.length > 0) {
                    product.imageGallery.forEach((image: any, imgIndex: number) => {
                        variantImages[`Gallery_Image_${imgIndex + 1}`] = image.galleryImageUrl;
                    });
                }
                if (Array.isArray(product.productSpecification) && product.productSpecification.length > 0) {
                    product.productSpecification.forEach((specification: any, specIndex: number) => {
                        specifications[`Specification_Option_${specIndex + 1}`] = specification.specificationTitle;
                        specifications[`Specification_Display_Name_${specIndex + 1}`] = specification.specificationType;
                        specifications[`Specification_Name_${specIndex + 1}`] = specification.specificationDetail.itemName;
                        specifications[`Specification_Value_${specIndex + 1}`] = specification.specificationDetail.itemValue;
                    });
                }

                productData.push({
                    Product_Title: product.productTitle,
                    Description: product.description,
                    Long_Description: product.longDescription,
                    Parent_SKU: null,
                    SKU: product.sku,
                    Item_Type: 'simple-item',
                    Category: categoryTitles,
                    Image: product.productImageUrl,
                    ...variantImages,
                    Unit: product.unit,
                    Hight: product.measurements.hight,
                    Length: product.measurements.length,
                    Width: product.measurements.width,
                    Weight: product.measurements.Weight,
                    Tags: product.tags,
                    Brand: product.brand?.brandTitle,
                    Country: variant?.country[0].countryTitle,
                    Warehouse: product?.warehouse,
                    Price: variant?.price,
                    Discount_Price: variant?.discountPrice,
                    Quantity: variant?.quantity,
                    Total_Quantity: variant?.quantity,
                    Cart_Min_Quantity: variant?.cartMinQuantity,
                    Cart_Max_Quantity: variant?.cartMaxQuantity,
                    Is_Default: variant.isDefault,
                    Meta_Title: product.productSeo?.metaTitle,
                    Meta_Keywords: product.productSeo?.metaKeywords,
                    Meta_Description: product.productSeo?.metaDescription,
                    OG_Title: product.productSeo?.ogTitle,
                    OG_Description: product.productSeo?.ogDescription,
                    Twitter_Title: product.productSeo?.twitterTitle,
                    Twitter_Description: product.productSeo?.twitterDescription,
                    ...specifications
                });
            });
        }
    });

    const columnOrder = [
        'Product_Title',
        'Description',
        'Long_Description',
        'Parent_SKU',
        'SKU',
        'Item_Type',
        'Category',
        'Image',
        ...Array.from(allGalleryImageKeys),
        'Unit',
        'Hight',
        'Length',
        'Width',
        'Weight',
        'Tags',
        'Brand',
        'Country',
        'Warehouse',
        'Price',
        'Discount_Price',
        'Quantity',
        'Total_Quantity',
        'Cart_Min_Quantity',
        'Cart_Max_Quantity',
        'Is_Default',
        'Meta_Title',
        'Meta_Keywords',
        'Meta_Description',
        'OG_Title',
        'OG_Description',
        'Twitter_Title',
        'Twitter_Description',
        ...Array.from(allAttributeKeys),
        ...Array.from(allSpecificationKeys)
    ];

    await generateExcelFile(res, productData, columnOrder, 'products');
}

