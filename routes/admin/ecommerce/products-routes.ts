import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import { configureMulter } from '../../../src/utils/file-uploads';
import authMiddleware from '../../../middleware/admin/auth-middleware';
import userPermissionMiddleware from '../../../middleware/admin/admin-user-permission-roll-middleware';
import { logResponseStatus } from '../../../src/components/response-status';
import { permissionBlocks } from '../../../src/constants/permission-blocks';

import ProductsController from '../../../src/controllers/admin/ecommerce/products-controller';

const router: Router = express.Router();

const { upload } = configureMulter('product', ['productImage',]);

router.use(authMiddleware);

router.get('/', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.products, readOnly: 1 }), ProductsController.findAll);
router.get('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.products, readOnly: 1 }), ProductsController.findOne);
router.post('/import-excel', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.products, writeOnly: 1 }), upload.single('file'), ProductsController.importProductExcel);
router.post('/', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.products, writeOnly: 1 }), upload.any(), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await ProductsController.create(req, res);
    } catch (error) {
        // Handle any errors that occur during product creation
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}, ProductsController.create)
router.post('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.products, writeOnly: 1 }), upload.any(), logResponseStatus, ProductsController.update);
router.post('/website/update-website-priority', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.products, writeOnly: 1 }), logResponseStatus, ProductsController.updateWebsitePriority);
router.delete('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.products }), ProductsController.destroy);
router.post('/status-change/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.products, writeOnly: 1 }), ProductsController.statusChange);

router.use((err: any, req: Request, res: Response, next: NextFunction) => {
    // Check if the error is from multer
    // console.log('req', req);
    if (err instanceof multer.MulterError) {
        console.error('Multer Error:', err);
        res.status(400).send('File upload error: ' + err.message);
    } else {
        console.error(err.stack);
        res.status(500).send('Something broke here!');
    }
});


export default router;
