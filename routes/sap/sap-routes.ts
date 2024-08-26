import express, { Router } from 'express';

import authMiddleware from '../../middleware/admin/auth-middleware';

import SapController from '../../src/controllers/admin/sap/sap-controller';

const router: Router = express.Router();

router.use(authMiddleware);

router.post('/product-inventory-update', SapController.productPriceUpdate);

export default router;
