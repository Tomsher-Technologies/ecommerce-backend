"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = __importDefault(require("../../../middleware/admin/auth-middleware"));
const order_controller_1 = __importDefault(require("../../../src/controllers/admin/order/order-controller"));
const router = express_1.default.Router();
router.use(auth_middleware_1.default);
router.get('/order-list', order_controller_1.default.findAll);
router.get('/order-detail/:id', order_controller_1.default.getOrderDetails);
exports.default = router;
