import express, { Router } from 'express';

import { logResponseStatus } from '../../../src/components/response-status';
import { frontendAuthAndUnAuthMiddleware, frontendAuthMiddleware } from '../../../middleware/frontend/frontend-auth-middleware';
import { configureMulter } from '../../../src/utils/file-uploads';

import ReviewController from '../../../src/controllers/frontend/auth/review-controller';

const router: Router = express.Router();
const { upload } = configureMulter('review', ['reviewImage1,reviewImage2']);
router.get('/get-review/:id', logResponseStatus, frontendAuthAndUnAuthMiddleware, ReviewController.getReviews);

router.use(frontendAuthMiddleware);

router.post('/', upload.any(), logResponseStatus, frontendAuthMiddleware, ReviewController.updateReview);
// router.get('/list-review/', logResponseStatus, ReviewController.hasBought);


export default router;
