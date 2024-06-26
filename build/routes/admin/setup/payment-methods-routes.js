"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const file_uploads_1 = require("../../../src/utils/file-uploads");
const auth_middleware_1 = __importDefault(require("../../../middleware/admin/auth-middleware"));
const admin_user_permission_roll_middleware_1 = __importDefault(require("../../../middleware/admin/admin-user-permission-roll-middleware"));
const response_status_1 = require("../../../src/components/response-status");
const permission_blocks_1 = require("../../../src/constants/permission-blocks");
const payment_methods_controller_1 = __importDefault(require("../../../src/controllers/admin/setup/payment-methods-controller"));
const router = express_1.default.Router();
const { upload } = (0, file_uploads_1.configureMulter)('paymentMethod', ['paymentMethodImage',]);
router.use(auth_middleware_1.default);
router.get('/', response_status_1.logResponseStatus, (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.setup.paymentMethod, readOnly: 1 }), payment_methods_controller_1.default.findAll);
router.get('/:id', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.setup.paymentMethod, readOnly: 1 }), payment_methods_controller_1.default.findOne);
router.post('/', upload.single('paymentMethodImage'), (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.setup.paymentMethod, writeOnly: 1 }), response_status_1.logResponseStatus, payment_methods_controller_1.default.create);
router.post('/:id', upload.single('paymentMethodImage'), response_status_1.logResponseStatus, (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.setup.paymentMethod, writeOnly: 1 }), payment_methods_controller_1.default.update);
router.post('/status-change/:id', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.setup.paymentMethod, writeOnly: 1 }), payment_methods_controller_1.default.statusChange);
// router.delete('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.paymentMethod }), PaymentMethodController.destroy);
exports.default = router;
