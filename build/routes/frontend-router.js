"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_routes_1 = __importDefault(require("./frontend/guest/auth-routes"));
const category_routes_1 = __importDefault(require("./frontend/guest/category-routes"));
const common_routes_1 = __importDefault(require("./frontend/common-routes"));
const product_routes_1 = __importDefault(require("./frontend/guest/product-routes"));
const frontendRouter = express_1.default.Router();
frontendRouter.use('/auth', auth_routes_1.default);
frontendRouter.use('/category', category_routes_1.default);
frontendRouter.use('/common', common_routes_1.default);
frontendRouter.use('/product', product_routes_1.default);
exports.default = frontendRouter;
