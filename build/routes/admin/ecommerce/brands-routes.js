"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const response_status_1 = require("../../../src/components/response-status");
const admin_user_permission_roll_middleware_1 = __importDefault(require("../../../middleware/admin/admin-user-permission-roll-middleware"));
const auth_middleware_1 = __importDefault(require("../../../middleware/admin/auth-middleware"));
const file_uploads_1 = require("../../../src/utils/file-uploads");
const permission_blocks_1 = require("../../../src/constants/permission-blocks");
const brands_controller_1 = __importDefault(require("../../../src/controllers/admin/ecommerce/brands-controller"));
const router = express_1.default.Router();
const { upload } = (0, file_uploads_1.configureMulter)('brand', ['brandImage', 'brandBannerImage']);
router.use(auth_middleware_1.default);
router.get('/', response_status_1.logResponseStatus, (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.ecommerce.brands, readOnly: 1 }), brands_controller_1.default.findAll);
router.get('/:id', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.ecommerce.brands, writeOnly: 1 }), brands_controller_1.default.findOne);
router.post('/', upload.any(), (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.ecommerce.brands, readOnly: 1 }), response_status_1.logResponseStatus, brands_controller_1.default.create);
router.post('/:id', upload.any(), (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.ecommerce.brands, writeOnly: 1 }), response_status_1.logResponseStatus, brands_controller_1.default.update);
router.post('/website/update-website-priority', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.ecommerce.brands, writeOnly: 1 }), response_status_1.logResponseStatus, brands_controller_1.default.updateWebsitePriority);
router.post('/status-change/:id', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.ecommerce.brands, writeOnly: 1 }), brands_controller_1.default.statusChange);
router.delete('/:id', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.ecommerce.brands }), brands_controller_1.default.destroy);
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
