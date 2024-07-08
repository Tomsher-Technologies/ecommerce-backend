"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = __importDefault(require("../../../middleware/admin/auth-middleware"));
const admin_user_permission_roll_middleware_1 = __importDefault(require("../../../middleware/admin/admin-user-permission-roll-middleware"));
const permission_blocks_1 = require("../../../src/constants/permission-blocks");
const order_controller_1 = __importDefault(require("../../../src/controllers/admin/order/order-controller"));
const router = express_1.default.Router();
router.use(auth_middleware_1.default);
router.get('/order-list', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.orders.orders }), order_controller_1.default.findAll);
router.get('/order-detail/:id', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.orders.orders }), order_controller_1.default.getOrderDetails);
router.post('/order-status-change/:id', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.orders.orders }), order_controller_1.default.orderStatusChange);
exports.default = router;
