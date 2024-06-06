
import express from 'express';
import GuestRoutes from './frontend/guest/auth-routes';
import CategoryRoutes from './frontend/guest/category-routes';
import CommonRoutes from './frontend/common-routes';
import ProductRoutes from './frontend/guest/product-routes';

const frontendRouter = express.Router();

frontendRouter.use('/auth', GuestRoutes);
frontendRouter.use('/category', CategoryRoutes);
frontendRouter.use('/common', CommonRoutes);
frontendRouter.use('/product', ProductRoutes);

export default frontendRouter;