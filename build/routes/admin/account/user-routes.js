"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const response_status_1 = require("../../../src/components/response-status");
const file_uploads_1 = require("../../../src/utils/file-uploads");
const auth_middleware_1 = __importDefault(require("../../../middleware/admin/auth-middleware"));
const admin_user_permission_roll_middleware_1 = __importDefault(require("../../../middleware/admin/admin-user-permission-roll-middleware"));
const permission_blocks_1 = require("../../../src/constants/permission-blocks");
const users_controller_1 = __importDefault(require("../../../src/controllers/admin/account/users-controller"));
const router = express_1.default.Router();
// Apply Helmet middleware for enhanced security
router.use((0, helmet_1.default)());
const { upload } = (0, file_uploads_1.configureMulter)('user', ['userImage',]);
// Apply authentication middleware
router.use(auth_middleware_1.default);
// Define routes
// .get(UserController.findAll)
// .post(UserController.create)
// .post(UserController.update)
// .delete(UserController.destroy);
router.get('/', response_status_1.logResponseStatus, (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.account.users, readOnly: 1 }), users_controller_1.default.findAll);
router.get('/:id', response_status_1.logResponseStatus, (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.account.users, readOnly: 1 }), users_controller_1.default.findOne);
router.post('/', upload.single('userImage'), (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.account.users, writeOnly: 1 }), response_status_1.logResponseStatus, users_controller_1.default.create);
router.post('/:id', upload.single('userImage'), (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.account.users, writeOnly: 1 }), response_status_1.logResponseStatus, users_controller_1.default.update);
router.delete('/:id', response_status_1.logResponseStatus, (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.account.users }), users_controller_1.default.destroy);
// Error handling middleware
router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});
exports.default = router;
