"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
//admin
const auth_routes_1 = __importDefault(require("./admin/auth-routes"));
//admin ecommerce 
const category_routes_1 = __importDefault(require("./admin/ecommerce/category-routes"));
const brands_routes_1 = __importDefault(require("./admin/ecommerce/brands-routes"));
const banners_routes_1 = __importDefault(require("./admin/ecommerce/banners-routes"));
const slider_routes_1 = __importDefault(require("./admin/ecommerce/slider-routes"));
const products_routes_1 = __importDefault(require("./admin/ecommerce/products-routes"));
const attributes_routes_1 = __importDefault(require("./admin/ecommerce/attributes-routes"));
const specification_route_1 = __importDefault(require("./admin/ecommerce/specification-route"));
// admin general
const page_routes_1 = __importDefault(require("./admin/general/page-routes"));
const common_routes_1 = __importDefault(require("./admin/general/common-routes"));
// admin account
const user_routes_1 = __importDefault(require("./admin/account/user-routes"));
const user_type_routes_1 = __importDefault(require("./admin/account/user-type-routes"));
const privilage_routes_1 = __importDefault(require("./admin/account/privilage-routes"));
// admin marketing
const coupon_routes_1 = __importDefault(require("./admin/marketing/coupon-routes"));
const offer_routes_1 = __importDefault(require("./admin/marketing/offer-routes"));
// admin setup
const country_routes_1 = __importDefault(require("./admin/setup/country-routes"));
const state_routes_1 = __importDefault(require("./admin/setup/state-routes"));
const city_routes_1 = __importDefault(require("./admin/setup/city-routes"));
const payment_methods_routes_1 = __importDefault(require("./admin/setup/payment-methods-routes"));
const languages_routes_1 = __importDefault(require("./admin/setup/languages-routes"));
const settings_routes_1 = __importDefault(require("./admin/setup/settings-routes"));
const collection_product_routes_1 = __importDefault(require("./admin/website/collection-product-routes"));
const collection_brand_routes_1 = __importDefault(require("./admin/website/collection-brand-routes"));
const collection_category_routes_1 = __importDefault(require("./admin/website/collection-category-routes"));
const navigation_menu_routes_1 = __importDefault(require("./admin/website/navigation-menu-routes"));
const pages_routes_1 = __importDefault(require("./admin/website/pages-routes"));
const gallery_image_routes_1 = __importDefault(require("./admin/website/gallery-image-routes"));
const tax_routes_1 = __importDefault(require("./admin/setup/tax-routes"));
// store
const warehouse_routes_1 = __importDefault(require("./admin/stores/warehouse-routes"));
const store_routes_1 = __importDefault(require("./admin/stores/store-routes"));
//order
const orders_routes_1 = __importDefault(require("./admin/orders/orders-routes"));
//customer
const customers_routes_1 = __importDefault(require("./admin/customers/customers-routes"));
//dashboard
const dashboard_routes_1 = __importDefault(require("./admin/dashboard/dashboard-routes"));
//newsletter
const newsletter_routes_1 = __importDefault(require("./admin/website-information/newsletter-routes"));
//dashboard
const adminRouter = express_1.default.Router();
// admin
adminRouter.use('/auth', auth_routes_1.default);
// adminRouter.use(authMiddleware); // Apply authMiddleware only to the following routes
// admin general
adminRouter.use('/general/pages', page_routes_1.default);
adminRouter.use('/general/common', common_routes_1.default);
//admin ecommerce 
adminRouter.use('/account/user', user_routes_1.default);
adminRouter.use('/account/user-types', user_type_routes_1.default);
adminRouter.use('/account/privilages', privilage_routes_1.default);
//admin ecommerce 
adminRouter.use('/category', category_routes_1.default);
adminRouter.use('/brands', brands_routes_1.default);
adminRouter.use('/banners', banners_routes_1.default);
adminRouter.use('/sliders', slider_routes_1.default);
adminRouter.use('/products', products_routes_1.default);
adminRouter.use('/attributes', attributes_routes_1.default);
adminRouter.use('/specification', specification_route_1.default);
// admin marketing
adminRouter.use('/marketing/coupons', coupon_routes_1.default);
adminRouter.use('/marketing/offers', offer_routes_1.default);
// //admin setup
adminRouter.use('/setup/country', country_routes_1.default);
adminRouter.use('/setup/state', state_routes_1.default);
adminRouter.use('/setup/city', city_routes_1.default);
adminRouter.use('/setup/payment-method', payment_methods_routes_1.default);
adminRouter.use('/setup/languages', languages_routes_1.default);
adminRouter.use('/setup/website-settings', settings_routes_1.default);
adminRouter.use('/setup/tax', tax_routes_1.default);
//admin website 
adminRouter.use('/website/collection-products', collection_product_routes_1.default);
adminRouter.use('/website/collection-brands', collection_brand_routes_1.default);
adminRouter.use('/website/collection-categories', collection_category_routes_1.default);
adminRouter.use('/website/navigation-menu', navigation_menu_routes_1.default);
adminRouter.use('/website/pages', pages_routes_1.default);
adminRouter.use('/website/gallery-images', gallery_image_routes_1.default);
// stores
adminRouter.use('/stores/warehouse', warehouse_routes_1.default);
adminRouter.use('/stores/store', store_routes_1.default);
//order
adminRouter.use('/orders', orders_routes_1.default);
//customer
adminRouter.use('/customers', customers_routes_1.default);
//dashboard
adminRouter.use('/dashboard', dashboard_routes_1.default);
//newsletter
adminRouter.use('/newsletter', newsletter_routes_1.default);
exports.default = adminRouter;
