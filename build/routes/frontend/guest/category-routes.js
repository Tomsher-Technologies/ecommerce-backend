"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const response_status_1 = require("../../../src/components/response-status");
const category_controller_1 = __importDefault(require("../../../src/controllers/frontend/guest/category-controller"));
const router = express_1.default.Router();
router.get('/', response_status_1.logResponseStatus, category_controller_1.default.findAll);
exports.default = router;