"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const auth_1 = __importDefault(require("../../src/controllers/admin/auth"));
const router = express_1.default.Router();
router.use((0, helmet_1.default)());
// Parse incoming JSON bodies
router.use(express_1.default.json());
// Parse incoming URL-encoded bodies
router.use(express_1.default.urlencoded({ extended: true }));
router.post('/login', auth_1.default.login);
router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});
exports.default = router;
