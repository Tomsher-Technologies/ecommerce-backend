import express, { Router } from 'express';

import { logResponseStatus } from '../../../src/components/response-status';
import { frontendAuthMiddleware } from '../../../middleware/frontend/frontend-auth-middleware';

import CustomerController from '../../../src/controllers/frontend/auth/customer-controller';

const router: Router = express.Router();

router.use(frontendAuthMiddleware);

router.get('/get-customer-details', logResponseStatus, CustomerController.findCustomer);
router.get('/get-all-address', logResponseStatus, CustomerController.getAllCustomerAddress);
router.get('/wallet-details', logResponseStatus, CustomerController.findWalletDetails);
router.post('/manage-address', logResponseStatus, CustomerController.addEditCustomerAddress);
router.post('/remove-address/:id', logResponseStatus, CustomerController.removeCustomerAddress);
router.post('/make-default-address/:id', logResponseStatus, CustomerController.makeDefaultCustomerAddress);
router.post('/update-profile', logResponseStatus, CustomerController.updateCustomerProfileDetails);
router.post('/change-password', logResponseStatus, CustomerController.changePassword);

export default router;
