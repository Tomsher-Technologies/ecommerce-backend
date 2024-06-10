import express, { Router } from 'express';

import { logResponseStatus } from '../../../src/components/response-status';

import ProductController from '../../../src/controllers/frontend/guest/product-controller';
import CategoryController from '../../../src/controllers/frontend/guest/category-controller';
import BrandController from '../../../src/controllers/frontend/guest/brand-controller';

const router: Router = express.Router();

router.get('/category', logResponseStatus, CategoryController.findAllCategory);
router.get('/brand', logResponseStatus, BrandController.findAllBrand);
router.get('/attribute', logResponseStatus, ProductController.findAllAttributes);
router.get('/specification', logResponseStatus, ProductController.findAllSpecifications);
router.get('/product-detail/:id', logResponseStatus, ProductController.findProductDetail);
router.get('/product-list', logResponseStatus, ProductController.findAllProducts);



export default router;
