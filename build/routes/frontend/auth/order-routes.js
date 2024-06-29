"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const frontend_auth_middleware_1 = require("../../../middleware/frontend/frontend-auth-middleware");
const order_controller_1 = __importDefault(require("../../../src/controllers/frontend/auth/order-controller"));
const response_status_1 = require("../../../src/components/response-status");
const cart_order_controller_1 = __importDefault(require("../../../src/controllers/frontend/cart-order-controller"));
const checkout_1 = __importDefault(require("../../../src/controllers/frontend/auth/checkout"));
const router = express_1.default.Router();
router.use(frontend_auth_middleware_1.frontendAuthMiddleware);
router.get('/order-list', response_status_1.logResponseStatus, order_controller_1.default.orderList);
router.get('/:id', response_status_1.logResponseStatus, order_controller_1.default.getOrder);
router.post('/move-to-wishlist', response_status_1.logResponseStatus, cart_order_controller_1.default.moveToWishlist);
router.post('/checkout', response_status_1.logResponseStatus, checkout_1.default.checkout);
exports.default = router;
