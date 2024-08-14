"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = __importDefault(require("../../../middleware/admin/auth-middleware"));
const admin_user_permission_roll_middleware_1 = __importDefault(require("../../../middleware/admin/admin-user-permission-roll-middleware"));
const permission_blocks_1 = require("../../../src/constants/permission-blocks");
const order_report_controller_1 = __importDefault(require("../../../src/controllers/admin/report/order-report-controller"));
const router = express_1.default.Router();
router.use(auth_middleware_1.default);
router.get('/order-report', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.orders.orders, readOnly: 1 }), order_report_controller_1.default.orderReport);
exports.default = router;
