"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminTaskLogActivity = exports.adminTaskLogStatus = exports.adminTaskLog = void 0;
exports.adminTaskLog = {
    ecommerce: {
        brands: 'brands',
        sliders: 'sliders',
        banner: 'banner',
        categories: 'categories',
        attributes: 'attributes',
        products: 'products',
        productVariants: 'productVariants',
        specifications: 'specifications'
    },
    website: {
        collectionsProducts: 'collectionsproducts',
        collectionsBrands: 'collectionsbrands',
        collectionsCategories: 'collectionscategories',
        navigationMenu: 'navigationmenu',
        pages: {
            home: 'home',
            termsAndConditions: 'terms-and-conditions',
            privacyAndPolicy: 'privacy-and-policy',
            contactUs: 'contact-us',
        },
        galleryimages: 'galleryimages'
    },
    marketing: {
        coupons: 'coupons',
        offers: 'offers',
    },
    account: {
        privilages: 'privilages',
        users: 'users',
        userTypes: 'usertypes',
    },
    setup: {
        country: 'country',
        paymentMethod: 'payment-method',
        languages: 'languages',
        taxs: 'taxs',
        settings: {
            websitesettings: 'websitesettings'
        },
    },
    store: {
        warehouse: 'warehouse',
        store: 'store',
    },
};
exports.adminTaskLogStatus = {
    success: 'success',
    failed: 'failed',
    error: 'error'
};
exports.adminTaskLogActivity = {
    create: 'create',
    update: 'update',
    delete: 'delete',
    statusChange: 'status change',
    positionChange: 'position change',
    priorityUpdation: 'priority updation',
    managePrivilages: 'manage user privilages',
};
