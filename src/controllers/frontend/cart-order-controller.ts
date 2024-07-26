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
import { cartOrderGroupSumAggregate, cartOrderProductsGroupSumAggregate } from '../../utils/config/cart-order-config';

import CommonService from '../../services/frontend/guest/common-service'
import ProductService from '../../services/frontend/guest/product-service';
import CartService from '../../services/frontend/cart-service'
import CustomerWishlistService from '../../services/frontend/auth/customer-wishlist-servicel'
import ProductVariantsModel from '../../model/admin/ecommerce/product/product-variants-model';
import CartOrderProductsModel from '../../model/frontend/cart-order-product-model';
import WebsiteSetupModel from '../../model/admin/setup/website-setup-model';
import TaxsModel from '../../model/admin/setup/tax-model';
import CartOrdersModel from '../../model/frontend/cart-order-model';

const controller = new BaseController();

class CartController extends BaseController {

    async findUserCart(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 20, sortby = '', sortorder = '' } = req.query as QueryParams;
            let country = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
            if (!country) {
                return controller.sendErrorResponse(res, 500, { message: 'Country is missing' });
            }
            const customer = res.locals.user;
            const guestUser = res.locals.uuid;
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
                        { cartStatus: '1' },
                        { isGuest: false }
                    ]
                });
                if (guestUserCart) {
                    let isMergeCart = true;
                    if (!customerCart) {
                        await CartOrdersModel.findOneAndUpdate(guestUserCart?._id, {
                            customerId: new mongoose.Types.ObjectId(customer),
                            guestUserId: null,
                            isGuest: false
                        });
                        isMergeCart = false;
                    }
                    if (isMergeCart) {
                        const cartProductDetails: any = await CartOrderProductsModel.aggregate(cartOrderProductsGroupSumAggregate(customerCart?._id, guestUserCart?._id));
                        if (cartProductDetails && cartProductDetails.length > 0) {
                            const bulkOps = cartProductDetails.flatMap((detail: any) => [
                                {
                                    updateOne: {
                                        filter: {
                                            variantId: detail.variantId,
                                            cartId: detail.cartId
                                        },
                                        update: {
                                            $set: {
                                                quantity: detail.quantity,
                                                productAmount: detail.productAmount,
                                                productDiscountAmount: detail.productDiscountAmount,
                                                productOriginalPrice: detail.productOriginalPrice,
                                                productCouponAmount: detail.productCouponAmount,
                                                giftWrapAmount: detail.giftWrapAmount
                                            }
                                        },
                                        upsert: true
                                    }
                                },
                                {
                                    deleteMany: {
                                        filter: {
                                            cartId: guestUserCart?._id,
                                            variantId: detail.variantId
                                        }
                                    }
                                }
                            ]);
                            
                            const updateCartProduct = await CartOrderProductsModel.bulkWrite(bulkOps);
                            if (updateCartProduct) {
                                const cartMergeDetails: any = await CartOrdersModel.aggregate(cartOrderGroupSumAggregate(customerCart?._id, guestUserCart?._id));
                                if (cartMergeDetails.length > 0) {
                                    const bulkOps = [];
                                    const mergedData = cartMergeDetails[0];
                                    bulkOps.push({
                                        updateOne: {
                                            filter: { _id: customerCart?._id },
                                            update: {
                                                $set: {
                                                    totalProductOriginalPrice: mergedData.totalProductOriginalPrice,
                                                    totalProductAmount: mergedData.totalProductAmount,
                                                    totalGiftWrapAmount: mergedData.totalGiftWrapAmount,
                                                    totalDiscountAmount: mergedData.totalDiscountAmount,
                                                    totalAmount: mergedData.totalAmount
                                                }
                                            },
                                            upsert: true
                                        }
                                    });
                                    if (bulkOps.length > 0) {
                                        await CartOrdersModel.bulkWrite(bulkOps);
                                        const deleteGuestCart = await CartOrdersModel.findOneAndDelete(guestUserCart._id);
                                        if (deleteGuestCart) {
                                            await CartOrderProductsModel.deleteMany({ cartId: guestUserCart._id })
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            let query;
            if (!customer && guestUser) {
                query = { $and: [{ guestUserId: guestUser }, { countryId: country }, { cartStatus: '1' }] }
            } else {
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

    async createCartOrder(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = cartSchema.safeParse(req.body);
            if (validatedData.success) {
                let country = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
                if (!country) {
                    return controller.sendErrorResponse(res, 500, { message: 'Country is missing' });
                }
                const { variantId, quantity, slug, orderStatus, quantityChange } = req.body;

                let newCartOrder;
                let totalAmountOfProduct = 0;
                let totalDiscountAmountOfProduct = 0;
                let quantityProduct = quantity || 1;
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
                    getLanguageValues: '0'
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
                const customer = res.locals.user || null;
                const guestUser = res.locals.uuid || null;
                if (!customer && !guestUser) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Error',
                        validation: 'Something went wrong! Cart order could not be inserted. Please try again'
                    });
                }
                let existingCart: any
                if (customer) {
                    existingCart = await CartOrdersModel.findOne({
                        $and: [
                            { customerId: customer },
                            { countryId: country },
                            { cartStatus: '1' }
                        ]
                    });
                } else {
                    existingCart = await CartOrdersModel.findOne({
                        $and: [
                            { guestUserId: guestUser },
                            { countryId: country },
                            { cartStatus: '1' }
                        ]
                    });
                }

                const offerProduct = productVariant[0].offer;
                let offerAmount = 0;
                let singleProductTotal = 0;
                let singleProductOriginalTotal = 0;
                let singleProductDiscountTotal = 0;

                var cartOrderData
                const shippingAmount: any = await WebsiteSetupModel.findOne({ blockReference: blockReferences.shipmentSettings, countryId: country })
                const shippingCharge = (shippingAmount ? Number(shippingAmount.blockValues.shippingCharge) : 0);
                const taxDetails: any = await TaxsModel.findOne({ countryId: country })

                if (offerProduct) {
                    if (offerProduct && offerProduct.offerType) {
                        if (offerProduct.offerType == offerTypes.percent) {
                            offerAmount = productVariantData.discountPrice > 0 ? (productVariantData.discountPrice * (offerProduct.offerIN / 100)) : (productVariantData.price * (offerProduct.offerIN / 100));
                        }
                        if (offerProduct.offerType == offerTypes.amountOff) {
                            offerAmount = offerProduct.offerIN
                        }
                    }
                }
                singleProductTotal = offerAmount > 0 ? ((productVariantData.discountPrice > 0) ? (productVariantData.discountPrice - offerAmount) : (productVariantData.price - offerAmount)) : (productVariantData.discountPrice ? productVariantData.discountPrice : productVariantData.price)
                if (existingCart) {
                    const existingCartProduct: any = await CartOrderProductsModel.findOne({
                        $and: [
                            { cartId: existingCart._id },
                            { variantId: productVariantData._id }
                        ]
                    });
                    if (quantity === 1) {
                        quantityProduct = existingCartProduct ? (quantityChange ? quantity : existingCartProduct.quantity + 1) : quantity
                    } else if (quantity == 0) {
                        if (existingCartProduct) {
                            const deletedData = await CartService.destroyCartProduct(existingCartProduct._id);
                            if (deletedData) {
                                const checkCartProducts = await CartOrderProductsModel.find({ cartId: existingCartProduct.cartId })
                                if (checkCartProducts && checkCartProducts.length == 0) {
                                    const deletedData = await CartService.destroy(existingCartProduct.cartId);
                                } else {
                                    totalDiscountAmountOfProduct = existingCart?.totalDiscountAmount - existingCartProduct.productDiscountAmount
                                    totalProductOriginalPrice = existingCart?.totalProductOriginalPrice - existingCartProduct.productOriginalPrice
                                    totalAmountOfProduct = existingCart?.totalProductAmount - existingCartProduct.productAmount
                                    const removeGiftWrapAmount = existingCartProduct.giftWrapAmount
                                    const finalShippingCharge = shippingCharge > 0 ? ((totalAmountOfProduct) - (Number(shippingAmount.blockValues.freeShippingThreshold)) > 0 ? 0 : shippingCharge) : 0
                                    const cartUpdate = await CartOrdersModel.findByIdAndUpdate(existingCartProduct.cartId, {
                                        totalProductAmount: totalAmountOfProduct,
                                        totalProductOriginalPrice: totalProductOriginalPrice,
                                        totalDiscountAmount: totalDiscountAmountOfProduct,
                                        totalShippingAmount: finalShippingCharge,
                                        totalGiftWrapAmount: existingCart.totalGiftWrapAmount - removeGiftWrapAmount,
                                        totalAmount: (totalAmountOfProduct + (existingCart.totalGiftWrapAmount - removeGiftWrapAmount)) + finalShippingCharge,
                                    }, { new: true, useFindAndModify: false });
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

                    if (productVariantData.quantity < quantityProduct) {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Validation error',
                            validation: "The quantity of the product exceeds the available stock."
                        });
                    }
                    if (productVariantData.cartMinQuantity || productVariantData.cartMaxQuantity) {
                        if (Number(productVariantData.cartMinQuantity) >= quantityProduct || Number(productVariantData.cartMaxQuantity) < quantityProduct) {
                            return controller.sendErrorResponse(res, 200, {
                                message: 'Validation error',
                                validation: `Cart minimum quantity is ${productVariantData.cartMinQuantity} and Cart maximum quantity ${productVariantData.cartMaxQuantity}`
                            });
                        }
                    }
                    singleProductTotal *= quantityProduct
                    singleProductDiscountTotal = (productVariantData.price * quantityProduct) - singleProductTotal
                    singleProductOriginalTotal = quantityProduct * productVariantData.price
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

                    cartOrderData = {
                        customerId: customer,
                        guestUserId: customer ? null : guestUser,
                        countryId: country,
                        cartStatus: '1',
                        orderStatus: '0',
                        totalProductOriginalPrice: totalProductOriginalPrice,
                        totalProductAmount: totalAmountOfProduct,
                        totalDiscountAmount: totalDiscountAmountOfProduct,
                        totalShippingAmount: finalShippingCharge,
                        totalGiftWrapAmount: totalGiftWrapAmount,
                        totalTaxAmount: taxDetails ? ((taxDetails.taxPercentage / 100) * totalAmountOfProduct).toFixed(2) : 0,
                        totalAmount: totalAmountOfProduct + finalShippingCharge + totalGiftWrapAmount,
                        isGuest: customer ? false : true
                    };

                    newCartOrder = await CartOrdersModel.findByIdAndUpdate(
                        existingCart._id,
                        cartOrderData,
                        { new: true, useFindAndModify: false }
                    )
                    if (newCartOrder) {
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
                        const existingProduct: any = await CartOrderProductsModel.findOne({
                            $and: [
                                { cartId: newCartOrder._id },
                                { variantId: productVariantData._id }
                            ]
                        });
                        if (existingProduct) {
                            await CartService.updateCartProduct(existingProduct._id, cartOrderProductData);
                        } else {
                            await CartService.createCartProduct(cartOrderProductData);
                        }
                    }
                } else {
                    singleProductTotal *= quantityProduct
                    singleProductDiscountTotal = (productVariantData.price * quantityProduct) - singleProductTotal
                    singleProductOriginalTotal = productVariantData.price * quantityProduct

                    totalDiscountAmountOfProduct = singleProductDiscountTotal
                    totalAmountOfProduct = singleProductTotal
                    totalProductOriginalPrice = singleProductOriginalTotal
                    const finalShippingCharge = shippingCharge > 0 ? ((totalAmountOfProduct) - (Number(shippingAmount.blockValues.freeShippingThreshold)) > 0 ? 0 : shippingCharge) : 0

                    cartOrderData = {
                        customerId: customer,
                        guestUserId: customer ? null : guestUser,
                        countryId: country,
                        cartStatus: '1',
                        orderStatus: '0',
                        totalProductOriginalPrice: totalProductOriginalPrice,
                        totalProductAmount: totalAmountOfProduct,
                        totalDiscountAmount: totalDiscountAmountOfProduct,
                        totalShippingAmount: finalShippingCharge,

                        // codAmount: Number(codAmount.blockValues.codCharge),
                        totalTaxAmount: taxDetails ? ((taxDetails.taxPercentage / 100) * totalAmountOfProduct).toFixed(2) : 0,
                        totalAmount: totalAmountOfProduct + finalShippingCharge,
                        isGuest: customer ? false : true
                    };
                    newCartOrder = await CartService.createCart(cartOrderData);
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
                        await CartService.createCartProduct(cartOrderProductData);
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
            const validatedData = addToWishlistSchema.safeParse(req.body);
            if (validatedData.success) {
                const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
                if (!countryId) {
                    return controller.sendErrorResponse(res, 500, {
                        message: 'Country is missing'
                    });
                }

                const { slug, sku } = validatedData.data;
                const productVariantData = await ProductVariantsModel.findOne({
                    countryId,
                    variantSku: sku,
                    slug
                });
                if (!productVariantData) {
                    return controller.sendErrorResponse(res, 500, {
                        message: 'Product not found!'
                    });
                }
                const user = res.locals.user;
                const cartDetails: any = await CartOrdersModel.findOne({
                    $or: [
                        { $and: [{ customerId: user }, { countryId: countryId }] },
                    ],
                    cartStatus: "1"
                });
                if (cartDetails) {
                    const whishlistData = await CustomerWishlistService.findOne({
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
                        const insertData = await CustomerWishlistService.create(whishlistInsertData);
                        if (insertData) {
                            const deletedDataFromCart: any = await CartService.destroyCartProduct(productVariantData._id);
                            if (deletedDataFromCart) {
                                const checkCartProducts = await CartOrderProductsModel.find({ cartId: deletedDataFromCart.cartId })
                                if (checkCartProducts.length == 0) {
                                    await CartOrderProductsModel.findOneAndDelete({ _id: deletedDataFromCart.cartId })
                                } else {
                                    const cartUpdate: any = await CartOrdersModel.findByIdAndUpdate(cartDetails._id,
                                        {
                                            totalProductAmount: (cartDetails.totalProductAmount - (deletedDataFromCart.productAmount * deletedDataFromCart.quantity)),
                                            totalAmount: (cartDetails.totalAmount - (deletedDataFromCart.productAmount * deletedDataFromCart.quantity)),
                                            totalProductOriginalPrice: (cartDetails.totalProductOriginalPrice - (deletedDataFromCart.productOriginalPrice * deletedDataFromCart.quantity)),
                                        }, { new: true, useFindAndModify: false });
                                }
                            }
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
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
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
            var cartDetails: any;
            const customer = res.locals.user;
            const guestUser = res.locals.uuid;
            const query: any = {
                cartStatus: "1",
                countryId: country
            };
            if (customer || guestUser) {
                if (customer) {
                    query['customerId'] = customer;
                } else if (guestUser) {
                    query['guestUserId'] = guestUser;
                }
                cartDetails = await CartOrdersModel.findOne(query);
            }
            if (cartDetails) {
                const existingCartProduct: any = await CartService.findCartProduct({
                    $or: [
                        { $and: [{ cartId: cartDetails._id }, { variantId: variantId }] },
                        { $and: [{ cartId: cartDetails._id }, { slug: slug }] }
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
                        const giftWrapUpdateAmount = existingCartProduct.giftWrapAmount ? -giftWrapCharge : giftWrapCharge;
                        await CartService.updateCartProductByCart(
                            existingCartProduct._id,
                            { giftWrapAmount: existingCartProduct.giftWrapAmount ? 0 : giftWrapCharge }
                        );
                        await CartOrdersModel.findByIdAndUpdate(
                            cartDetails._id,
                            {
                                totalGiftWrapAmount: cartDetails.totalGiftWrapAmount + giftWrapUpdateAmount,
                                totalAmount: cartDetails.totalAmount + giftWrapUpdateAmount
                            },
                            { new: true, useFindAndModify: false }
                        );
                        const resultCart = await CartService.findCartPopulate({ query });
                        return controller.sendSuccessResponse(res, {
                            requestedData: resultCart,
                            message: 'gift wrap updated successfully!'
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

    async changeGuest(req: Request, res: Response): Promise<void> {
        const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
        if (!countryId) {
            return controller.sendErrorResponse(res, 200, { message: 'Country is missing' });
        }

        const customer = res.locals.user;
        const guestUser = res.locals.uuid;
        const guestUserCart = await CartOrdersModel.findOneAndUpdate(
            { customerId: customer, cartStatus: '1' },
            { $set: { customerId: null, isGuest: true, guestUserId: guestUser } },
            { new: true }
        );
        if (guestUserCart) {
            return controller.sendSuccessResponse(res, {
                message: 'Change guest successfully!'
            });
        } else {
            return controller.sendErrorResponse(res, 200, {
                message: 'Validation error',
            });
        }
    }
}

export default new CartController();