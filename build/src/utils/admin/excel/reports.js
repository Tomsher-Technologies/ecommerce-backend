"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportProductExcel = exports.exportOrderReport = exports.exportCustomerReport = void 0;
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
    const addressColumns = customerData.reduce((acc, customer) => {
        customer.address.forEach((_, index) => {
            acc.push(`addressBook[${index + 1}]State`, `addressBook[${index + 1}]City`);
        });
        return Array.from(new Set(acc));
    }, []);
    await (0, excel_generator_1.generateExcelFile)(res, customersData, ['name', 'phone', 'email', 'guestEmail', 'isVerified', 'lastOrderDate', ...addressColumns, 'created_date', 'fromGuest', 'addressBook', 'credits', 'orderTotalAmount', 'totalOrderCount'], 'Customers');
};
exports.exportCustomerReport = exportCustomerReport;
const exportOrderReport = async (res, orderData, orderSum) => {
    const ordersData = orderData.map((order) => {
        const categoryTitles = order.productsDetails.productCategory.map((cat) => cat.category.categoryTitle).join(', ');
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
        };
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
        };
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
            Status: order.orderProductStatus ? cart_1.orderProductStatusMap[order.orderProductStatus].label : null,
            'Delivered At': order.orderProductStatus === '5' ? order.orderProductStatusAt : null,
            'Billing Name': order.billingAddress?.name,
            'Shipping Name': order.shippingAddress?.name,
            'Payment Method': order.paymentMethod.paymentMethodTitle,
            'Shipping Address': JSON.stringify(shippingAddress),
            'Shipping Phone': order.shippingAddress.phoneNumber,
            'Billing Address': JSON.stringify(billingAddress),
            'Billing Phone': order.billingAddress.phoneNumber,
        };
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
    await (0, excel_generator_1.generateExcelFile)(res, ordersData, ['Order Id', 'Brand', 'Category', 'Delivery instructions', 'Product Title', 'SKU', 'Quantity', 'MRP', 'Discount Amount', 'Sub Total', 'Total With Cancel', 'Created At', 'Status', 'Delivered At', 'Billing Name', 'Shipping Name', 'Payment Method', 'Shipping Address', 'Shipping Phone', 'Billing Address', 'Billing Phone'], 'Orders');
};
exports.exportOrderReport = exportOrderReport;
const exportProductExcel = async (res, products) => {
    const productData = [];
    const allGalleryImageKeys = new Set();
    const allAttributeKeys = new Set();
    const allSpecificationKeys = new Set();
    products.forEach((product) => {
        product.productVariants.forEach((variant) => {
            variant.variantImageGallery.forEach((image, imgIndex) => {
                allGalleryImageKeys.add(`Gallery_Image_${imgIndex + 1}`);
            });
            variant.productVariantAttributes.forEach((attribute, attrIndex) => {
                allAttributeKeys.add(`Attribute_Option_${attrIndex + 1}`);
                allAttributeKeys.add(`Attribute_Type_${attrIndex + 1}`);
                allAttributeKeys.add(`Attribute_Name_${attrIndex + 1}`);
                allAttributeKeys.add(`Attribute_Value_${attrIndex + 1}`);
            });
            variant.productSpecification.forEach((specification, specIndex) => {
                allSpecificationKeys.add(`Specification_Option_${specIndex + 1}`);
                allSpecificationKeys.add(`Specification_Display_Name_${specIndex + 1}`);
                allSpecificationKeys.add(`Specification_Name_${specIndex + 1}`);
                allSpecificationKeys.add(`Specification_Value_${specIndex + 1}`);
            });
        });
    });
    products.forEach((product) => {
        const categoryTitles = product.productCategory.map((cat) => cat.category.slug).join(', ');
        const variantImages = {};
        const attributes = {};
        const specifications = {};
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
            let itemType;
            product.productVariants.forEach((variant, index) => {
                if (index === 0) {
                    totalQuantity = product.productVariants.reduce((sum, v) => sum + v.quantity, 0);
                }
                variant.variantImageGallery.forEach((image, imgIndex) => {
                    variantImages[`Gallery_Image_${imgIndex + 1}`] = image.galleryImageUrl;
                });
                variant.productVariantAttributes.forEach((attribute, attrIndex) => {
                    attributes[`Attribute_Option_${attrIndex + 1}`] = attribute.attributeTitle;
                    attributes[`Attribute_Type_${attrIndex + 1}`] = attribute.attributeType;
                    attributes[`Attribute_Name_${attrIndex + 1}`] = attribute.attributeDetail.itemName;
                    attributes[`Attribute_Value_${attrIndex + 1}`] = attribute.attributeDetail.itemValue;
                });
                variant.productSpecification.forEach((specification, specIndex) => {
                    specifications[`Specification_Option_${specIndex + 1}`] = specification.specificationTitle;
                    specifications[`Specification_Display_Name_${specIndex + 1}`] = specification.specificationType;
                    specifications[`Specification_Name_${specIndex + 1}`] = specification.specificationDetail.itemName;
                    specifications[`Specification_Value_${specIndex + 1}`] = specification.specificationDetail.itemValue;
                });
                itemType = product.productVariants[0]._id === variant._id ? 'config-item' : 'variant';
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
        }
        else {
            product.imageGallery.forEach((image, imgIndex) => {
                variantImages[`Gallery_Image_${imgIndex + 1}`] = image.galleryImageUrl;
            });
            product.productSpecification.forEach((specification, specIndex) => {
                specifications[`Specification_Option_${specIndex + 1}`] = specification.specificationTitle;
                specifications[`Specification_Display_Name_${specIndex + 1}`] = specification.specificationType;
                specifications[`Specification_Name_${specIndex + 1}`] = specification.specificationDetail.itemName;
                specifications[`Specification_Value_${specIndex + 1}`] = specification.specificationDetail.itemValue;
            });
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
                Country: product.productVariants[0]?.country[0].countryTitle,
                Warehouse: product?.warehouse,
                Price: product.productVariants[0]?.price,
                Discount_Price: product.productVariants[0]?.discountPrice,
                Quantity: product.productVariants[0]?.quantity,
                Total_Quantity: product.productVariants[0]?.quantity,
                Cart_Min_Quantity: product.productVariants[0]?.cartMinQuantity,
                Cart_Max_Quantity: product.productVariants[0]?.cartMaxQuantity,
                Is_Default: product.productVariants[0].isDefault,
                Meta_Title: product.productSeo?.metaTitle,
                Meta_Keywords: product.productSeo?.metaKeywords,
                Meta_Description: product.productSeo?.metaDescription,
                OG_Title: product.productSeo?.ogTitle,
                OG_Description: product.productSeo?.ogDescription,
                Twitter_Title: product.productSeo?.twitterTitle,
                Twitter_Description: product.productSeo?.twitterDescription,
                ...specifications
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
    await (0, excel_generator_1.generateExcelFile)(res, productData, columnOrder, 'products');
};
exports.exportProductExcel = exportProductExcel;
