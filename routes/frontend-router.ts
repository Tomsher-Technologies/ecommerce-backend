
import express from 'express';
import GuestRoutes from './frontend/guest/auth-routes';
import HomeRoutes from './frontend/home-routes';
import CategoryRoutes from './frontend/guest/category-routes';

const frontendRouter = express.Router();

frontendRouter.use('/auth', GuestRoutes);
frontendRouter.use('/common', HomeRoutes);
frontendRouter.use('/category', CategoryRoutes);


export default frontendRouter;