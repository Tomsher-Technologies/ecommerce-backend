"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.permissionBlocks = void 0;
exports.permissionBlocks = {
    dashboards: {
        orders: 'orders',
        analytics: 'analytics',
        customers: 'customers',
        topSellingProducts: 'top-selling-products',
    },
    ecommerce: {
        products: 'products',
        categories: 'categories',
        brands: 'brands',
        attributes: 'attributes',
        banners: 'banners',
        sliders: 'sliders',
        specifications: 'specifications'
    },
    orders: {
        orders: 'orders',
        orderReturn: 'order-return',
        paymentTransactions: 'payment-transactions'
    },
    customers: {
        customers: 'customers',
        whishlists: 'whishlists',
        reviews: 'reviews',
        newsletter: 'newsletter',
        contactus: 'contactus'
    },
    reports: {
        customers: {
            customerWise: 'customerwise',
            dateWise: "dateWise",
            monthWIse: "monthWIse"
        },
        products: {
            productWise: 'productwise',
            dateWise: "dateWise",
            monthWIse: "monthWIse",
            coupon: {
                couponWise: "couponWise"
            }
        },
        orders: {
            dateWise: "dateWise",
            monthWIse: "monthWIse"
        },
        category: {
            categoryWise: "brandWise",
            dateWise: "dateWise",
            monthWIse: "monthWIse"
        },
        brand: {
            brandWise: "brandWise",
            dateWise: "dateWise",
            monthWIse: "monthWIse"
        },
    },
    website: {
        collectionsProducts: 'collectionsproducts',
        collectionsBrands: 'collectionsbrands',
        collectionsCategories: 'collectionscategories',
        navigationMenu: 'navigation-menu',
        pages: 'pages',
        galleryimages: 'galleryimages'
    },
    setup: {
        languages: 'languages',
        tax: 'tax',
        country: 'country',
        state: 'state',
        paymentMethod: 'paymentmethod',
        websitesetups: 'websitesetups',
    },
    stores: {
        warehouse: 'warehouse',
        store: 'store',
    },
    account: {
        privilages: 'privilages',
        users: 'users',
        userTypes: 'usertypes',
    },
    marketing: {
        coupons: 'coupons',
        offers: 'offers',
    },
};
