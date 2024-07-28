import express, { Router } from 'express';

import GeneralController from '../../../src/controllers/admin/general/general-controller';

const router: Router = express.Router();

router.get('/website-settings', GeneralController.getGeneralSettings);
router.get('/page-seo-details', GeneralController.getPageSeoDetails);

export default router;
