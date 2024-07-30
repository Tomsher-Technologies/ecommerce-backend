"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const frontend_auth_middleware_1 = require("../../../middleware/frontend/frontend-auth-middleware");
const order_controller_1 = __importDefault(require("../../../src/controllers/frontend/auth/order-controller"));
const response_status_1 = __importStar(require("../../../src/components/response-status"));
const cart_order_controller_1 = __importDefault(require("../../../src/controllers/frontend/cart-order-controller"));
const checkout_controller_1 = __importDefault(require("../../../src/controllers/frontend/auth/checkout-controller"));
const routerWithUser = express_1.default.Router();
routerWithUser.use(frontend_auth_middleware_1.frontendAuthAndUnAuthMiddleware);
routerWithUser.get('/:id', response_status_1.default, order_controller_1.default.getOrder);
const OrderRoutes = express_1.default.Router();
OrderRoutes.use(frontend_auth_middleware_1.frontendAuthMiddleware);
OrderRoutes.get('/order-list', response_status_1.logResponseStatus, order_controller_1.default.orderList);
OrderRoutes.post('/move-to-wishlist', response_status_1.logResponseStatus, cart_order_controller_1.default.moveToWishlist);
OrderRoutes.post('/checkout', response_status_1.logResponseStatus, checkout_controller_1.default.checkout);
OrderRoutes.get('/checkout/retrieve-checkout-tabby/:tabby', response_status_1.logResponseStatus, checkout_controller_1.default.tabbyCheckoutRetrieveDetails);
OrderRoutes.post('/order-cancel/:id', response_status_1.logResponseStatus, order_controller_1.default.orderCancel);
OrderRoutes.post('/order-return/:id', response_status_1.logResponseStatus, order_controller_1.default.orderReturn);
OrderRoutes.use(routerWithUser);
exports.default = OrderRoutes;
