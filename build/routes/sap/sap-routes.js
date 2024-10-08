"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = __importDefault(require("../../middleware/admin/auth-middleware"));
const sap_controller_1 = __importDefault(require("../../src/controllers/admin/sap/sap-controller"));
const router = express_1.default.Router();
router.use(auth_middleware_1.default);
router.get('/orders-list', sap_controller_1.default.getOrderDetails);
router.post('/product-inventory-update', sap_controller_1.default.productPriceUpdate);
exports.default = router;
