"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = __importDefault(require("../../../middleware/admin/auth-middleware"));
// import DashboardController from '../../../src/controllers/admin/dashboard/dashboard-controller';
const router = express_1.default.Router();
router.use(auth_middleware_1.default);
// router.get('/', userPermissionMiddleware({ permissionBlock: permissionBlocks.dashboards.offers }), DashboardController.dashboard);
exports.default = router;
