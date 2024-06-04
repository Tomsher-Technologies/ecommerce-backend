
import express from 'express';
import GuestRoutes from './frontend/guest/auth-routes';
import HomeRoutes from './frontend/home-routes';

const frontendRouter = express.Router();

frontendRouter.use('/auth', GuestRoutes);
frontendRouter.use('/common', HomeRoutes);

export default frontendRouter;