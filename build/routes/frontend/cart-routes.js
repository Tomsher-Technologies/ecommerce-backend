"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const response_status_1 = require("../../src/components/response-status");
const frontend_auth_middleware_1 = require("../../middleware/frontend/frontend-auth-middleware");
const cart_order_controller_1 = __importDefault(require("../../src/controllers/frontend/cart-order-controller"));
const checkout_1 = __importDefault(require("../../src/controllers/frontend/auth/checkout"));
const router = express_1.default.Router();
router.use(frontend_auth_middleware_1.frontendAuthAndUnAuthMiddleware);
router.post('/create-cart', response_status_1.logResponseStatus, cart_order_controller_1.default.createCartOrder);
router.get('/get-cart', response_status_1.logResponseStatus, cart_order_controller_1.default.findUserCart);
router.post('/add-gift-wrap', response_status_1.logResponseStatus, cart_order_controller_1.default.addGiftWrap);
router.get('/tap-success-response', response_status_1.logResponseStatus, checkout_1.default.tapSuccessResponse);
router.get('/tap-failure-response', response_status_1.logResponseStatus, checkout_1.default.tapSuccessResponse);
exports.default = router;
