"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const response_status_1 = require("../../../src/components/response-status");
const auth_middleware_1 = __importDefault(require("../../../middleware/admin/auth-middleware"));
const admin_user_permission_roll_middleware_1 = __importDefault(require("../../../middleware/admin/admin-user-permission-roll-middleware"));
const permission_blocks_1 = require("../../../src/constants/permission-blocks");
const gallery_image_controller_1 = __importDefault(require("../../../src/controllers/admin/website/gallery-image-controller"));
const file_uploads_1 = require("../../../src/utils/file-uploads");
const router = express_1.default.Router();
const { upload } = (0, file_uploads_1.configureMulter)('galleryimages', ['galleryImage',]);
router.use(auth_middleware_1.default);
router.get('/', response_status_1.logResponseStatus, (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.website.galleryimages, readOnly: 1 }), gallery_image_controller_1.default.findAll);
router.get('/:id', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.website.galleryimages, writeOnly: 1 }), gallery_image_controller_1.default.findOne);
router.post('/', upload.any(), (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.website.galleryimages, readOnly: 1 }), response_status_1.logResponseStatus, gallery_image_controller_1.default.create);
router.post('/:id', upload.any(), (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.website.galleryimages, writeOnly: 1 }), response_status_1.logResponseStatus, gallery_image_controller_1.default.update);
router.post('/status-change/:id', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.website.galleryimages, writeOnly: 1 }), gallery_image_controller_1.default.statusChange);
router.delete('/:id', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.website.galleryimages }), gallery_image_controller_1.default.destroy);
exports.default = router;