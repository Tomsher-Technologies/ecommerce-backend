import 'module-alias/register';
import { Request, Response, query } from 'express';

import { capitalizeWords, formatZodError, handleFileUpload, slugify } from '../../utils/helpers';
import { cartProductSchema, cartSchema } from '../../utils/schemas/frontend/guest/cart-schema';
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../constants/admin/task-log';

import BaseController from '../admin/base-controller';
import CartService from '../../services/frontend/cart-service'
import CartsOrderModel, { CartOrderProps } from '../../model/frontend/cart-order-model';
import GeneralService from '../../services/admin/general-service';
import mongoose from 'mongoose';
import CartOrdersModel from '../../model/frontend/cart-order-model';
import CommonService from '../../services/frontend/guest/common-service'
import cartService from '../../services/frontend/cart-service';
import CartOrderProductsModel, { CartOrderProductProps } from '../../model/frontend/cart-order-product-model';
import productService from '../../services/frontend/guest/product-service';
import ProductsModel from '../../model/admin/ecommerce/product-model';
import ProductVariantsModel from '../../model/admin/ecommerce/product/product-variants-model';
import { number } from 'zod';
import { addToWishlistSchema } from '../../utils/schemas/frontend/auth/wishlist-schema';
import CustomerWishlistCountryService from '../../services/frontend/auth/customer-wishlist-servicel'
import WebsiteSetupModel from '../../model/admin/setup/website-setup-model';
import { blockReferences, websiteSetup } from '../../constants/website-setup';
import { QueryParams } from '../../utils/types/common';

const controller = new BaseController();

class CartController extends BaseController {


    async createCartOrder(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = cartSchema.safeParse(req.body);
            const user = res.locals.user;
            const uuid = res.locals.uuid;

            if (validatedData.success) {
                const { shippingStatus, shipmentGatwayId,
                    paymentGatwayId, pickupStoreId, orderComments, paymentMethod, paymentMethodCharge, rewardPoints,
                    totalReturnedProduct, totalProductAmount, totalDiscountAmount, totalShippingAmount, totalCouponAmount, totalWalletAmount,
                    totalTaxAmount, totalAmount, codAmount } = validatedData.data;
                const { variantId, quantity, slug, orderStatus } = req.body;

                let customer, guestUser
                let country = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
                let newCartOrder
                let newCartOrderProduct: any

                customer = user
                guestUser = uuid
                const guestUserCart: any = await CartService.findCart(
                    {
                        $and: [
                            { guestUserId: guestUser },
                            { countryId: country },
                            { customerId: null }
                        ]
                    });
                const productVariantData: any = await ProductVariantsModel.findOne({
                    $or: [
                        { _id: variantId },
                        { slug: slug }
                    ]
                })

                if (customer && guestUser && guestUserCart) {

                    const customerCart: any = await CartService.findCart(
                        {
                            $and: [
                                { customerId: customer },
                                { countryId: country }
                            ]
                        }
                    );
                    // const guestUserCart: any = await CartService.findCart(
                    //     {
                    //         $and: [
                    //             { guestUserId: guestUser },
                    //             { countryId: country }
                    //         ]
                    //     });
                    if (guestUserCart) {
                        const cartProducts = await CartOrderProductsModel.find({
                            $or: [
                                { cartId: guestUserCart?._id },
                                { cartId: customerCart?._id }
                            ]
                        })

                        const combinedData: any = [];
                        const variantIdMap: any = {};

                        // Iterate through each object in data
                        cartProducts.forEach((item: any) => {
                            const variantId = item.variantId;
                            if (!variantIdMap[variantId]) {
                                // If variantId is not in the map, add it with initial quantity
                                variantIdMap[variantId] = {
                                    _id: item._id,
                                    cartId: item.cartId,
                                    slug: productVariantData.slug,
                                    giftWrapAmount: item.giftWrapAmount,
                                    quantity: item.quantity,
                                    variantId: productVariantData._id,
                                    productId: productVariantData.productId,

                                };
                            } else {
                                // If variantId is already in the map, update the quantity
                                variantIdMap[variantId].quantity += item.quantity;
                            }
                        });

                        // Convert variantIdMap object back to array format
                        for (const key in variantIdMap) {
                            combinedData.push(variantIdMap[key]);
                        }

                        var updateCart

                        for (let data of combinedData) {
                            const cartProduct: any = await CartOrderProductsModel.findOne({
                                $and: [
                                    { cartId: data.cartId },
                                    { variantId: data.variantId }
                                ]
                            })

                            if (cartProduct) {
                                updateCart = await CartService.updateCartProductByCart({
                                    $and: [
                                        { cartId: data.cartId },
                                        { variantId: data.variantId }
                                    ]
                                },
                                    {
                                        cartId: data.cartId,
                                        slug: data.slug,
                                        giftWrapAmount: data.giftWrapAmount,
                                        quantity: data.quantity,
                                        variantId: data.variantId,
                                        productId: data.productId
                                    })

                                if (updateCart) {

                                    const deletedData = await CartService.destroy(guestUserCart._id);
                                    const updateData = await CartService.update(customerCart._id, { guestUserId: null });

                                    const deletedProductData = await CartService.destroyCartProduct1({ cartId: guestUserCart._id });

                                    const cart: any = await CartService.findCartPopulate({
                                        query: {
                                            $and: [
                                                { customerId: customer },
                                                { countryId: country }
                                            ]
                                        },
                                        hostName: req.get('origin'),
                                    })

                                    // const cart = await CartService.findCartPopulate({
                                    //     $and: [
                                    //         { customerId: customer },
                                    //         { countryId: country }
                                    //     ]
                                    // })

                                    return controller.sendSuccessResponse(res, {
                                        requestedData: {
                                            ...cart
                                        },
                                        message: 'Your cart is ready!'
                                    });
                                }
                            }



                        }

                    }
                } else

                    if (customer || guestUser) {
                        const existingCart = await CartService.findCart({
                            $or: [
                                { customerId: customer },
                                { guestUserId: guestUser }
                            ]
                        });



                        // totalProductAmount = 

                        let totalAmountOfProduct = 0
                        let totalDiscountAmountOfProduct = 0
                        let quantityProduct = 0
                        totalAmountOfProduct = productVariantData?.price * quantity
                        totalDiscountAmountOfProduct = productVariantData.discountPrice * quantity

                        if (existingCart) {


                            const existingCartProduct: any = await CartService.findCartProduct({
                                $and: [
                                    { cartId: existingCart._id },
                                    { variantId: productVariantData._id }
                                ]
                            });


                            if (existingCart.totalProductAmount && existingCartProduct && existingCartProduct.quantity) {
                                totalAmountOfProduct = (productVariantData.price * existingCartProduct.quantity)
                                totalDiscountAmountOfProduct = (productVariantData.discountPrice * existingCartProduct.quantity)
                            } else {
                                totalAmountOfProduct = productVariantData?.price * quantity
                                totalDiscountAmountOfProduct = productVariantData.discountPrice * quantity

                            }

                            if (quantity == 1) {

                                quantityProduct = existingCartProduct ? existingCartProduct?.quantity + 1 : quantity

                            } else if (quantity > 1) {
                                quantityProduct = quantity
                            } else if (quantity == 0) {
                                if (existingCartProduct) {

                                    const deletedData = await CartService.destroyCartProduct(existingCartProduct._id);
                                    if (deletedData) {
                                        totalAmountOfProduct = totalAmountOfProduct - (productVariantData?.price * existingCartProduct?.quantity)
                                        totalDiscountAmountOfProduct = totalDiscountAmountOfProduct - (productVariantData.discountPrice * existingCartProduct?.quantity)
                                        const cartUpdate = await CartService.update(existingCartProduct.cartId, { _id: existingCartProduct.cartId, hostName: req.get('origin') })


                                        const cart = await CartService.findCartPopulate({ query: { _id: existingCartProduct.cartId }, hostName: req.get('origin') })

                                        return controller.sendSuccessResponse(res, {
                                            requestedData: {
                                                ...cart
                                            },
                                            message: 'Product removed successfully!'
                                        });


                                    } else {
                                        return controller.sendErrorResponse(res, 500, {
                                            message: 'Somethng went wrong on Product removed!'
                                        });
                                    }
                                } else {
                                    return controller.sendErrorResponse(res, 500, {
                                        message: 'Something went wrong: the product is not in the cart.'
                                    });


                                }
                            }
                        }
                        if (productVariantData && productVariantData.cartMinQuantity || productVariantData.cartMaxQuantity) {
                            if (Number(productVariantData.cartMinQuantity) >= quantityProduct ? 0 : quantity || Number(productVariantData.cartMaxQuantity) <= quantityProduct ? 0 : quantity) {

                                return controller.sendErrorResponse(res, 200, {
                                    message: 'Validation error',
                                    validation: "Cart minimum quantity is " + productVariantData.cartMinQuantity + " and Cart maximum quantity " + productVariantData.cartMaxQuantity
                                });
                            }
                        }


                        const shippingAmount: any = await WebsiteSetupModel.findOne({ blockReference: blockReferences.shipmentSettings })
                        // const codAmount: any = await WebsiteSetupModel.findOne({ blockReference: blockReferences.defualtSettings })
                        // console.log(productVariantData, "........1234d.....", codAmount);

                        const cartOrderData = {
                            customerId: customer,
                            guestUserId: guestUser,
                            countryId: country,
                            cartStatus: '1',
                            orderStatus: '0',
                            shippingStatus,
                            shipmentGatwayId,
                            paymentGatwayId,
                            pickupStoreId,
                            orderComments,
                            paymentMethod,
                            paymentMethodCharge,
                            rewardPoints,
                            totalProductAmount: totalAmountOfProduct,
                            totalReturnedProduct,
                            totalDiscountAmount: totalDiscountAmountOfProduct,
                            totalShippingAmount: Number(shippingAmount.blockValues.shippingCharge),
                            totalCouponAmount,
                            totalWalletAmount,
                            codAmount,
                            // codAmount: Number(codAmount.blockValues.codCharge),
                            totalTaxAmount,
                            totalAmount: totalAmountOfProduct + Number(shippingAmount.blockValues.shippingCharge),
                        };

                        if (existingCart) {
                            newCartOrder = await cartService.update(existingCart._id, cartOrderData);
                            if (newCartOrder) {

                                const existingProduct: any = await CartService.findCartProduct({

                                    $and: [
                                        { cartId: newCartOrder._id },
                                        { variantId: productVariantData._id }
                                    ]
                                });

                                const cartOrderProductData = {
                                    cartId: newCartOrder._id,
                                    customerId: customer,
                                    variantId: productVariantData._id,
                                    productId: productVariantData.productId,
                                    quantity: quantityProduct,
                                    slug: productVariantData.slug,
                                    orderStatus,
                                    createdAt: new Date(),
                                    updatedAt: new Date()
                                };

                                if (existingProduct) {

                                    newCartOrderProduct = await CartService.updateCartProduct(existingProduct._id, cartOrderProductData);

                                } else {

                                    newCartOrderProduct = await CartService.createCartProduct(cartOrderProductData);

                                }
                            }
                        } else {
                            newCartOrder = await cartService.create(cartOrderData);

                            if (newCartOrder) {


                                const cartOrderProductData = {
                                    cartId: newCartOrder._id,
                                    customerId: customer,
                                    variantId: productVariantData._id,
                                    productId: productVariantData.productId,
                                    quantity: quantityProduct ? 0 : quantity,
                                    slug: productVariantData.slug,
                                    orderStatus,
                                    createdAt: new Date(),
                                    updatedAt: new Date()
                                };

                                newCartOrderProduct = await CartService.createCartProduct(cartOrderProductData);


                            }
                        }


                        if (newCartOrder) {
                            const products = await CartService.findCartPopulate({
                                query: { _id: newCartOrder._id }, hostName: req.get('origin'),
                            })


                            return controller.sendSuccessResponse(res, {
                                requestedData: {
                                    ...products
                                },
                                message: 'Cart order created successfully!'
                            }, 200);
                        }
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Error',
                            validation: 'Something went wrong! Cart order could not be inserted. Please try again'
                        });
                    }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                });
            }
        } catch (error: any) {
            console.log("*********errorr", error);

            return controller.sendErrorResponse(res, 200, {
                message: error.message || 'Some error occurred while creating cart order',
            });
        }
    }


    async addToWishlist(req: Request, res: Response): Promise<void> {
        try {
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                const validatedData = addToWishlistSchema.safeParse(req.body);
                if (validatedData.success) {
                    const { slug, sku } = validatedData.data;
                    const productVariantData = await ProductVariantsModel.findOne({
                        countryId,
                        variantSku: sku,
                        slug
                    });
                    const user = res.locals.user;

                    if (productVariantData) {
                        const whishlistData = await CustomerWishlistCountryService.findOne({
                            userId: user._id,
                            countryId,
                        });
                        if (whishlistData) {
                            const deletedDataFromCart = await CartService.destroyCartProduct(productVariantData._id)
                            if (deletedDataFromCart) {
                                return controller.sendSuccessResponse(res, {
                                    requestedData: {},
                                    message: 'Product removed successfully!'
                                });
                            } else {
                                return controller.sendErrorResponse(res, 500, {
                                    message: 'Somethng went wrong on product removed!'
                                });
                            }
                        } else {
                            const whishlistInsertData = {
                                countryId,
                                userId: user._id,
                                productId: productVariantData.productId,
                                variantId: productVariantData._id,
                                slug: productVariantData.slug,
                                variantSku: productVariantData.variantSku
                            }
                            const insertData = await CustomerWishlistCountryService.create(whishlistInsertData);
                            if (insertData) {
                                const deletedDataFromCart = await CartService.destroyCartProduct(productVariantData._id)

                                return controller.sendSuccessResponse(res, {
                                    requestedData: insertData,
                                    message: 'Wishlist added successfully!'
                                });
                            } else {
                                return controller.sendErrorResponse(res, 500, {
                                    message: 'Somethng went wrong on wishlist add!'
                                });
                            }
                        }
                    } else {
                        return controller.sendErrorResponse(res, 500, {
                            message: 'Product not found!'
                        });
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: formatZodError(validatedData.error.errors)
                    });
                }

            } else {
                return controller.sendErrorResponse(res, 500, {
                    message: 'Country is missing'
                });
            }
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while add to wishlist'
            });
        }
    }

    async addGiftWrap(req: Request, res: Response): Promise<void> {
        try {
            const customer = res.locals.user;
            const guestUser = res.locals.uuid;
            let country = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
            const { variantId, slug } = req.body;

            const cart: any = await CartService.findCartPopulate({
                query: {
                    $or: [
                        { $and: [{ customerId: customer }, { countryId: country }] },
                        { $and: [{ guestUserId: guestUser }, { countryId: country }] }
                    ]
                },
                hostName: req.get('origin'),

            });

            const existingCartProduct: any = await CartService.findCartProduct({
                $or: [
                    { $and: [{ cartId: cart._id }, { variantId: variantId }] },
                    { $and: [{ cartId: cart._id }, { slug: slug }] }
                ]
            },);

            const giftWrapAmount: any = await WebsiteSetupModel.findOne({ blockReference: blockReferences.enableFeatures })
            var giftWrapCharge
            if (giftWrapAmount.blockValues.enableGiftWrap == true) {
                giftWrapCharge = Number(giftWrapAmount.blockValues.giftWrapCharge)
            }



            const updateCart = await CartService.updateCartProductByCart({
                $and: [
                    { cartId: cart._id },
                    { variantId: variantId }
                ]
            }, { giftWrapAmount: giftWrapCharge })

            const cartUpdate: any = await CartService.update(cart._id, { totalGiftWrapAmount: (cart.totalGiftWrapAmount + giftWrapCharge), totalAmount: (cart.totalAmount + giftWrapCharge) });

            return controller.sendSuccessResponse(res, {
                requestedData: cart,
                message: 'gift wrap added successfully!'
            });

        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while add to gift wrap'
            });
        }
    }

    async findUserCart(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 20, sortby = '', sortorder = '' } = req.query as QueryParams;
            const customer = res.locals.user;
            const guestUser = res.locals.uuid;
            let country = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
            // let query = {
            //     $or: [
            //         { $and: [{ customerId: customer }, { countryId: country }] },
            //         { $and: [{ guestUserId: guestUser }, { countryId: country }] }
            //     ]
            // }

            let query: any = { _id: { $exists: true } };
            const userData = await res.locals.user;

            // query.status = '1';
            query.customerId = userData._id;

            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const cart: any = await CartService.findCartPopulate({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                hostName: req.get('origin'),
                sort
            });

            return controller.sendSuccessResponse(res, {
                requestedData: cart,
                message: 'Your cart is ready!'
            });
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while get cart'
            });
        }
    }

    async addCoupon(req: Request, res: Response): Promise<void> {

    }

    async addWalletPoint(req: Request, res: Response): Promise<void> {

    }

}

export default new CartController();