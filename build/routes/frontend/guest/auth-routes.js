"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const guest_controller_1 = __importDefault(require("../../../src/controllers/frontend/guest/guest-controller"));
const router = express_1.default.Router();
router.use((0, helmet_1.default)());
router.use(express_1.default.json());
router.use(express_1.default.urlencoded({ extended: true }));
router.post('/register', guest_controller_1.default.register);
router.post('/resend-otp', guest_controller_1.default.resendOtp);
router.post('/verify-otp', guest_controller_1.default.verifyOtp);
router.post('/forgot-password', guest_controller_1.default.forgotPassword);
router.post('/login', guest_controller_1.default.login);
router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});
exports.default = router;
