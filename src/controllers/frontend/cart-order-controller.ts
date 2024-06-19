// import 'module-alias/register';
// import { Request, Response } from 'express';

// import { capitalizeWords, formatZodError, handleFileUpload, slugify } from '../../utils/helpers';
// import { cartProductSchema, cartSchema } from '../../utils/schemas/frontend/guest/cart-schema';
// import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../constants/admin/task-log';

// import BaseController from '../admin/base-controller';
// import CartService from '../../services/frontend/cart-service'
// import CartsOrderModel, { CartOrderProps } from '../../model/frontend/cart-order-model';
// import GeneralService from '../../services/admin/general-service';
// import mongoose from 'mongoose';
// import CartOrdersModel from '../../model/frontend/cart-order-model';
// import CommonService from '../../services/frontend/guest/common-service'
// import cartService from '../../services/frontend/cart-service';
// import CartOrderProductsModel, { CartOrderProductProps } from '../../model/frontend/cart-order-product-model';

// const controller = new BaseController();

// class CartController extends BaseController {


//     async createCartOrder(req: Request, res: Response): Promise<void> {
//         try {
//             const validatedData = cartSchema.safeParse(req.body);
//             const user = res.locals.user;

//             if (validatedData.success) {
//                 const { shippingStatus, shipmentGatwayId,
//                     paymentGatwayId, pickupStoreId, orderComments, paymentMethod, paymentMethodCharge, rewardPoints,
//                     totalReturnedProduct, totalDiscountAmount, totalShippingAmount, totalCouponAmount, totalWalletAmount,
//                     totalTaxAmount, totalOrderAmount } = validatedData.data;

//                 let customer, guestUser
//                 let country = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
//                 let newCartOrder
//                 const isObjectId = /^[0-9a-fA-F]{24}$/.test(user);
//                 if (isObjectId) {
//                     customer = user
//                 } else {
//                     guestUser = user
//                 }
//                 if (customer || guestUser) {
//                     const existingProduct = await CartService.findCart({
//                         $or: [
//                             { customerId: customer },
//                             { guestUserId: guestUser }
//                         ]
//                     });

//                     const cartOrderData = {
//                         customerId: customer,
//                         guestUserId: guestUser,
//                         countryId: country,
//                         cartStatus: '1',
//                         orderStatus: '0',
//                         orderStatusAt: new Date(), // Assuming orderStatusAt is set at creation time
//                         shippingStatus,
//                         shipmentGatwayId,
//                         paymentGatwayId,
//                         pickupStoreId,
//                         orderComments,
//                         paymentMethod,
//                         paymentMethodCharge,
//                         rewardPoints,
//                         totalReturnedProduct,
//                         totalDiscountAmount,
//                         totalShippingAmount,
//                         totalCouponAmount,
//                         totalWalletAmount,
//                         totalTaxAmount,
//                         totalOrderAmount,
//                         createdBy: user._id, // Assuming user._id is the creator of this entry
//                         createdAt: new Date(),
//                         updatedAt: new Date()
//                     };

//                     if (existingProduct) {
//                         newCartOrder = await cartService.update(existingProduct._id, cartOrderData);
//                         if (newCartOrder) {
//                             console.log("hfghgfhfgh", newCartOrder._id, validatedData);

//                             const { productId, variantId, quantity, sku, slug, orderStatus } = req.body;
//                             const existingProduct: any = await CartOrderProductsModel.find({
//                                 $and: [
//                                     { cartId: newCartOrder._id },
//                                     { productId: new mongoose.Types.ObjectId(productId) },
//                                     { variantId: new mongoose.Types.ObjectId(variantId) }
//                                 ]
//                             });
//                             console.log("newCartOrderProduct", newCartOrder._id, productId, "llllll", existingProduct);

//                             const cartOrderProductData = {
//                                 cartId: newCartOrder._id,
//                                 customerId: customer,
//                                 productId,
//                                 variantId,
//                                 quantity: existingProduct[0].quantity ? existingProduct[0].quantity + 1 : quantity,
//                                 sku,
//                                 slug,
//                                 orderStatus,
//                                 createdAt: new Date(),
//                                 updatedAt: new Date()
//                             };
//                             let newCartOrderProduct: any
//                             if (existingProduct) {
//                                 newCartOrderProduct = await CartService.updateCartProduct(existingProduct[0]._id, cartOrderProductData);
//                                 console.log("cartOrderProductData", cartOrderProductData);

//                             } else {
//                                 newCartOrderProduct = await CartOrderProductsModel.create(cartOrderProductData);

//                             }
//                             if (newCartOrderProduct) {
//                                 console.log("newCartOrderProduct", newCartOrderProduct);
//                             }
//                             // Rest of your code
//                         }
//                     } else {
//                         newCartOrder = await cartService.create(cartOrderData);
//                     }


//                     if (newCartOrder) {
//                         // Adjust response structure as needed
//                         return controller.sendSuccessResponse(res, {
//                             requestedData: {
//                                 newCartOrder,
//                             },
//                             message: 'Cart order created successfully!'
//                         }, 200);
//                     }
//                 } else {
//                     return controller.sendErrorResponse(res, 200, {
//                         message: 'Error',
//                         validation: 'Something went wrong! Cart order could not be inserted. Please try again'
//                     });
//                 }
//             } else {
//                 return controller.sendErrorResponse(res, 200, {
//                     message: 'Validation error',
//                     validation: formatZodError(validatedData.error.errors)
//                 });
//             }
//         } catch (error: any) {
//             // Handle specific validation errors or general errors
//             if (error && error.errors && error.errors.someSpecificField && error.errors.someSpecificField.properties) {
//                 return controller.sendErrorResponse(res, 200, {
//                     message: 'Validation error',
//                     validation: {
//                         someSpecificField: error.errors.someSpecificField.properties.message
//                     }
//                 });
//             }
//             // Handle other errors
//             return controller.sendErrorResponse(res, 200, {
//                 message: error.message || 'Some error occurred while creating cart order',
//             });
//         }
//     }

//     async createCartProduct(cartId: string, data: any): Promise<void> {
//         try {
//             console.log("data", data);

//             const { productId, variantId, quantity, sku, slug, orderStatus } = data;

//             const cartOrderProductData = {
//                 cartId: cartId,
//                 productId,
//                 variantId,
//                 quantity,
//                 sku,
//                 slug,
//                 orderStatus,
//                 createdAt: new Date(),
//                 updatedAt: new Date()
//             };

//             const newCartOrderProduct: any = await CartOrderProductsModel.create(cartOrderProductData);
//             if (newCartOrderProduct) {
//                 return newCartOrderProduct;
//             }

//         } catch (error) {
//             console.error("Error creating cart order product:", error);
//             throw error; // Re-throw error to be handled by calling function
//         }
//     }

// }

// export default new CartController();