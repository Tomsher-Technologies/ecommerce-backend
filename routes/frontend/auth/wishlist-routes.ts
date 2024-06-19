import express, { Router } from 'express';

import { logResponseStatus } from '../../../src/components/response-status';
import frontendAuthMiddleware from '../../../middleware/frontend/frontend-auth-middleware';

import WishlistsController from '../../../src/controllers/frontend/auth/wishlist-controller';

const router: Router = express.Router();

router.use(frontendAuthMiddleware);

router.get('/', logResponseStatus, WishlistsController.findAllWishlists);
router.post('/add-to-wishlist', logResponseStatus, WishlistsController.addToWishlist);


export default router;
