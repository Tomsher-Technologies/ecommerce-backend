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

                let totalAmountOfProduct = 0
                let totalDiscountAmountOfProduct = 0
                let quantityProduct = 0
                const guestUserCart: any = await CartService.findCart(
                    {
                        $and: [
                            { guestUserId: guestUser },
                            { countryId: country },
                            { customerId: null },
                            { cartStatus: '1' }
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
                                { countryId: country },
                                { cartStatus: '1' }
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
                                    productAmount: item.productAmount * item.quantity,
                                    variantId: productVariantData._id,
                                    productId: productVariantData.productId,

                                };
                            } else {
                                // If variantId is already in the map, update the quantity
                                variantIdMap[variantId].quantity += item.quantity;
                                variantIdMap[variantId].totalProductAmount = variantIdMap[variantId].quantity * item.totalProductAmount;

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
                                        productAmount: data.productAmount * data.quantity,
                                        variantId: data.variantId,
                                        productId: data.productId
                                    })

                                if (updateCart) {
                                    console.log("updateCartupdateCart", updateCart);

                                    const deletedData = await CartService.destroy(guestUserCart._id);
                                    const updateData = await CartService.update(customerCart._id, { guestUserId: null });

                                    const deletedProductData = await CartService.destroyCartProduct1({ cartId: guestUserCart._id });

                                    const cart: any = await CartService.findCartPopulate({
                                        query: {
                                            $and: [
                                                { customerId: customer },
                                                { countryId: country },
                                                { cartStatus: "1" }
                                            ],

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
                        const existingCart: any = await CartService.findCart({
                            $or: [
                                { customerId: customer },
                                { guestUserId: guestUser }
                            ]
                        });



                        // totalProductAmount = 


                        totalAmountOfProduct = (productVariantData?.price * quantity)
                        totalDiscountAmountOfProduct = (((productVariantData?.discountPrice - productVariantData.discountPrice) / productVariantData?.discountPrice) * 100);
                        // console.log("totalDiscountAmountOfProducttotalDiscountAmountOfProduct", totalDiscountAmountOfProduct);

                        if (existingCart) {


                            const existingCartProduct: any = await CartService.findCartProduct({
                                $and: [
                                    { cartId: existingCart._id },
                                    { variantId: productVariantData._id }
                                ]
                            });


                            if (existingCart.totalProductAmount && existingCartProduct && existingCartProduct.quantity) {
                                totalAmountOfProduct = existingCart?.totalProductAmount + (productVariantData.price * existingCartProduct.quantity)
                                totalDiscountAmountOfProduct = existingCart?.totalDiscountAmount + (productVariantData.discountPrice * existingCartProduct.quantity)
                            } else {
                                totalAmountOfProduct = productVariantData?.price * quantity
                                totalDiscountAmountOfProduct = productVariantData.discountPrice * quantity

                            }

                            if (quantity == 1) {

                                quantityProduct = existingCartProduct ? existingCartProduct?.quantity + 1 : quantity
                                totalAmountOfProduct = totalAmountOfProduct + (productVariantData?.price * quantity)

                            } else if (quantity > 1) {
                                quantityProduct = quantity
                                totalAmountOfProduct = totalAmountOfProduct + (productVariantData?.price * quantity)

                            } else if (quantity == 0) {
                                if (existingCartProduct) {

                                    const deletedData = await CartService.destroyCartProduct(existingCartProduct._id);
                                    if (deletedData) {
                                        totalAmountOfProduct = totalAmountOfProduct - (productVariantData?.price * existingCartProduct?.quantity)
                                        totalDiscountAmountOfProduct = totalDiscountAmountOfProduct - (productVariantData.discountPrice * existingCartProduct?.quantity)
                                        const cartUpdate = await CartService.update(existingCartProduct.cartId, { totalProductAmount: totalAmountOfProduct })


                                        const cart = await CartService.findCartPopulate({ query: { _id: existingCartProduct.cartId, cartStatus: "1" }, hostName: req.get('origin') })

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
                        console.log("........1234d.....", shippingAmount);

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
                            totalShippingAmount: shippingAmount ? Number(shippingAmount.blockValues.shippingCharge) : 0,
                            totalCouponAmount,
                            totalWalletAmount,
                            codAmount,
                            // codAmount: Number(codAmount.blockValues.codCharge),
                            totalTaxAmount,
                            totalAmount: totalAmountOfProduct + (shippingAmount ? Number(shippingAmount.blockValues.shippingCharge) : 0) - totalDiscountAmountOfProduct,
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
                                    productAmount: quantityProduct * productVariantData.price,
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
                                    productAmount: quantity * productVariantData.price,
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
                                query: { _id: newCartOrder._id, cartStatus: "1" }, hostName: req.get('origin'),
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


    async moveToWishlist(req: Request, res: Response): Promise<void> {
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
                        const cart: any = await CartService.findCartPopulate({
                            query: {
                                $or: [
                                    { $and: [{ customerId: user }, { countryId: countryId }] },
                                ],
                                cartStatus: "1"
                            },
                            hostName: req.get('origin'),

                        });
                        if (cart) {

                            const whishlistData = await CustomerWishlistCountryService.findOne({
                                userId: user._id,
                                countryId,
                            });
                            if (whishlistData) {
                                return controller.sendSuccessResponse(res, {
                                    requestedData: {},
                                    message: 'Product added successfully!'
                                });
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
                                    const deletedDataFromCart: any = await CartService.destroyCartProduct(productVariantData._id)
                                    const cartUpdate: any = await CartService.update(cart._id, { totalProductAmount: (cart.totalProductAmount - (deletedDataFromCart.productAmount * deletedDataFromCart.quantity)), totalAmount: (cart.totalAmount - (deletedDataFromCart.productAmount * deletedDataFromCart.quantity)) });

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
                                message: 'Cart not found!'
                            });
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
            if (!country) {
                return controller.sendErrorResponse(res, 500, { message: 'Country is missing' });
            }
            const validatedData = cartProductSchema.safeParse(req.body);
            if (!validatedData.success) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                });
            }
            const { variantId, slug } = validatedData.data;

            const productVariantData = await ProductVariantsModel.findOne({
                countryId: country,
                $or: [
                    { _id: variantId },
                    { slug: slug }
                ]
            });

            if (!productVariantData) {
                return controller.sendErrorResponse(res, 500, { message: 'Product not found!' });
            }

            const cart: any = await CartService.findCartPopulate({
                query: {
                    $or: [
                        { $and: [{ customerId: customer }, { countryId: country }] },
                        { $and: [{ guestUserId: guestUser }, { countryId: country }] },
                    ],
                    cartStatus: "1"
                },
                hostName: req.get('origin'),

            });

            if (cart) {
                const existingCartProduct: any = await CartService.findCartProduct({
                    $or: [
                        { $and: [{ cartId: cart._id }, { variantId: variantId }] },
                        { $and: [{ cartId: cart._id }, { slug: slug }] }
                    ]
                },);

                if (existingCartProduct) {
                    const giftWrapAmount: any = await WebsiteSetupModel.findOne({ blockReference: blockReferences.enableFeatures })
                    var giftWrapCharge: any
                    if (giftWrapAmount.blockValues.enableGiftWrap == true) {
                        giftWrapCharge = Number(giftWrapAmount.blockValues.giftWrapCharge)
                    }

                    if (existingCartProduct.giftWrapAmount != 0) {
                        await CartService.updateCartProductByCart(
                            existingCartProduct._id,
                            { giftWrapAmount: 0 })

                        const cartUpdate: any = await CartService.update(cart._id, { totalGiftWrapAmount: (cart.totalGiftWrapAmount - giftWrapCharge), totalAmount: (cart.totalAmount - giftWrapCharge) });

                    } else {

                        const updateCart = await CartService.updateCartProductByCart(
                            existingCartProduct._id
                            , { giftWrapAmount: giftWrapCharge })

                        const cartUpdate: any = await CartService.update(cart._id, { totalGiftWrapAmount: (cart.totalGiftWrapAmount + giftWrapCharge), totalAmount: (cart.totalAmount + giftWrapCharge) });
                    }

                    const resultCart: any = await CartService.findCartPopulate({
                        query: {
                            $or: [
                                { $and: [{ customerId: customer }, { countryId: country }] },
                                { $and: [{ guestUserId: guestUser }, { countryId: country }] },
                            ],
                            cartStatus: "1"
                        },
                        hostName: req.get('origin'),

                    });
                    return controller.sendSuccessResponse(res, {
                        requestedData: resultCart,
                        message: 'gift wrap added successfully!'
                    });


                } else {
                    return controller.sendErrorResponse(res, 500, {
                        message: 'Cart Product not found!'
                    });
                }
            } else {
                return controller.sendErrorResponse(res, 500, {
                    message: 'Cart not found!'
                });
            }
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
            let query = {
                $or: [
                    { $and: [{ customerId: customer }, { countryId: country }] },
                    { $and: [{ guestUserId: guestUser }, { countryId: country }] }
                ],
                cartStatus: '1'
            }

            // let query: any = { _id: { $exists: true }, cartStatus: "1" };
            // const userData = await res.locals.user;

            // query.cartStatus = '1';
            // query.customerId = userData._id;

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
            if (cart) {
                return controller.sendSuccessResponse(res, {
                    requestedData: cart,
                    message: 'Your cart is ready!'
                });
            } else {
                return controller.sendErrorResponse(res, 500, {
                    message: 'Active cart not fount'
                });
            }


        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while get cart'
            });
        }
    }


    async addWalletPoint(req: Request, res: Response): Promise<void> {

    }

}

export default new CartController();