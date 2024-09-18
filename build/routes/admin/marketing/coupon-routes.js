"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const response_status_1 = require("../../../src/components/response-status");
const auth_middleware_1 = __importDefault(require("../../../middleware/admin/auth-middleware"));
const admin_user_permission_roll_middleware_1 = __importDefault(require("../../../middleware/admin/admin-user-permission-roll-middleware"));
const permission_blocks_1 = require("../../../src/constants/permission-blocks");
const coupons_controller_1 = __importDefault(require("../../../src/controllers/admin/marketing/coupons-controller"));
const file_uploads_1 = require("../../../src/utils/file-uploads");
const router = express_1.default.Router();
const { uploadExcel } = (0, file_uploads_1.configureMulterExcel)('coupon/excel', ['couponExcel',]);
router.use(auth_middleware_1.default);
router.get('/', response_status_1.logResponseStatus, (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.marketing.coupons, readOnly: 1 }), coupons_controller_1.default.findAll);
router.get('/:id', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.marketing.coupons, readOnly: 1 }), coupons_controller_1.default.findOne);
router.post('/', response_status_1.logResponseStatus, (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.marketing.coupons, writeOnly: 1 }), coupons_controller_1.default.create);
router.post('/:id', response_status_1.logResponseStatus, (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.marketing.coupons, writeOnly: 1 }), coupons_controller_1.default.update);
router.post('/status-change/:id', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.marketing.coupons, writeOnly: 1 }), coupons_controller_1.default.statusChange);
router.delete('/:id', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.marketing.coupons }), coupons_controller_1.default.destroy);
router.post('/import-excel/coupon', (0, admin_user_permission_roll_middleware_1.default)({ permissionBlock: permission_blocks_1.permissionBlocks.marketing.coupons, writeOnly: 1 }), uploadExcel.single('couponExcel'), coupons_controller_1.default.couponExcelUpload);
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
