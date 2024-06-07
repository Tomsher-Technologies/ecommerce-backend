
import express from 'express';
import GuestRoutes from './frontend/guest/auth-routes';
import CategoryRoutes from './frontend/guest/category-routes';
import CommonRoutes from './frontend/guest/common-routes';
import ProductRoutes from './frontend/guest/product-routes';
import PagesController from '../src/controllers/frontend/guest/pages-controller';

const frontendRouter = express.Router();

frontendRouter.use('/auth', GuestRoutes);
frontendRouter.use('/category', CategoryRoutes);
frontendRouter.use('/common', CommonRoutes);
frontendRouter.use('/product', ProductRoutes);
frontendRouter.use('/pages/:slug', PagesController.findPagesData);

export default frontendRouter;