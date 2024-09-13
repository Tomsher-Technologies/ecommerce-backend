import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import { configureMulter, configureMulterExcel } from '../../../src/utils/file-uploads';
import authMiddleware from '../../../middleware/admin/auth-middleware';
import userPermissionMiddleware from '../../../middleware/admin/admin-user-permission-roll-middleware';
import { logResponseStatus } from '../../../src/components/response-status';
import { permissionBlocks } from '../../../src/constants/permission-blocks';

import ProductsController from '../../../src/controllers/admin/ecommerce/products-controller';

const router: Router = express.Router();

const { upload } = configureMulter('product', ['productImage',]);
const { uploadExcel } = configureMulterExcel('product/excel', ['productExcel',]);

router.post('/import-language-excel', uploadExcel.single('productExcel'), ProductsController.importLanguageExcel);
router.use(authMiddleware);

router.get('/', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.products, readOnly: 1 }), ProductsController.findAll);
// router.get('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.products, readOnly: 1 }), ProductsController.findOne);
router.post('/import-excel', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.products, writeOnly: 1 }), uploadExcel.single('productExcel'), ProductsController.importProductExcel);
router.post('/import-product-price-excel', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.products, writeOnly: 1 }), uploadExcel.single('productExcel'), ProductsController.importProductPriceExcel);
router.post('/', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.products, writeOnly: 1 }), upload.any(), ProductsController.create)
router.post('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.products, writeOnly: 1 }), upload.any(), logResponseStatus, ProductsController.update);
router.post('/website/update-website-priority', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.products, writeOnly: 1 }), logResponseStatus, ProductsController.updateWebsitePriority);
router.delete('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.products }), ProductsController.destroy);
router.post('/status-change/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.products, writeOnly: 1 }), ProductsController.statusChange);
router.get('/out-of-stock-products', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.products, readOnly: 1 }), ProductsController.outOfStockProducts);

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
