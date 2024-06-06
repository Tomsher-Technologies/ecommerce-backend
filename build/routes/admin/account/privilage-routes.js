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
const permission_blocks_1 = require("../../../src/constants/permission-blocks");
const privilages_controller_1 = __importDefault(require("../../../src/controllers/admin/account/privilages-controller"));
const router = express_1.default.Router();
router.use((0, helmet_1.default)());
router.use(express_1.default.json());
router.use(express_1.default.urlencoded({ extended: true }));
router.use(auth_middleware_1.default);
router.get('/', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.account.privilages, readOnly: 1 }), privilages_controller_1.default.findAll);
router.get('/:id', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.account.privilages, readOnly: 1 }), privilages_controller_1.default.findOne);
router.post('/manage-privilage/:id', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.account.privilages, writeOnly: 1 }), privilages_controller_1.default.managePrivilage);
router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});
exports.default = router;
