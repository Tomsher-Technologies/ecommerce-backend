
import express from 'express';
import GuestRoutes from './frontend/guest/auth-routes';
import CommonRoutes from './frontend/guest/common-routes';
import ProductRoutes from './frontend/guest/product-routes';
import PagesController from '../src/controllers/frontend/guest/pages-controller';
import WishlistRoutes from './frontend/auth/wishlist-routes';
import CartRoutes from './frontend/cart-routes';
import CouponRoutes from './frontend/auth/coupon-routes';
import CustomerRoutes from './frontend/auth/customer-routes';
import OrderRoutes from './frontend/auth//order-routes';
import ReviewRoutes from './frontend/auth/review-routes';

const frontendRouter = express.Router();

frontendRouter.use('/auth', GuestRoutes);
frontendRouter.use('/common', CommonRoutes);
frontendRouter.use('/product', ProductRoutes);
frontendRouter.use('/wishlist', WishlistRoutes);
frontendRouter.use('/pages/:slug', PagesController.findPagesData);
frontendRouter.use('/cart', CartRoutes);
frontendRouter.use('/coupons', CouponRoutes);
frontendRouter.use('/customer', CustomerRoutes);
frontendRouter.use('/order', OrderRoutes);
frontendRouter.use('/review', ReviewRoutes);

export default frontendRouter;