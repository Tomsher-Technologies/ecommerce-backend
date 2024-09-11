"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = __importDefault(require("../../../middleware/admin/auth-middleware"));
const admin_user_permission_roll_middleware_1 = __importDefault(require("../../../middleware/admin/admin-user-permission-roll-middleware"));
const permission_blocks_1 = require("../../../src/constants/permission-blocks");
const dashboard_controller_1 = __importDefault(require("../../../src/controllers/admin/dashboard/dashboard-controller"));
const router = express_1.default.Router();
router.use(auth_middleware_1.default);
router.get('/', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.dashboards.orders, readOnly: 1 }), dashboard_controller_1.default.dashboardOrder);
router.get('/dashboard-analytics', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.dashboards.analytics, readOnly: 1 }), dashboard_controller_1.default.dashboardAnalytics);
router.get('/dashboard-customers', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.dashboards.analytics, readOnly: 1 }), dashboard_controller_1.default.dashboardCustomers);
router.get('/top-selling-products', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.dashboards.analytics, readOnly: 1 }), dashboard_controller_1.default.dashboardTopSellingProducts);
router.get('/out-of-stock-products', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.dashboards.analytics, readOnly: 1 }), dashboard_controller_1.default.outOfStockProducts);
exports.default = router;
