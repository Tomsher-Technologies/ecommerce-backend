"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const response_status_1 = require("../../../src/components/response-status");
const frontend_auth_middleware_1 = require("../../../middleware/frontend/frontend-auth-middleware");
const customer_controller_1 = __importDefault(require("../../../src/controllers/frontend/auth/customer-controller"));
const router = express_1.default.Router();
router.use(frontend_auth_middleware_1.frontendAuthMiddleware);
router.get('/get-customer-details', response_status_1.logResponseStatus, customer_controller_1.default.findCustomer);
router.get('/get-all-address', response_status_1.logResponseStatus, customer_controller_1.default.getAllCustomerAddress);
router.get('/wallet-details', response_status_1.logResponseStatus, customer_controller_1.default.findWalletDetails);
router.post('/manage-address', response_status_1.logResponseStatus, customer_controller_1.default.addEditCustomerAddress);
router.post('/remove-address/:id', response_status_1.logResponseStatus, customer_controller_1.default.removeCustomerAddress);
router.post('/make-default-address/:id', response_status_1.logResponseStatus, customer_controller_1.default.makeDefaultCustomerAddress);
router.post('/update-profile', response_status_1.logResponseStatus, customer_controller_1.default.updateCustomerProfileDetails);
router.post('/change-password', response_status_1.logResponseStatus, customer_controller_1.default.changePassword);
exports.default = router;
