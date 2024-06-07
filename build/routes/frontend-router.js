"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_routes_1 = __importDefault(require("./frontend/guest/auth-routes"));
const category_routes_1 = __importDefault(require("./frontend/guest/category-routes"));
const common_routes_1 = __importDefault(require("./frontend/guest/common-routes"));
const product_routes_1 = __importDefault(require("./frontend/guest/product-routes"));
const pages_controller_1 = __importDefault(require("../src/controllers/frontend/guest/pages-controller"));
const frontendRouter = express_1.default.Router();
frontendRouter.use('/auth', auth_routes_1.default);
frontendRouter.use('/category', category_routes_1.default);
frontendRouter.use('/common', common_routes_1.default);
frontendRouter.use('/product', product_routes_1.default);
frontendRouter.use('/pages/:slug', pages_controller_1.default.findPagesData);
exports.default = frontendRouter;
