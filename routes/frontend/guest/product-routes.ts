import express, { Router } from 'express';

import { logResponseStatus } from '../../../src/components/response-status';

import ProductController from '../../../src/controllers/frontend/guest/product-controller';
import CategoryController from '../../../src/controllers/frontend/guest/category-controller';
import BrandController from '../../../src/controllers/frontend/guest/brand-controller';
import { frontendAuthAndUnAuthMiddleware } from '../../../middleware/frontend/frontend-auth-middleware';

const router: Router = express.Router();

router.get('/category', logResponseStatus, CategoryController.findAllCategory);
router.get('/find-category/:slug', logResponseStatus, CategoryController.findOne);
router.get('/brand', logResponseStatus, BrandController.findAllBrand);
router.get('/attribute', logResponseStatus, ProductController.findAllAttributes);
router.get('/specification', logResponseStatus, ProductController.findAllSpecifications);
router.get('/product-detail/:slug/:sku?', logResponseStatus, ProductController.findProductDetail);
router.get('/product-detail-specification/:slug', logResponseStatus, ProductController.findProductDetailSpecification);
router.get('/product-detail-seo/:slug/:sku?', logResponseStatus, ProductController.findProductDetailSeo);
router.get('/product-list', frontendAuthAndUnAuthMiddleware, logResponseStatus, ProductController.findAllProducts);
router.get('/product-list/v2', frontendAuthAndUnAuthMiddleware, logResponseStatus, ProductController.findAllProductsNew);
router.get('/you-may-like-also', frontendAuthAndUnAuthMiddleware, logResponseStatus, ProductController.youMayLikeAlso);
router.get('/related-products', logResponseStatus, ProductController.relatedProducts);
router.get('/all-product-variants-list-with-basic-details', logResponseStatus, ProductController.findAllProductVariantsListWithBasicDetails);
router.get('/query-suggestions', logResponseStatus, ProductController.getSearchSuggestions);

export default router;
