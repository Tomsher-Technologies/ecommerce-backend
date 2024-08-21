"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = __importDefault(require("../../../middleware/admin/auth-middleware"));
const admin_user_permission_roll_middleware_1 = __importDefault(require("../../../middleware/admin/admin-user-permission-roll-middleware"));
const permission_blocks_1 = require("../../../src/constants/permission-blocks");
const review_controller_1 = __importDefault(require("../../../src/controllers/admin/customer/review-controller"));
const router = express_1.default.Router();
router.use(auth_middleware_1.default);
router.get('/review-list', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.customers.reviews, readOnly: 1 }), review_controller_1.default.findAll);
router.post('/status-change/:id', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.customers.reviews, writeOnly: 1 }), review_controller_1.default.statusChange);
exports.default = router;
