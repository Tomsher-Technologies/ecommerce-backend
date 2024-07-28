"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const general_controller_1 = __importDefault(require("../../../src/controllers/admin/general/general-controller"));
const router = express_1.default.Router();
router.get('/website-settings', general_controller_1.default.getGeneralSettings);
router.get('/page-seo-details', general_controller_1.default.getPageSeoDetails);
exports.default = router;
