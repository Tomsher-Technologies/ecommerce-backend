"use strict";
// import 'module-alias/register';
// import { Request, Response } from 'express';
// import { capitalizeWords, formatZodError, handleFileUpload, slugify } from '../../../utils/helpers';
// import { cartSchema } from '../../../utils/schemas/frontend/guest/cart-schema';
// import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../../constants/admin/task-log';
// import BaseController from '../../admin/base-controller';
// import CartService from '../../../services/frontend/guest/cart-service'
// import CartsModel, { CartProps } from '../../../model/frontend/cart-order-model';
// import GeneralService from '../../../services/admin/general-service';
// import mongoose from 'mongoose';
// const controller = new BaseController();
// class BrandsController extends BaseController {
//     async create(req: Request, res: Response): Promise<void> {
//         try {
//             const validatedData = cartSchema.safeParse(req.body);
//             // console.log('req', req.file);
//             if (validatedData.success) {
//                 const { customerId, slug, productId, variantId, quantity, sku, guestUserId, status } = validatedData.data;
//                 const cartData = {
//                     customerId: customerId ? customerId : null,
//                     slug: slug,
//                     productId: productId ? productId : undefined,
//                     variantId: variantId ? variantId : undefined,
//                     guestUserId: guestUserId,
//                     quantity: Number(quantity),
//                     sku: sku,
//                     ['status' as string]: status || '1',
//                     createdAt: new Date(),
//                     updatedAt: new Date()
//                 };
//                 const newcart = await CartService.create(cartData);
//                 // const fetchedBrand = await BrandsService.findOne(newcart._id);
//                 if (newcart) {
//                     return controller.sendSuccessResponse(res, {
//                         requestedData: {
//                             ...newcart,
//                         },
//                         message: 'Cart created successfully!'
//                     }, 200, { // task log
//                         sourceFromId: newcart._id,
//                         sourceFrom: adminTaskLog.ecommerce.brands,
//                         activity: adminTaskLogActivity.create,
//                         activityStatus: adminTaskLogStatus.success
//                     });
//                 } else {
//                     return controller.sendErrorResponse(res, 200, {
//                         message: 'Error',
//                         validation: 'Something went wrong! brand cant be inserted. please try again'
//                     }, req);
//                 }
//             } else {
//                 return controller.sendErrorResponse(res, 200, {
//                     message: 'Validation error',
//                     validation: formatZodError(validatedData.error.errors)
//                 }, req);
//             }
//         } catch (error: any) {
//             if (error && error.errors && error.errors.brandTitle && error.errors.brandTitle.properties) {
//                 return controller.sendErrorResponse(res, 200, {
//                     message: 'Validation error',
//                     validation: {
//                         brandTitle: error.errors.brandTitle.properties.message
//                     }
//                 }, req);
//             } else if (error && error.errors && error.errors.brandImageUrl && error.errors.brandImageUrl.properties) {
//                 return controller.sendErrorResponse(res, 200, {
//                     message: 'Validation error',
//                     validation: {
//                         brandTitle: error.errors.brandImageUrl.properties.message
//                     }
//                 }, req);
//             }
//             return controller.sendErrorResponse(res, 500, {
//                 message: error.message || 'Some error occurred while creating brand',
//             }, req);
//         }
//     }
//     async findOne(req: Request, res: Response): Promise<void> {
//         try {
//             const brandId = req.params.id;
//             if (brandId) {
//                 const brand = await BrandsService.findOne(brandId);
//                 return controller.sendSuccessResponse(res, {
//                     requestedData: brandId,
//                     message: 'Success'
//                 });
//             } else {
//                 return controller.sendErrorResponse(res, 200, {
//                     message: 'Brand Id not found!',
//                 });
//             }
//         } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
//             return controller.sendErrorResponse(res, 500, { message: error.message });
//         }
//     }
//     async update(req: Request, res: Response): Promise<void> {
//         try {
//             const validatedData = brandSchema.safeParse(req.body);
//             if (validatedData.success) {
//                 const brandId = req.params.id;
//                 if (brandId) {
//                     const brandImage = (req as any).files.find((file: any) => file.fieldname === 'brandImage');
//                     const brandBannerImage = (req as any).files.find((file: any) => file.fieldname === 'brandBannerImage');
//                     let updatedBrandData = req.body;
//                     updatedBrandData = {
//                         ...updatedBrandData,
//                         brandTitle: capitalizeWords(updatedBrandData.brandTitle),
//                         brandImageUrl: handleFileUpload(req, await BrandsService.findOne(brandId), (req.file || brandImage), 'brandImageUrl', 'brand'),
//                         brandBannerImageUrl: handleFileUpload(req, await BrandsService.findOne(brandId), (req.file || brandBannerImage), 'brandBannerImageUrl', 'brand'),
//                         updatedAt: new Date()
//                     };
//                     const updatedBrand: any = await BrandsService.update(brandId, updatedBrandData);
//                     if (updatedBrand) {
//                         const languageValuesImages = (req as any).files.filter((file: any) =>
//                             file.fieldname &&
//                             file.fieldname.startsWith('languageValues[') &&
//                             file.fieldname.includes('[brandImage]')
//                         );
//                         const languageValuesBannerImages = (req as any).files.filter((file: any) =>
//                             file.fieldname &&
//                             file.fieldname.startsWith('languageValues[') &&
//                             file.fieldname.includes('[brandBannerImage]')
//                         );
//                         let newLanguageValues: any = []
//                         if (updatedBrandData.languageValues && updatedBrandData.languageValues.length > 0) {
//                             for (let i = 0; i < updatedBrandData.languageValues.length; i++) {
//                                 const languageValue = updatedBrandData.languageValues[i];
//                                 let brandImageUrl = '';
//                                 let brandBannerImageUrl = '';
//                                 const matchingImage = languageValuesImages.find((image: any) => image.fieldname.includes(`languageValues[${i}]`));
//                                 if (languageValuesImages.length > 0 && matchingImage) {
//                                     const existingLanguageValues = await GeneralService.findOneLanguageValues(multiLanguageSources.ecommerce.brands, updatedBrand._id, languageValue.languageId);
//                                     brandImageUrl = await handleFileUpload(req, existingLanguageValues.languageValues, matchingImage, `brandImageUrl`, 'brand');
//                                 } else {
//                                     brandImageUrl = updatedBrandData.languageValues[i].languageValues?.brandImageUrl
//                                 }
//                                 const matchingBannerImage = languageValuesBannerImages.find((image: any) => image.fieldname.includes(`languageValues[${i}]`));
//                                 if (languageValuesBannerImages.length > 0 && matchingBannerImage) {
//                                     const existingLanguageValues = await GeneralService.findOneLanguageValues(multiLanguageSources.ecommerce.brands, updatedBrand._id, languageValue.languageId);
//                                     brandBannerImageUrl = await handleFileUpload(req, existingLanguageValues.languageValues, matchingBannerImage, `brandBannerImageUrl`, 'brand');
//                                 } else {
//                                     brandBannerImageUrl = updatedBrandData.languageValues[i].languageValues?.brandBannerImageUrl
//                                 }
//                                 const languageValues = await GeneralService.multiLanguageFieledsManage(updatedBrand._id, {
//                                     ...languageValue,
//                                     languageValues: {
//                                         ...languageValue.languageValues,
//                                         brandImageUrl
//                                     }
//                                 });
//                                 newLanguageValues.push(languageValues);
//                             }
//                         }
//                         const updatedBrandMapped = Object.keys(updatedBrand).reduce((mapped: any, key: string) => {
//                             mapped[key] = updatedBrand[key];
//                             return mapped;
//                         }, {});
//                         return controller.sendSuccessResponse(res, {
//                             requestedData: {
//                                 ...updatedBrandMapped,
//                                 languageValues: newLanguageValues
//                             },
//                             message: 'Brand updated successfully!'
//                         }, 200, { // task log
//                             sourceFromId: updatedBrandMapped._id,
//                             sourceFrom: adminTaskLog.ecommerce.brands,
//                             activity: adminTaskLogActivity.update,
//                             activityStatus: adminTaskLogStatus.success
//                         });
//                     } else {
//                         return controller.sendErrorResponse(res, 200, {
//                             message: 'Brand Id not found!',
//                         }, req);
//                     }
//                 } else {
//                     return controller.sendErrorResponse(res, 200, {
//                         message: 'Brand Id not found! Please try again with brand id',
//                     }, req);
//                 }
//             } else {
//                 return controller.sendErrorResponse(res, 200, {
//                     message: 'Validation error',
//                     validation: formatZodError(validatedData.error.errors)
//                 }, req);
//             }
//         } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
//             return controller.sendErrorResponse(res, 500, {
//                 message: error.message || 'Some error occurred while updating brand'
//             }, req);
//         }
//     }
//     async statusChange(req: Request, res: Response): Promise<void> {
//         try {
//             const validatedData = brandStatusSchema.safeParse(req.body);
//             if (validatedData.success) {
//                 const brandId = req.params.id;
//                 if (brandId) {
//                     let { status } = req.body;
//                     const updatedBrandData = { status };
//                     const updatedBrand = await BrandsService.update(brandId, updatedBrandData);
//                     if (updatedBrand) {
//                         return controller.sendSuccessResponse(res, {
//                             requestedData: updatedBrand,
//                             message: 'Brand status updated successfully!'
//                         }, 200, { // task log
//                             sourceFromId: brandId,
//                             sourceFrom: adminTaskLog.ecommerce.brands,
//                             activity: adminTaskLogActivity.delete,
//                             activityStatus: adminTaskLogStatus.success
//                         });
//                     } else {
//                         return controller.sendErrorResponse(res, 200, {
//                             message: 'Brand Id not found!',
//                         }, req);
//                     }
//                 } else {
//                     return controller.sendErrorResponse(res, 200, {
//                         message: 'Brand Id not found! Please try again with brand id',
//                     }, req);
//                 }
//             } else {
//                 return controller.sendErrorResponse(res, 200, {
//                     message: 'Validation error',
//                     validation: formatZodError(validatedData.error.errors)
//                 }, req);
//             }
//         } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
//             return controller.sendErrorResponse(res, 500, {
//                 message: error.message || 'Some error occurred while updating brand'
//             }, req);
//         }
//     }
//     async destroy(req: Request, res: Response): Promise<void> {
//         try {
//             const brandId = req.params.id;
//             if (brandId) {
//                 const brand = await BrandsService.findOne(brandId);
//                 if (brandId) {
//                     // await BrandsService.destroy(brandId);
//                     //  controller.sendSuccessResponse(res, { message: 'Brand deleted successfully!' });
//                     return controller.sendErrorResponse(res, 200, {
//                         message: 'Cant to be delete brand!',
//                     });
//                 } else {
//                     return controller.sendErrorResponse(res, 200, {
//                         message: 'This Brand details not found!',
//                     });
//                 }
//             } else {
//                 return controller.sendErrorResponse(res, 200, {
//                     message: 'Brand id not found!',
//                 });
//             }
//         } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
//             return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting brand' });
//         }
//     }
//     async updateWebsitePriority(req: Request, res: Response): Promise<void> {
//         try {
//             const validatedData = updateWebsitePrioritySchema.safeParse(req.body);
//             if (validatedData.success) {
//                 const { keyColumn, root, container1 } = validatedData.data;
//                 const validKeys: (keyof BrandProps)[] = ['corporateGiftsPriority', 'brandListPriority'];
//                 if (validKeys.includes(keyColumn as keyof BrandProps)) {
//                     let updatedBrandData = req.body;
//                     updatedBrandData = {
//                         ...updatedBrandData,
//                         updatedAt: new Date()
//                     };
//                     await BrandsService.updateWebsitePriority(container1, keyColumn as keyof BrandProps);
//                     return controller.sendSuccessResponse(res, {
//                         requestedData: await BrandsModel.find({ [keyColumn]: { $gt: '0' } }).sort({ [keyColumn]: 'asc' }),
//                         message: 'Brand website priority updated successfully!'
//                     }, 200, { // task log
//                         sourceFromId: '',
//                         sourceFrom: adminTaskLog.ecommerce.brands,
//                         activity: adminTaskLogActivity.priorityUpdation,
//                         activityStatus: adminTaskLogStatus.success
//                     });
//                 } else {
//                     return controller.sendErrorResponse(res, 200, {
//                         message: 'Invalid key column provided',
//                     }, req);
//                 }
//             } else {
//                 return controller.sendErrorResponse(res, 200, {
//                     message: 'Validation error',
//                     validation: formatZodError(validatedData.error.errors)
//                 }, req);
//             }
//         } catch (error: any) {
//             return controller.sendErrorResponse(res, 500, {
//                 message: error.message || 'Some error occurred while creating brand',
//             }, req);
//         }
//     }
// }
// export default new BrandsController();
