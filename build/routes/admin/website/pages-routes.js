"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const file_uploads_1 = require("../../../src/utils/file-uploads");
const auth_middleware_1 = __importDefault(require("../../../middleware/admin/auth-middleware"));
const admin_user_permission_roll_middleware_1 = __importDefault(require("../../../middleware/admin/admin-user-permission-roll-middleware"));
const permission_blocks_1 = require("../../../src/constants/permission-blocks");
const pages_controller_1 = __importDefault(require("../../../src/controllers/admin/website/pages-controller"));
const router = express_1.default.Router();
const { upload } = (0, file_uploads_1.configureMulter)('basicsettings', ['multiFiles',]);
router.use(auth_middleware_1.default);
router.get('/find-with-country-id/:id', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.setup.websitesetups, readOnly: 1 }), pages_controller_1.default.findOneWithCountryId);
router.post('/manage-with-country-id/:id', upload.any(), (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.setup.websitesetups, readOnly: 1 }), pages_controller_1.default.manageWithCountryId);
exports.default = router;
