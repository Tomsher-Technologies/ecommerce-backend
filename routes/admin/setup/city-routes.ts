import express, { Router } from 'express';

import authMiddleware from '../../../middleware/admin/auth-middleware';
import userPermissionMiddleware from '../../../middleware/admin/admin-user-permission-roll-middleware';
import { logResponseStatus } from '../../../src/components/response-status';

import StateController from '../../../src/controllers/admin/setup/state-controller';
import { permissionBlocks } from '../../../src/constants/permission-blocks';
import CityController from '../../../src/controllers/admin/setup/city-controller';

const router: Router = express.Router();


router.use(authMiddleware);

router.get('/', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.state, readOnly: 1 }), CityController.findAllCity);
router.get('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.state, readOnly: 1 }), CityController.findOneCity);
router.get('city-state/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.state, readOnly: 1 }), CityController.findOneCityFromState);
router.post('/', userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.state, writeOnly: 1 }), logResponseStatus, CityController.createCity);
router.post('/:id', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.state, writeOnly: 1 }), CityController.updateCity);
router.post('/status-change/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.state, writeOnly: 1 }), CityController.statusChangeCity);


export default router;