"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = __importDefault(require("../../../middleware/admin/auth-middleware"));
const admin_user_permission_roll_middleware_1 = __importDefault(require("../../../middleware/admin/admin-user-permission-roll-middleware"));
const permission_blocks_1 = require("../../../src/constants/permission-blocks");
const customer_controller_1 = __importDefault(require("../../../src/controllers/admin/customer/customer-controller"));
const file_uploads_1 = require("../../../src/utils/file-uploads");
const router = express_1.default.Router();
const { uploadExcel } = (0, file_uploads_1.configureMulterExcel)('customer/excel', ['customerExcel',]);
router.use(auth_middleware_1.default);
router.get('/customer-list', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.customers.customers, readOnly: 1 }), customer_controller_1.default.findAll);
router.get('/customer-detail/:id', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.customers.customers, readOnly: 1 }), customer_controller_1.default.findCustomer);
router.post('/import-excel', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.customers.customers, writeOnly: 1 }), uploadExcel.single('customerExcel'), customer_controller_1.default.importExcel);
router.get('/wishlist', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.customers.wishlist, readOnly: 1 }), customer_controller_1.default.findAllWishlist);
exports.default = router;
