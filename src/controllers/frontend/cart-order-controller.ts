import 'module-alias/register';
import mongoose from 'mongoose';
import { Request, Response, } from 'express';

import { formatZodError } from '../../utils/helpers';
import { cartProductSchema, cartSchema } from '../../utils/schemas/frontend/guest/cart-schema';
import { offerTypes, } from '../../constants/offers';

import BaseController from '../admin/base-controller';
import { addToWishlistSchema } from '../../utils/schemas/frontend/auth/wishlist-schema';
import { blockReferences } from '../../constants/website-setup';
import { QueryParams } from '../../utils/types/common';

import CommonService from '../../services/frontend/guest/common-service'
import ProductService from '../../services/frontend/guest/product-service';
import CartService from '../../services/frontend/cart-service'
import CustomerWishlistCountryService from '../../services/frontend/auth/customer-wishlist-servicel'
import ProductVariantsModel from '../../model/admin/ecommerce/product/product-variants-model';
import CartOrderProductsModel from '../../model/frontend/cart-order-product-model';
import WebsiteSetupModel from '../../model/admin/setup/website-setup-model';
import TaxsModel from '../../model/admin/setup/tax-model';
import CartOrdersModel from '../../model/frontend/cart-order-model';
import CustomerModel from '../../model/frontend/customers-model';

const controller = new BaseController();

class CartController extends BaseController {


    async createCartOrder(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = cartSchema.safeParse(req.body);
            const customer = res.locals.user;
            const guestUser = res.locals.uuid;

            if (validatedData.success) {
                const { variantId, quantity, slug, orderStatus, quantityChange } = req.body;

                let country = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
                if (!country) {
                    return controller.sendErrorResponse(res, 500, { message: 'Country is missing' });
                }
                let newCartOrder;
                let newCartOrderProduct: any;

                let totalAmountOfProduct = 0;
                let totalDiscountAmountOfProduct = 0;
                let quantityProduct = 1;
                let totalProductOriginalPrice = 0
                let totalGiftWrapAmount = 0
                let query: any = {}

                if (variantId) {
                    query = {
                        ...query,
                        'productVariants._id': new mongoose.Types.ObjectId(variantId),
                    }
                } else {
                    query = {
                        ...query,
                        'productVariants.slug': slug,
                    }
                }

                const productVariant: any = await ProductService.findProductList({
                    countryId: country,
                    query,
                    hostName: req.get('origin'),
                });

                if (productVariant && productVariant.length === 0) {
                    return controller.sendErrorResponse(res, 200, { message: 'Product not found!' });
                }

                if (productVariant[0].productVariants && productVariant[0].productVariants.length === 0) {
                    return controller.sendErrorResponse(res, 200, { message: 'Product details are not found!' });
                }
                const productVariantData = productVariant[0].productVariants[0]

                if (productVariantData && productVariantData.quantity <= 0 && quantity != 0) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: "Item Out of stock"
                    });

                }
                if (customer || guestUser) {
                    var existingCart: any

                    if (customer) {
                        existingCart = await CartService.findCart({
                            $and: [
                                { customerId: customer },
                                { countryId: country },
                                { cartStatus: '1' }
                            ]
                        });
                        if (existingCart) {
                            const existingCustomer = await CustomerModel.findOne({ _id: customer });
                            console.log('existingCustomer', existingCart);

                            // if (existingCustomer && existingCustomer.isGuest !== existingCart.isGuest) {
                            //     await CartOrdersModel.findOneAndDelete({ _id: existingCart._id });
                            //     await CartOrderProductsModel.deleteMany({ cartId: existingCart._id });
                            //     existingCart=null
                            // }
                        }
                    } else {
                        existingCart = await CartService.findCart({
                            $and: [
                                { guestUserId: guestUser },
                                { countryId: country },
                                { cartStatus: '1' }
                            ]
                        });
                    }

                    const offerProduct = productVariant[0].offer
                    let offerAmount = 0
                    let singleProductTotal = 0
                    let singleProductOriginalTotal = 0
                    let singleProductDiscountTotal = 0;

                    if (offerProduct) {
                        // for (let i = 0; i < offerProduct[0].productVariants.length; i++) {
                        if (offerProduct && offerProduct.offerType) {
                            // if (productVariantData._id.toString() === offerProduct[0].productVariants[i]._id.toString()) {
                            if (offerProduct.offerType == offerTypes.percent) {
                                offerAmount = productVariantData.discountPrice > 0 ? (productVariantData.discountPrice * (offerProduct.offerIN / 100)) : (productVariantData.price * (offerProduct.offerIN / 100));
                            }
                            if (offerProduct.offerType == offerTypes.amountOff) {
                                offerAmount = offerProduct.offerIN
                            }
                        }
                        // }
                        // }
                    }

                    var cartOrderData
                    const shippingAmount: any = await WebsiteSetupModel.findOne({ blockReference: blockReferences.shipmentSettings, countryId: country })

                    const shippingCharge = (shippingAmount ? Number(shippingAmount.blockValues.shippingCharge) : 0);
                    const tax: any = await TaxsModel.findOne({ countryId: country })

                    if (existingCart) {
                        const existingCartProduct: any = await CartService.findCartProduct({
                            $and: [
                                { cartId: existingCart._id },
                                { variantId: productVariantData._id }
                            ]
                        });
                        if (!existingCartProduct) {
                            quantityProduct = quantity
                            totalDiscountAmountOfProduct = existingCart.totalDiscountAmount + offerAmount ? (offerAmount * quantity) : (productVariantData.price - productVariantData.discountPrice) * quantity
                            totalAmountOfProduct = existingCart.totalProductAmount + (totalDiscountAmountOfProduct > 0 ? ((productVariantData.price - totalDiscountAmountOfProduct) * quantity) : (productVariantData?.price * quantity))
                        }

                        if (quantity != 0 && quantityChange == true && existingCartProduct) {
                            quantityProduct = quantity
                        } else if (quantity != 0 && quantityChange == true) {
                            quantityProduct = quantity
                        }
                        else if (quantity == 1) {
                            quantityProduct = existingCartProduct ? existingCartProduct?.quantity + 1 : quantity
                        } else if (quantity > 1) {
                            quantityProduct = quantity
                        } else if (quantity == 0) {
                            if (existingCartProduct) {
                                const deletedData = await CartService.destroyCartProduct(existingCartProduct._id);
                                if (deletedData) {
                                    totalDiscountAmountOfProduct = existingCart?.totalDiscountAmount - existingCartProduct.productDiscountAmount
                                    totalProductOriginalPrice = existingCart?.totalProductOriginalPrice - existingCartProduct.productOriginalPrice
                                    totalAmountOfProduct = existingCart?.totalProductAmount - existingCartProduct.productAmount
                                    const giftWrapAmount: any = await WebsiteSetupModel.findOne({ blockReference: blockReferences.enableFeatures })
                                    var giftWrapCharge: any
                                    if (giftWrapAmount && giftWrapAmount.blockValues && giftWrapAmount.blockValues.enableGiftWrap && giftWrapAmount.blockValues.enableGiftWrap == true) {
                                        giftWrapCharge = Number(giftWrapAmount.blockValues.giftWrapCharge)
                                    }
                                    const removeGiftWrapAmount = existingCartProduct.giftWrapAmount
                                    const finalShippingCharge = shippingCharge > 0 ? ((totalAmountOfProduct) - (Number(shippingAmount.blockValues.freeShippingThreshold)) > 0 ? 0 : shippingCharge) : 0

                                    const cartUpdate = await CartService.update(existingCartProduct.cartId, {
                                        totalProductAmount: totalAmountOfProduct,
                                        totalProductOriginalPrice: totalProductOriginalPrice,
                                        totalDiscountAmount: totalDiscountAmountOfProduct,
                                        totalShippingAmount: finalShippingCharge,
                                        totalGiftWrapAmount: existingCart.totalGiftWrapAmount - removeGiftWrapAmount,
                                        totalAmount: (totalAmountOfProduct + (existingCart.totalGiftWrapAmount - removeGiftWrapAmount)) + finalShippingCharge,
                                    });

                                    const checkCartProducts = await CartService.findAllCart({ cartId: existingCartProduct.cartId })
                                    if (checkCartProducts && checkCartProducts.length == 0) {
                                        const deletedData = await CartService.destroy(existingCartProduct.cartId);

                                    }

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
                                return controller.sendErrorResponse(res, 200, {
                                    message: 'Something went wrong: the product is not in the cart.'
                                });


                            }
                        }

                        if (productVariantData && productVariantData.quantity < quantityProduct) {
                            return controller.sendErrorResponse(res, 200, {
                                message: 'Validation error',
                                validation: "The quantity of the product exceeds the available stock."
                            });

                        }

                        if (productVariantData && productVariantData.cartMinQuantity || productVariantData.cartMaxQuantity) {
                            if (Number(productVariantData.cartMinQuantity) >= quantityProduct || Number(productVariantData.cartMaxQuantity) < quantityProduct) {
                                return controller.sendErrorResponse(res, 200, {
                                    message: 'Validation error',
                                    validation: "Cart minimum quantity is " + productVariantData.cartMinQuantity + " and Cart maximum quantity " + productVariantData.cartMaxQuantity
                                });
                            }
                        }
                        // }
                        singleProductTotal = offerAmount > 0 ? ((productVariantData.discountPrice > 0) ? (productVariantData.discountPrice - offerAmount) : (productVariantData.price - offerAmount)) : (productVariantData.discountPrice ? productVariantData.discountPrice : productVariantData.price)
                        singleProductTotal *= quantityProduct
                        singleProductOriginalTotal = quantityProduct * productVariantData.price
                        singleProductDiscountTotal = (productVariantData.price * quantityProduct) - singleProductTotal
                        let giftWrapcharge = 0
                        if (!existingCartProduct) {
                            totalDiscountAmountOfProduct = existingCart.totalDiscountAmount + singleProductDiscountTotal
                            totalAmountOfProduct = existingCart.totalProductAmount + singleProductTotal
                            totalProductOriginalPrice = existingCart.totalProductOriginalPrice + singleProductOriginalTotal
                            totalGiftWrapAmount = existingCart.totalGiftWrapAmount

                        } else {
                            totalDiscountAmountOfProduct = existingCart.totalDiscountAmount - (existingCartProduct.productDiscountAmount) + singleProductDiscountTotal
                            totalAmountOfProduct = existingCart.totalProductAmount - (existingCartProduct.productAmount) + singleProductTotal
                            totalGiftWrapAmount = existingCart.totalGiftWrapAmount > 0 ? existingCart.totalGiftWrapAmount : 0
                            totalProductOriginalPrice = existingCart.totalProductOriginalPrice - (existingCartProduct.productOriginalPrice) + singleProductOriginalTotal
                        }
                        const finalShippingCharge = shippingCharge > 0 ? ((totalAmountOfProduct) - (Number(shippingAmount.blockValues.freeShippingThreshold)) > 0 ? 0 : shippingCharge) : 0

                        // const codAmount: any = await WebsiteSetupModel.findOne({ blockReference: blockReferences.defualtSettings })
                        cartOrderData = {
                            customerId: customer,
                            guestUserId: guestUser,
                            countryId: country,
                            cartStatus: '1',
                            orderStatus: '0',
                            totalProductOriginalPrice: totalProductOriginalPrice,
                            totalProductAmount: totalAmountOfProduct,
                            totalDiscountAmount: totalDiscountAmountOfProduct,
                            totalShippingAmount: finalShippingCharge,
                            totalGiftWrapAmount: totalGiftWrapAmount,
                            totalTaxAmount: tax ? ((tax.taxPercentage / 100) * totalAmountOfProduct).toFixed(2) : 0,
                            totalAmount: totalAmountOfProduct + finalShippingCharge + totalGiftWrapAmount,
                            isGuest: customer ? false : true
                        };


                        newCartOrder = await CartService.update(existingCart._id, cartOrderData);
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
                                productAmount: singleProductTotal,
                                productOriginalPrice: singleProductOriginalTotal,
                                productDiscountAmount: singleProductDiscountTotal,
                                slug: productVariantData.slug,
                                orderStatus,
                                createdAt: new Date(),
                                updatedAt: new Date()
                            };

                            if (existingProduct) {
                                // if (quantityChange == true) {
                                //     cartOrderProductData.productAmount = singleProductTotal
                                // } else {
                                //     cartOrderProductData.productAmount = existingProduct.productAmount > 0 ? (existingProduct.productAmount + singleProductTotal) : singleProductTotal
                                // }
                                // console.log("*********************", cartOrderProductData);

                                newCartOrderProduct = await CartService.updateCartProduct(existingProduct._id, cartOrderProductData);

                            } else {
                                // console.log("********dffdfdf*************", cartOrderProductData);

                                newCartOrderProduct = await CartService.createCartProduct(cartOrderProductData);

                            }
                        }
                    } else {

                        singleProductTotal = offerAmount > 0 ? ((productVariantData.discountPrice > 0) ? (productVariantData.discountPrice - offerAmount) : (productVariantData.price - offerAmount)) : (productVariantData.discountPrice ? productVariantData.discountPrice : productVariantData.price)
                        singleProductTotal *= quantityProduct
                        singleProductDiscountTotal = (productVariantData.price * quantityProduct) - singleProductTotal
                        singleProductOriginalTotal = productVariantData.price * quantityProduct

                        totalDiscountAmountOfProduct = singleProductDiscountTotal
                        totalAmountOfProduct = singleProductTotal
                        totalProductOriginalPrice = singleProductOriginalTotal
                        const finalShippingCharge = shippingCharge > 0 ? ((totalAmountOfProduct) - (Number(shippingAmount.blockValues.freeShippingThreshold)) > 0 ? 0 : shippingCharge) : 0

                        cartOrderData = {
                            customerId: customer,
                            guestUserId: guestUser,
                            countryId: country,
                            cartStatus: '1',
                            orderStatus: '0',
                            totalProductOriginalPrice: totalProductOriginalPrice,
                            totalProductAmount: totalAmountOfProduct,
                            totalDiscountAmount: totalDiscountAmountOfProduct,
                            totalShippingAmount: finalShippingCharge,

                            // codAmount: Number(codAmount.blockValues.codCharge),
                            totalTaxAmount: tax ? ((tax.taxPercentage / 100) * totalAmountOfProduct).toFixed(2) : 0,
                            totalAmount: totalAmountOfProduct + finalShippingCharge,
                            isGuest: customer ? false : true
                        };

                        newCartOrder = await CartService.create(cartOrderData);

                        if (newCartOrder) {

                            const cartOrderProductData = {
                                cartId: newCartOrder._id,
                                customerId: customer,
                                variantId: productVariantData._id,
                                productId: productVariantData.productId,
                                productDiscountAmount: singleProductDiscountTotal,
                                quantity: quantityProduct,
                                productOriginalPrice: singleProductOriginalTotal,
                                productAmount: singleProductTotal,
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
                            message: 'Cart updated successfully!'
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
            // console.log("*********errorr", error);

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
                $and: [
                    {
                        $or: [
                            { _id: variantId },
                            { slug: slug }
                        ]
                    }, { countryId: country }]
            });

            if (!productVariantData) {
                return controller.sendErrorResponse(res, 500, { message: 'Product not found!' });
            }
            var cart: any
            if (customer && !guestUser) {
                cart = await CartOrdersModel.findOne({
                    customerId: customer,
                    cartStatus: "1",
                    countryId: country
                });
            } else if (guestUser) {
                cart = await CartOrdersModel.findOne({
                    guestUserId: guestUser,
                    cartStatus: "1",
                    countryId: country
                });
            }

            if (cart) {
                const existingCartProduct: any = await CartService.findCartProduct({
                    $or: [
                        { $and: [{ cartId: cart._id }, { variantId: variantId }] },
                        { $and: [{ cartId: cart._id }, { slug: slug }] }
                    ]
                },);

                if (existingCartProduct) {
                    const giftWrapAmount: any = await WebsiteSetupModel.findOne({ blockReference: blockReferences.enableFeatures })
                    if (giftWrapAmount) {
                        var giftWrapCharge: any
                        if (giftWrapAmount.blockValues.enableGiftWrap == true) {
                            giftWrapCharge = Number(giftWrapAmount.blockValues.giftWrapCharge)
                        } else {
                            return controller.sendErrorResponse(res, 500, {
                                message: 'Giftwrap option is currently unavailable'
                            });
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
                            console.log(cartUpdate);

                        }

                        var resultCart: any
                        if (customer) {
                            resultCart = await CartService.findCartPopulate({
                                query: {
                                    customerId: customer, countryId: country, cartStatus: "1"
                                },
                                hostName: req.get('origin')
                            });
                        } else {
                            resultCart = await CartService.findCartPopulate({
                                query: {
                                    guestUserId: guestUser, countryId: country, cartStatus: "1"
                                },
                                hostName: req.get('origin')
                            });
                        }



                        return controller.sendSuccessResponse(res, {
                            requestedData: resultCart,
                            message: 'gift wrap added successfully!'
                        });
                    } else {
                        return controller.sendErrorResponse(res, 500, {
                            message: 'Giftwrap option is currently unavailable'
                        });
                    }

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
            if (!country) {
                return controller.sendErrorResponse(res, 500, { message: 'Country is missing' });
            }
            let query

            if (guestUser && customer) {
                const guestUserCart: any = await CartService.findCart({
                    $and: [
                        { guestUserId: guestUser },
                        { countryId: country },
                        { customerId: null },
                        { cartStatus: '1' }
                    ]
                });
                const customerCart: any = await CartService.findCart({
                    $and: [
                        { customerId: customer },
                        { countryId: country },
                        { cartStatus: '1' }
                    ]
                });
                if (guestUserCart || customerCart) {
                    const cartProduct: any = await CartOrderProductsModel.aggregate([
                        {
                            $match: {
                                $or: [
                                    { cartId: guestUserCart?._id },
                                    { cartId: customerCart?._id }
                                ]
                            }
                        },
                        {
                            $group: {
                                _id: "$_id",
                                cartId: { $first: "$cartId" },
                                slug: { $first: "$slug" },
                                quantity: { $sum: "$quantity" },
                                productOriginalPrice: { $sum: "$productOriginalPrice" },
                                productAmount: { $sum: "$productAmount" },
                                productDiscountAmount: { $sum: "$productDiscountAmount" },
                                productCouponAmount: { $first: "$productCouponAmount" },
                                giftWrapAmount: { $first: "$giftWrapAmount" },
                                productId: { $first: "$productId" },
                                orderStatus: { $first: "$orderStatus" },
                                createdAt: { $first: "$createdAt" },
                                updatedAt: { $first: "$updatedAt" },
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                cartId: 1,
                                slug: 1,
                                quantity: 1,
                                productAmount: 1,
                                productDiscountAmount: 1,
                                productCouponAmount: 1,
                                productOriginalPrice: 1,
                                giftWrapAmount: 1,
                                variantId: "$_id",
                                productId: 1,
                                orderStatus: 1,
                                createdAt: 1,
                                updatedAt: 1,
                            }
                        }
                    ]);

                    const update = await CartService.updateCartProduct(cartProduct._id, {
                        quantity: cartProduct.quantity,
                        productAmount: cartProduct.productAmount,
                        productDiscountAmount: cartProduct.productDiscountAmount,
                    })
                }

                if (guestUserCart) {
                    const update = await CartService.update(guestUserCart._id, { customerId: customer, guestUserId: null, isGuest: customer ? false : true });
                    if(update){
                       await CartOrdersModel.deleteMany({ cartId: guestUserCart._id })
                    }
                }

                const cartProductsaggregation: any = await CartOrdersModel.aggregate([
                    { $match: { cartId: customerCart?._id } },
                    { $unwind: "$products" }, // Unwind the array field named "products"
                    {
                        $group: {
                            _id: "$_id",
                            totalProductAmount: { $sum: "$products.productAmount" },
                            totalProductOriginalPrice: { $sum: "$products.totalProductOriginalPrice" },
                            totalGiftWrapAmount: { $sum: "$products.totalGiftWrapAmount" },
                            totalDiscountAmount: { $sum: "$products.productDiscountAmount" },
                            totalAmount: { $sum: { $add: ["$products.productDiscountAmount", "$products.totalGiftWrapAmount", "$products.productAmount"] } }
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            totalProductOriginalPrice: 1,
                            totalProductAmount: 1,
                            totalGiftWrapAmount: 1,
                            totalDiscountAmount: 1,
                            totalAmount: 1
                        }
                    }
                ]);

                const updateCart = await CartService.update(customerCart?._id,
                    {
                        totalProductOriginalPrice: cartProductsaggregation.totalProductOriginalPrice,
                        totalProductAmount: cartProductsaggregation.totalProductAmount,
                        totalGiftWrapAmount: cartProductsaggregation.totalGiftWrapAmount,
                        totalDiscountAmount: cartProductsaggregation.totalDiscountAmount,
                        totalAmount: cartProductsaggregation.totalAmount,
                        guestUserId: null,
                        customerId: customer,
                        isGuest: customer ? false : true
                    },
                )
           }

            if (guestUser && !customer) {
                query = { $and: [{ guestUserId: guestUser }, { countryId: country }, { cartStatus: '1' }] }
            }
            else {
                query = { $and: [{ customerId: customer }, { countryId: country }, { cartStatus: '1' }] }
            }


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
                return controller.sendErrorResponse(res, 200, {
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