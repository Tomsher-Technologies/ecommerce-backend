"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const response_status_1 = require("../../../src/components/response-status");
const common_controller_1 = __importDefault(require("../../../src/controllers/frontend/guest/common-controller"));
const router = express_1.default.Router();
router.get('/countries', response_status_1.logResponseStatus, common_controller_1.default.findAllCountries);
router.get('/slider', response_status_1.logResponseStatus, common_controller_1.default.findAllSliders);
router.get('/banner', common_controller_1.default.findAllBanners);
router.get('/website-setups', common_controller_1.default.findWebsiteSetups);
router.get('/website-setups', common_controller_1.default.findWebsiteSetups);
router.get('/priority-product', common_controller_1.default.findPriorityProducts);
router.get('/collection-products', common_controller_1.default.findCollectionProducts);
router.get('/collection-categories', common_controller_1.default.findCollectionCategories);
router.get('/collection-brands', common_controller_1.default.findCollectionBrands);
exports.default = router;
