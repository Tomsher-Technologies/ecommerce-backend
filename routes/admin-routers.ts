
import express from 'express';
//admin
import AuthRoute from './admin/auth-routes';

//admin ecommerce 
import CategoryRoutes from './admin/ecommerce/category-routes';
import BrandsRoutes from './admin/ecommerce/brands-routes';
import BannersRoutes from './admin/ecommerce/banners-routes';
import SliderRoutes from './admin/ecommerce/slider-routes';
import ProductsRoutes from './admin/ecommerce/products-routes';
import AttributesRoutes from './admin/ecommerce/attributes-routes';
import SpecificationRoutes from './admin/ecommerce/specification-route';

// admin general
import PageRoute from './admin/general/page-routes';
import CommonRoute from './admin/general/common-routes';

// admin account
import UserRoute from './admin/account/user-routes';
import UserTypeRoute from './admin/account/user-type-routes';
import PrivilagesRoute from './admin/account/privilage-routes';

// admin marketing
import CouponRoutes from './admin/marketing/coupon-routes';
import OfferRoutes from './admin/marketing/offer-routes';

// admin setup
import CountryRoutes from './admin/setup/country-routes';
import StateRoutes from './admin/setup/state-routes';
import CityRoutes from './admin/setup/city-routes';
import PaymentMethodRoutes from './admin/setup/payment-methods-routes';
import LanguagesRoutes from './admin/setup/languages-routes';
import SetingsRoutes from './admin/setup/settings-routes';
import CollectionProductRoutes from './admin/website/collection-product-routes';
import CollectionBrandRoutes from './admin/website/collection-brand-routes';
import CollectionCartegoryRoutes from './admin/website/collection-category-routes';
import NavigationMenuRoutes from './admin/website/navigation-menu-routes';
import DynamicPageRoutes from './admin/website/pages-routes';
import GalleryImageRoutes from './admin/website/gallery-image-routes';
import TaxRoutes from './admin/setup/tax-routes';

// store
import WarehouseRoutes from './admin/stores/warehouse-routes';
import StoreRoutes from './admin/stores/store-routes';

//order
import OrderRoutes from './admin/orders/orders-routes';

//customer
import CustomerRoutes from './admin/customers/customers-routes';

//dashboard
import DashboardRoutes from './admin/dashboard/dashboard-routes';

//newsletter
import NewsletterRoutes from './admin/website-information/newsletter-routes';
import ContactUsRoutes from './admin/website-information/contact-us-routes';
//dashboard
const adminRouter = express.Router();

// admin
adminRouter.use('/auth', AuthRoute);
// adminRouter.use(authMiddleware); // Apply authMiddleware only to the following routes

// admin general
adminRouter.use('/general/pages', PageRoute);
adminRouter.use('/general/common', CommonRoute);

//admin ecommerce 
adminRouter.use('/account/user', UserRoute);
adminRouter.use('/account/user-types', UserTypeRoute);
adminRouter.use('/account/privilages', PrivilagesRoute);

//admin ecommerce 
adminRouter.use('/category', CategoryRoutes);
adminRouter.use('/brands', BrandsRoutes);
adminRouter.use('/banners', BannersRoutes);
adminRouter.use('/sliders', SliderRoutes);
adminRouter.use('/products', ProductsRoutes);
adminRouter.use('/attributes', AttributesRoutes);
adminRouter.use('/specification', SpecificationRoutes);

// admin marketing
adminRouter.use('/marketing/coupons', CouponRoutes);
adminRouter.use('/marketing/offers', OfferRoutes);

// //admin setup
adminRouter.use('/setup/country', CountryRoutes);
adminRouter.use('/setup/state', StateRoutes);
adminRouter.use('/setup/city', CityRoutes);
adminRouter.use('/setup/payment-method', PaymentMethodRoutes);
adminRouter.use('/setup/languages', LanguagesRoutes);
adminRouter.use('/setup/website-settings', SetingsRoutes);
adminRouter.use('/setup/tax', TaxRoutes);

//admin website 
adminRouter.use('/website/collection-products', CollectionProductRoutes);
adminRouter.use('/website/collection-brands', CollectionBrandRoutes);
adminRouter.use('/website/collection-categories', CollectionCartegoryRoutes);
adminRouter.use('/website/navigation-menu', NavigationMenuRoutes);
adminRouter.use('/website/pages', DynamicPageRoutes);
adminRouter.use('/website/gallery-images', GalleryImageRoutes);

// stores
adminRouter.use('/stores/warehouse', WarehouseRoutes);
adminRouter.use('/stores/store', StoreRoutes);

//order
adminRouter.use('/orders', OrderRoutes);

//customer
adminRouter.use('/customers', CustomerRoutes);

//dashboard
adminRouter.use('/dashboard', DashboardRoutes);

//newsletter
adminRouter.use('/newsletter', NewsletterRoutes);
adminRouter.use('/contact-us', ContactUsRoutes);


export default adminRouter;