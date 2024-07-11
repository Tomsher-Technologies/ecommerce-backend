import express, { Router } from 'express';

import { logResponseStatus } from '../../../src/components/response-status';

import authMiddleware from '../../../middleware/admin/auth-middleware';
import userPermissionMiddleware from '../../../middleware/admin/admin-user-permission-roll-middleware';
import { permissionBlocks } from '../../../src/constants/permission-blocks';

import GalleryImagesController from '../../../src/controllers/admin/website/gallery-image-controller';
import { configureMulter } from '../../../src/utils/file-uploads';

const router: Router = express.Router();
const { upload } = configureMulter('galleryimages', ['galleryImage',]);

router.use(authMiddleware);

// router.get('/', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.galleryimages, readOnly: 1 }), GalleryImagesController.findAll);
// router.get('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.galleryimages, writeOnly: 1 }), GalleryImagesController.findOne);
router.post('/', upload.any(), userPermissionMiddleware({ permissionBlock: permissionBlocks.website.galleryimages, readOnly: 1 }), logResponseStatus, GalleryImagesController.create);
// router.post('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.galleryimages, writeOnly: 1 }), logResponseStatus, GalleryImagesController.update);
// router.post('/status-change/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.galleryimages, writeOnly: 1 }), GalleryImagesController.statusChange);
// router.delete('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.galleryimages }), GalleryImagesController.destroy);


export default router;
