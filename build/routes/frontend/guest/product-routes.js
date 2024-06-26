"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const response_status_1 = require("../../../src/components/response-status");
const product_controller_1 = __importDefault(require("../../../src/controllers/frontend/guest/product-controller"));
const category_controller_1 = __importDefault(require("../../../src/controllers/frontend/guest/category-controller"));
const brand_controller_1 = __importDefault(require("../../../src/controllers/frontend/guest/brand-controller"));
const router = express_1.default.Router();
router.get('/category', response_status_1.logResponseStatus, category_controller_1.default.findAllCategory);
router.get('/brand', response_status_1.logResponseStatus, brand_controller_1.default.findAllBrand);
router.get('/attribute', response_status_1.logResponseStatus, product_controller_1.default.findAllAttributes);
router.get('/specification', response_status_1.logResponseStatus, product_controller_1.default.findAllSpecifications);
router.get('/product-detail/:slug/:sku?', response_status_1.logResponseStatus, product_controller_1.default.findProductDetail);
router.get('/product-list', response_status_1.logResponseStatus, product_controller_1.default.findAllProducts);
exports.default = router;
