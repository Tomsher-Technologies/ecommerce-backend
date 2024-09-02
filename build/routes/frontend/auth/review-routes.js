"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const response_status_1 = require("../../../src/components/response-status");
const frontend_auth_middleware_1 = require("../../../middleware/frontend/frontend-auth-middleware");
const file_uploads_1 = require("../../../src/utils/file-uploads");
const review_controller_1 = __importDefault(require("../../../src/controllers/frontend/auth/review-controller"));
const router = express_1.default.Router();
const { upload } = (0, file_uploads_1.configureMulter)('review', ['reviewImage1,reviewImage2']);
router.get('/get-review/:id', response_status_1.logResponseStatus, frontend_auth_middleware_1.frontendAuthAndUnAuthMiddleware, review_controller_1.default.getReviews);
router.use(frontend_auth_middleware_1.frontendAuthMiddleware);
router.post('/', upload.any(), response_status_1.logResponseStatus, frontend_auth_middleware_1.frontendAuthMiddleware, review_controller_1.default.updateReview);
// router.get('/list-review/', logResponseStatus, ReviewController.hasBought);
exports.default = router;
