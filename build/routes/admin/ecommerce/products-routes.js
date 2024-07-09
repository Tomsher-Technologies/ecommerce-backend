"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const file_uploads_1 = require("../../../src/utils/file-uploads");
const auth_middleware_1 = __importDefault(require("../../../middleware/admin/auth-middleware"));
const admin_user_permission_roll_middleware_1 = __importDefault(require("../../../middleware/admin/admin-user-permission-roll-middleware"));
const response_status_1 = require("../../../src/components/response-status");
const permission_blocks_1 = require("../../../src/constants/permission-blocks");
const products_controller_1 = __importDefault(require("../../../src/controllers/admin/ecommerce/products-controller"));
const router = express_1.default.Router();
const { upload } = (0, file_uploads_1.configureMulter)('product', ['productImage',]);
const { uploadExcel } = (0, file_uploads_1.configureMulterExcel)('product/excel', ['productExcel',]);
router.use(auth_middleware_1.default);
router.get('/', response_status_1.logResponseStatus, (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.ecommerce.products, readOnly: 1 }), products_controller_1.default.findAll);
router.get('/:id', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.ecommerce.products, readOnly: 1 }), products_controller_1.default.findOne);
router.post('/import-excel', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.ecommerce.products, writeOnly: 1 }), uploadExcel.single('productExcel'), products_controller_1.default.importProductExcel);
router.post('/', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.ecommerce.products, writeOnly: 1 }), upload.any(), products_controller_1.default.create);
router.post('/:id', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.ecommerce.products, writeOnly: 1 }), upload.any(), response_status_1.logResponseStatus, products_controller_1.default.update);
router.post('/website/update-website-priority', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.ecommerce.products, writeOnly: 1 }), response_status_1.logResponseStatus, products_controller_1.default.updateWebsitePriority);
router.delete('/:id', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.ecommerce.products }), products_controller_1.default.destroy);
router.post('/status-change/:id', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.ecommerce.products, writeOnly: 1 }), products_controller_1.default.statusChange);
router.use((err, req, res, next) => {
    // Check if the error is from multer
    // console.log('req', req);
    if (err instanceof multer_1.default.MulterError) {
        console.error('Multer Error:', err);
        res.status(400).send('File upload error: ' + err.message);
    }
    else {
        console.error(err.stack);
        res.status(500).send('Something broke here!');
    }
});
exports.default = router;
