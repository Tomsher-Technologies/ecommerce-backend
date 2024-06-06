"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const response_status_1 = require("../../../src/components/response-status");
const file_uploads_1 = require("../../../src/utils/file-uploads");
const auth_middleware_1 = __importDefault(require("../../../middleware/admin/auth-middleware"));
const admin_user_permission_roll_middleware_1 = __importDefault(require("../../../middleware/admin/admin-user-permission-roll-middleware"));
const permission_blocks_1 = require("../../../src/constants/permission-blocks");
const navigation_menu_controller_1 = __importDefault(require("../../../src/controllers/admin/website/navigation-menu-controller"));
const router = express_1.default.Router();
const { upload } = (0, file_uploads_1.configureMulter)('navigationmenu', ['multiFiles',]);
router.use(auth_middleware_1.default);
router.get('/', response_status_1.logResponseStatus, (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.website.navigationMenu, readOnly: 1 }), navigation_menu_controller_1.default.findAll);
router.get('/find-with-country-id/:id', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.website.navigationMenu, readOnly: 1 }), navigation_menu_controller_1.default.findOneWithCountryId);
router.post('/manage-with-country-id/:id', upload.any(), (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.website.navigationMenu, readOnly: 1 }), navigation_menu_controller_1.default.manageWithCountryId);
router.use((err, req, res, next) => {
    // Check if the error is from multer
    if (err instanceof multer_1.default.MulterError) {
        console.error('Multer Error:', err);
        res.status(400).send('File upload error: ' + err.message);
    }
    else {
        console.error(err.stack);
        res.status(500).send('Something broke!');
    }
});
exports.default = router;
