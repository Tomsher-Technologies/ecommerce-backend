"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const auth_middleware_1 = __importDefault(require("../../../middleware/admin/auth-middleware"));
const admin_user_permission_roll_middleware_1 = __importDefault(require("../../../middleware/admin/admin-user-permission-roll-middleware"));
const user_types_controller_1 = __importDefault(require("../../../src/controllers/admin/account/user-types-controller"));
const permission_blocks_1 = require("../../../src/constants/permission-blocks");
const router = express_1.default.Router();
router.use((0, helmet_1.default)());
router.use(express_1.default.json());
router.use(express_1.default.urlencoded({ extended: true }));
router.use(auth_middleware_1.default);
router.get('/', user_types_controller_1.default.findAll);
router.get('/:id', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.account.userTypes, readOnly: 1 }), user_types_controller_1.default.findOne);
router.post('/', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.account.userTypes, writeOnly: 1 }), user_types_controller_1.default.create);
router.post('/:id', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.account.userTypes, writeOnly: 1 }), user_types_controller_1.default.update);
router.delete('/:id', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.account.userTypes }), user_types_controller_1.default.destroy);
router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});
exports.default = router;
