
import express from 'express';
import GuestRoutes from './frontend/guest/auth-routes';
import CommonRoutes from './frontend/guest/common-routes';
import ProductRoutes from './frontend/guest/product-routes';
import PagesController from '../src/controllers/frontend/guest/pages-controller';
import WishlistRoutes from './frontend/auth/wishlist-routes';
import cartRoutes from './frontend/cart-routes';

const frontendRouter = express.Router();

frontendRouter.use('/auth', GuestRoutes);
frontendRouter.use('/common', CommonRoutes);
frontendRouter.use('/product', ProductRoutes);
frontendRouter.use('/wishlist', WishlistRoutes);
frontendRouter.use('/pages/:slug', PagesController.findPagesData);
frontendRouter.use('/cart', cartRoutes);

export default frontendRouter;