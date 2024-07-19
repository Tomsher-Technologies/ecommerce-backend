"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const helpers_1 = require("../../utils/helpers");
const cart_schema_1 = require("../../utils/schemas/frontend/guest/cart-schema");
const offers_1 = require("../../constants/offers");
const base_controller_1 = __importDefault(require("../admin/base-controller"));
const cart_service_1 = __importDefault(require("../../services/frontend/cart-service"));
const common_service_1 = __importDefault(require("../../services/frontend/guest/common-service"));
const product_variants_model_1 = __importDefault(require("../../model/admin/ecommerce/product/product-variants-model"));
const wishlist_schema_1 = require("../../utils/schemas/frontend/auth/wishlist-schema");
const customer_wishlist_servicel_1 = __importDefault(require("../../services/frontend/auth/customer-wishlist-servicel"));
const website_setup_model_1 = __importDefault(require("../../model/admin/setup/website-setup-model"));
const website_setup_1 = require("../../constants/website-setup");
const cart_order_product_model_1 = __importDefault(require("../../model/frontend/cart-order-product-model"));
const tax_model_1 = __importDefault(require("../../model/admin/setup/tax-model"));
const offer_config_1 = require("../../utils/config/offer-config");
const mongoose_1 = __importDefault(require("mongoose"));
const product_model_1 = __importDefault(require("../../model/admin/ecommerce/product-model"));
const product_config_1 = require("../../utils/config/product-config");
const controller = new base_controller_1.default();
class CartController extends base_controller_1.default {
    async createCartOrder(req, res) {
        try {
            const validatedData = cart_schema_1.cartSchema.safeParse(req.body);
            const customer = res.locals.user;
            const guestUser = res.locals.uuid;
            if (validatedData.success) {
                const { shippingStatus, shipmentGatwayId, paymentGatwayId, pickupStoreId, orderComments, paymentMethod, paymentMethodCharge, rewardPoints, totalReturnedProduct, totalCouponAmount, totalWalletAmount, totalTaxAmount, codAmount } = req.body;
                const { variantId, quantity, slug, orderStatus, quantityChange } = req.body;
                let country = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
                let newCartOrder;
                let newCartOrderProduct;
                let totalAmountOfProduct = 0;
                let totalDiscountAmountOfProduct = 0;
                let quantityProduct = 1;
                const guestUserCart = await cart_service_1.default.findCart({
                    $and: [
                        { guestUserId: guestUser },
                        { countryId: country },
                        { customerId: null },
                        { cartStatus: '1' }
                    ]
                });
                const productVariantData = await product_variants_model_1.default.findOne({
                    $and: [
                        {
                            $or: [
                                { _id: variantId },
                                { slug: slug }
                            ]
                        },
                        { countryId: country }
                    ]
                });
                if (!productVariantData) {
                    return controller.sendErrorResponse(res, 500, { message: 'Product not found!' });
                }
                if (customer || guestUser) {
                    var existingCart;
                    if (customer) {
                        existingCart = await cart_service_1.default.findCart({
                            $and: [
                                { customerId: customer },
                                { countryId: country },
                                { cartStatus: '1' }
                            ]
                        });
                    }
                    else {
                        existingCart = await cart_service_1.default.findCart({
                            $and: [
                                { guestUserId: guestUser },
                                { countryId: country },
                                { cartStatus: '1' }
                            ]
                        });
                    }
                    let pipeline = [
                        product_config_1.productCategoryLookup,
                        product_config_1.brandLookup,
                        product_config_1.brandObject,
                        { $match: { _id: new mongoose_1.default.Types.ObjectId(productVariantData.productId) } },
                    ];
                    const { getOfferList, offerApplied } = await common_service_1.default.findOffers(0, req.get('origin'), "", country);
                    // let pipeline: any[] = []
                    if (offerApplied.category.categories && offerApplied.category.categories.length > 0) {
                        const offerCategory = (0, offer_config_1.offerCategoryPopulation)(getOfferList, offerApplied.category);
                        pipeline.push(offerCategory);
                    }
                    if (offerApplied.brand.brands && offerApplied.brand.brands.length > 0) {
                        const offerBrand = (0, offer_config_1.offerBrandPopulation)(getOfferList, offerApplied.brand);
                        pipeline.push(offerBrand);
                    }
                    if (offerApplied.product.products && offerApplied.product.products.length > 0) {
                        const offerProduct = (0, offer_config_1.offerProductPopulation)(getOfferList, offerApplied.product);
                        pipeline.push(offerProduct);
                    }
                    pipeline.push({
                        $addFields: {
                            offer: {
                                $cond: {
                                    if: { $gt: [{ $size: { $ifNull: ["$categoryOffers", []] } }, 0] },
                                    then: { $arrayElemAt: ["$categoryOffers", 0] },
                                    else: {
                                        $cond: {
                                            if: { $gt: [{ $size: { $ifNull: ["$brandOffers", []] } }, 0] },
                                            then: { $arrayElemAt: ["$brandOffers", 0] },
                                            else: { $arrayElemAt: [{ $ifNull: ["$productOffers", []] }, 0] }
                                        }
                                    }
                                }
                            }
                        },
                    });
                    const offerProduct = await product_model_1.default.aggregate(pipeline);
                    let offerAmount = 0;
                    let singleProductTotal = 0;
                    let singleProductDiscountTotal = 0;
                    if (offerProduct && offerProduct?.length > 0) {
                        // for (let i = 0; i < offerProduct[0].productVariants.length; i++) {
                        if (offerProduct[0].offer && offerProduct[0].offer.offerType) {
                            // if (productVariantData._id.toString() === offerProduct[0].productVariants[i]._id.toString()) {
                            if (offerProduct[0].offer.offerType == offers_1.offerTypes.percent) {
                                offerAmount = productVariantData.discountPrice > 0 ? (productVariantData.discountPrice * (offerProduct[0].offer.offerIN / 100)) : (productVariantData.price * (offerProduct[0].offer.offerIN / 100));
                            }
                            if (offerProduct[0].offer.offerType == offers_1.offerTypes.amountOff) {
                                offerAmount = offerProduct[0].offer.offerIN;
                            }
                        }
                        // }
                        // }
                    }
                    if (productVariantData && productVariantData.quantity <= 0) {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Validation error',
                            validation: "Item Out of stock"
                        });
                    }
                    if (productVariantData && productVariantData.cartMinQuantity || productVariantData.cartMaxQuantity) {
                        if (Number(productVariantData.cartMinQuantity) >= quantityProduct ? 0 : quantity || Number(productVariantData.cartMaxQuantity) <= quantityProduct ? 0 : quantity) {
                            return controller.sendErrorResponse(res, 200, {
                                message: 'Validation error',
                                validation: "Cart minimum quantity is " + productVariantData.cartMinQuantity + " and Cart maximum quantity " + productVariantData.cartMaxQuantity
                            });
                        }
                    }
                    var cartOrderData;
                    const shippingAmount = await website_setup_model_1.default.findOne({ blockReference: website_setup_1.blockReferences.shipmentSettings, countryId: country });
                    const shippingCharge = (shippingAmount ? Number(shippingAmount.blockValues.shippingCharge) : 0);
                    const tax = await tax_model_1.default.findOne({ countryId: country });
                    if (existingCart) {
                        const existingCartProduct = await cart_service_1.default.findCartProduct({
                            $and: [
                                { cartId: existingCart._id },
                                { variantId: productVariantData._id }
                            ]
                        });
                        if (!existingCartProduct) {
                            quantityProduct = quantity;
                            totalDiscountAmountOfProduct = existingCart.totalDiscountAmount + offerAmount ? (offerAmount * quantity) : (productVariantData.price - productVariantData.discountPrice) * quantity;
                            totalAmountOfProduct = existingCart.totalProductAmount + (totalDiscountAmountOfProduct > 0 ? ((productVariantData.price - totalDiscountAmountOfProduct) * quantity) : (productVariantData?.price * quantity));
                        }
                        if (quantity != 0 && quantityChange == true && existingCartProduct) {
                            quantityProduct = quantity;
                        }
                        else if (quantity != 0 && quantityChange == true) {
                            quantityProduct = quantity;
                        }
                        else if (quantity == 1) {
                            quantityProduct = existingCartProduct ? existingCartProduct?.quantity + 1 : quantity;
                        }
                        else if (quantity > 1) {
                            quantityProduct = quantity;
                        }
                        else if (quantity == 0) {
                            if (existingCartProduct) {
                                const deletedData = await cart_service_1.default.destroyCartProduct(existingCartProduct._id);
                                if (deletedData) {
                                    totalDiscountAmountOfProduct = existingCart?.totalDiscountAmount - existingCartProduct.productDiscountAmount;
                                    totalAmountOfProduct = existingCart?.totalProductAmount - existingCartProduct.productAmount;
                                    const giftWrapAmount = await website_setup_model_1.default.findOne({ blockReference: website_setup_1.blockReferences.enableFeatures });
                                    var giftWrapCharge;
                                    if (giftWrapAmount && giftWrapAmount.blockValues && giftWrapAmount.blockValues.enableGiftWrap && giftWrapAmount.blockValues.enableGiftWrap == true) {
                                        giftWrapCharge = Number(giftWrapAmount.blockValues.giftWrapCharge);
                                    }
                                    const removeGiftWrapAmount = existingCartProduct.giftWrapAmount;
                                    const cartUpdate = await cart_service_1.default.update(existingCartProduct.cartId, {
                                        totalProductAmount: totalAmountOfProduct,
                                        totalDiscountAmount: totalDiscountAmountOfProduct,
                                        totalAmount: (totalAmountOfProduct - removeGiftWrapAmount) + shippingCharge,
                                        totalGiftWrapAmount: removeGiftWrapAmount > 0 ? (existingCart.totalGiftWrapAmount - removeGiftWrapAmount) : existingCart.totalGiftWrapAmount
                                    });
                                    const checkCartProducts = await cart_service_1.default.findAllCart({ cartId: existingCartProduct.cartId });
                                    if (checkCartProducts && checkCartProducts.length == 0) {
                                        const deletedData = await cart_service_1.default.destroy(existingCartProduct.cartId);
                                    }
                                    const cart = await cart_service_1.default.findCartPopulate({ query: { _id: existingCartProduct.cartId, cartStatus: "1" }, hostName: req.get('origin') });
                                    return controller.sendSuccessResponse(res, {
                                        requestedData: {
                                            ...cart
                                        },
                                        message: 'Product removed successfully!'
                                    });
                                }
                                else {
                                    return controller.sendErrorResponse(res, 500, {
                                        message: 'Somethng went wrong on Product removed!'
                                    });
                                }
                            }
                            else {
                                return controller.sendErrorResponse(res, 500, {
                                    message: 'Something went wrong: the product is not in the cart.'
                                });
                            }
                        }
                        // }
                        singleProductTotal = offerAmount > 0 ? ((productVariantData.discountPrice > 0) ? (productVariantData.discountPrice - offerAmount) : (productVariantData.price - offerAmount)) : (productVariantData.discountPrice ? productVariantData.discountPrice : productVariantData.price);
                        singleProductTotal *= quantityProduct;
                        singleProductDiscountTotal = (productVariantData.price * quantityProduct) - singleProductTotal;
                        let giftWrapcharge = 0;
                        if (!existingCartProduct) {
                            totalDiscountAmountOfProduct = existingCart.totalDiscountAmount + singleProductDiscountTotal;
                            totalAmountOfProduct = existingCart.totalProductAmount + singleProductTotal;
                        }
                        else {
                            totalDiscountAmountOfProduct = existingCart.totalDiscountAmount - (existingCartProduct.productDiscountAmount) + singleProductDiscountTotal;
                            totalAmountOfProduct = existingCart.totalProductAmount - (existingCartProduct.productAmount) + singleProductTotal;
                            giftWrapcharge = existingCartProduct.giftWrapAmount > 0 ? existingCartProduct.giftWrapAmount : 0;
                        }
                        const finalShippingCharge = shippingCharge > 0 ? ((totalAmountOfProduct) - (Number(shippingAmount.blockValues.freeShippingThreshold)) > 0 ? 0 : shippingCharge) : 0;
                        // const codAmount: any = await WebsiteSetupModel.findOne({ blockReference: blockReferences.defualtSettings })
                        cartOrderData = {
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
                            totalShippingAmount: finalShippingCharge,
                            totalCouponAmount,
                            totalWalletAmount,
                            codAmount,
                            totalTaxAmount: tax ? ((tax.taxPercentage / 100) * totalAmountOfProduct).toFixed(2) : 0,
                            totalAmount: totalAmountOfProduct + finalShippingCharge + giftWrapcharge
                        };
                        newCartOrder = await cart_service_1.default.update(existingCart._id, cartOrderData);
                        if (newCartOrder) {
                            const existingProduct = await cart_service_1.default.findCartProduct({
                                $and: [
                                    { cartId: newCartOrder._id },
                                    { variantId: productVariantData._id }
                                ]
                            });
                            // const giftWrapAmount: any = await WebsiteSetupModel.findOne({ blockReference: blockReferences.enableFeatures })
                            // var giftWrapCharge: any
                            // if (giftWrapAmount && giftWrapAmount.blockValues && giftWrapAmount.blockValues.enableGiftWrap && giftWrapAmount.blockValues.enableGiftWrap == true) {
                            //     giftWrapCharge = Number(giftWrapAmount.blockValues.giftWrapCharge)
                            // }
                            const cartOrderProductData = {
                                cartId: newCartOrder._id,
                                customerId: customer,
                                variantId: productVariantData._id,
                                productId: productVariantData.productId,
                                quantity: quantityProduct,
                                productAmount: singleProductTotal,
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
                                newCartOrderProduct = await cart_service_1.default.updateCartProduct(existingProduct._id, cartOrderProductData);
                            }
                            else {
                                // console.log("********dffdfdf*************", cartOrderProductData);
                                newCartOrderProduct = await cart_service_1.default.createCartProduct(cartOrderProductData);
                            }
                        }
                    }
                    else {
                        singleProductTotal = offerAmount > 0 ? ((productVariantData.discountPrice > 0) ? (productVariantData.discountPrice - offerAmount) : (productVariantData.price - offerAmount)) : (productVariantData.discountPrice ? productVariantData.discountPrice : productVariantData.price);
                        singleProductTotal *= quantityProduct;
                        singleProductDiscountTotal = (productVariantData.price * quantityProduct) - singleProductTotal;
                        totalDiscountAmountOfProduct = singleProductDiscountTotal;
                        totalAmountOfProduct = singleProductTotal;
                        const finalShippingCharge = shippingCharge > 0 ? ((totalAmountOfProduct) - (Number(shippingAmount.blockValues.freeShippingThreshold)) > 0 ? 0 : shippingCharge) : 0;
                        cartOrderData = {
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
                            totalShippingAmount: finalShippingCharge,
                            totalCouponAmount,
                            totalWalletAmount,
                            codAmount,
                            // codAmount: Number(codAmount.blockValues.codCharge),
                            totalTaxAmount: tax ? ((tax.taxPercentage / 100) * totalAmountOfProduct).toFixed(2) : 0,
                            totalAmount: totalAmountOfProduct + finalShippingCharge,
                        };
                        newCartOrder = await cart_service_1.default.create(cartOrderData);
                        if (newCartOrder) {
                            const cartOrderProductData = {
                                cartId: newCartOrder._id,
                                customerId: customer,
                                variantId: productVariantData._id,
                                productId: productVariantData.productId,
                                productDiscountAmount: singleProductDiscountTotal,
                                quantity: quantityProduct,
                                productAmount: singleProductTotal,
                                slug: productVariantData.slug,
                                orderStatus,
                                createdAt: new Date(),
                                updatedAt: new Date()
                            };
                            newCartOrderProduct = await cart_service_1.default.createCartProduct(cartOrderProductData);
                        }
                    }
                    if (newCartOrder) {
                        const products = await cart_service_1.default.findCartPopulate({
                            query: { _id: newCartOrder._id, cartStatus: "1" }, hostName: req.get('origin'),
                        });
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
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                });
            }
        }
        catch (error) {
            // console.log("*********errorr", error);
            return controller.sendErrorResponse(res, 200, {
                message: error.message || 'Some error occurred while creating cart order',
            });
        }
    }
    async moveToWishlist(req, res) {
        try {
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                const validatedData = wishlist_schema_1.addToWishlistSchema.safeParse(req.body);
                if (validatedData.success) {
                    const { slug, sku } = validatedData.data;
                    const productVariantData = await product_variants_model_1.default.findOne({
                        countryId,
                        variantSku: sku,
                        slug
                    });
                    const user = res.locals.user;
                    if (productVariantData) {
                        const cart = await cart_service_1.default.findCartPopulate({
                            query: {
                                $or: [
                                    { $and: [{ customerId: user }, { countryId: countryId }] },
                                ],
                                cartStatus: "1"
                            },
                            hostName: req.get('origin'),
                        });
                        if (cart) {
                            const whishlistData = await customer_wishlist_servicel_1.default.findOne({
                                userId: user._id,
                                countryId,
                            });
                            if (whishlistData) {
                                return controller.sendSuccessResponse(res, {
                                    requestedData: {},
                                    message: 'Product added successfully!'
                                });
                            }
                            else {
                                const whishlistInsertData = {
                                    countryId,
                                    userId: user._id,
                                    productId: productVariantData.productId,
                                    variantId: productVariantData._id,
                                    slug: productVariantData.slug,
                                    variantSku: productVariantData.variantSku
                                };
                                const insertData = await customer_wishlist_servicel_1.default.create(whishlistInsertData);
                                if (insertData) {
                                    const deletedDataFromCart = await cart_service_1.default.destroyCartProduct(productVariantData._id);
                                    const cartUpdate = await cart_service_1.default.update(cart._id, { totalProductAmount: (cart.totalProductAmount - (deletedDataFromCart.productAmount * deletedDataFromCart.quantity)), totalAmount: (cart.totalAmount - (deletedDataFromCart.productAmount * deletedDataFromCart.quantity)) });
                                    return controller.sendSuccessResponse(res, {
                                        requestedData: insertData,
                                        message: 'Wishlist added successfully!'
                                    });
                                }
                                else {
                                    return controller.sendErrorResponse(res, 500, {
                                        message: 'Somethng went wrong on wishlist add!'
                                    });
                                }
                            }
                        }
                        else {
                            return controller.sendErrorResponse(res, 500, {
                                message: 'Cart not found!'
                            });
                        }
                    }
                    else {
                        return controller.sendErrorResponse(res, 500, {
                            message: 'Product not found!'
                        });
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                    });
                }
            }
            else {
                return controller.sendErrorResponse(res, 500, {
                    message: 'Country is missing'
                });
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while add to wishlist'
            });
        }
    }
    async addGiftWrap(req, res) {
        try {
            const customer = res.locals.user;
            const guestUser = res.locals.uuid;
            let country = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (!country) {
                return controller.sendErrorResponse(res, 500, { message: 'Country is missing' });
            }
            const validatedData = cart_schema_1.cartProductSchema.safeParse(req.body);
            if (!validatedData.success) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                });
            }
            const { variantId, slug } = validatedData.data;
            const productVariantData = await product_variants_model_1.default.findOne({
                $and: [
                    {
                        $or: [
                            { _id: variantId },
                            { slug: slug }
                        ]
                    }, { countryId: country }
                ]
            });
            if (!productVariantData) {
                return controller.sendErrorResponse(res, 500, { message: 'Product not found!' });
            }
            const cart = await cart_service_1.default.findCartPopulate({
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
                const existingCartProduct = await cart_service_1.default.findCartProduct({
                    $or: [
                        { $and: [{ cartId: cart._id }, { variantId: variantId }] },
                        { $and: [{ cartId: cart._id }, { slug: slug }] }
                    ]
                });
                if (existingCartProduct) {
                    const giftWrapAmount = await website_setup_model_1.default.findOne({ blockReference: website_setup_1.blockReferences.enableFeatures });
                    if (giftWrapAmount) {
                        var giftWrapCharge;
                        if (giftWrapAmount.blockValues.enableGiftWrap == true) {
                            giftWrapCharge = Number(giftWrapAmount.blockValues.giftWrapCharge);
                        }
                        else {
                            return controller.sendErrorResponse(res, 500, {
                                message: 'Giftwrap option is currently unavailable'
                            });
                        }
                        if (existingCartProduct.giftWrapAmount != 0) {
                            await cart_service_1.default.updateCartProductByCart(existingCartProduct._id, { giftWrapAmount: 0 });
                            const cartUpdate = await cart_service_1.default.update(cart._id, { totalGiftWrapAmount: (cart.totalGiftWrapAmount - giftWrapCharge), totalAmount: (cart.totalAmount - giftWrapCharge) });
                        }
                        else {
                            const updateCart = await cart_service_1.default.updateCartProductByCart(existingCartProduct._id, { giftWrapAmount: giftWrapCharge });
                            const cartUpdate = await cart_service_1.default.update(cart._id, { totalGiftWrapAmount: (cart.totalGiftWrapAmount + giftWrapCharge), totalAmount: (cart.totalAmount + giftWrapCharge) });
                        }
                        const resultCart = await cart_service_1.default.findCartPopulate({
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
                    }
                    else {
                        return controller.sendErrorResponse(res, 500, {
                            message: 'Giftwrap option is currently unavailable'
                        });
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 500, {
                        message: 'Cart Product not found!'
                    });
                }
            }
            else {
                return controller.sendErrorResponse(res, 500, {
                    message: 'Cart not found!'
                });
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while add to gift wrap'
            });
        }
    }
    async findUserCart(req, res) {
        try {
            const { page_size = 1, limit = 20, sortby = '', sortorder = '' } = req.query;
            const customer = res.locals.user;
            const guestUser = res.locals.uuid;
            let country = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            let query;
            if (guestUser && customer) {
                const guestUserCart = await cart_service_1.default.findCart({
                    $and: [
                        { guestUserId: guestUser },
                        { countryId: country },
                        { customerId: null },
                        { cartStatus: '1' }
                    ]
                });
                const customerCart = await cart_service_1.default.findCart({
                    $and: [
                        { customerId: customer },
                        { countryId: country },
                        { cartStatus: '1' }
                    ]
                });
                if (guestUserCart || customerCart) {
                    const cartProduct = await cart_order_product_model_1.default.aggregate([
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
                                giftWrapAmount: 1,
                                variantId: "$_id",
                                productId: 1,
                                orderStatus: 1,
                                createdAt: 1,
                                updatedAt: 1,
                            }
                        }
                    ]);
                    // console.log("cartProduct", cartProduct);
                    const update = await cart_service_1.default.updateCartProduct(cartProduct._id, {
                        quantity: cartProduct.quantity,
                        productAmount: cartProduct.productAmount,
                        productDiscountAmount: cartProduct.productDiscountAmount,
                        customerId: cartProduct.customerId,
                        guestUserId: null
                    });
                    // console.log("cartProduct12345", update);
                }
                if (guestUserCart) {
                    const update = await cart_service_1.default.update(guestUserCart._id, { customerId: customer });
                }
                // if (customerCart || guestUser) {
                // const cartProducts = await CartOrderProductsModel.find({ cartId: customerCart?._id });
                const cartProductsaggregation = await cart_order_product_model_1.default.aggregate([
                    { $match: { cartId: customerCart?._id } },
                    { $unwind: "$products" }, // Unwind the array field named "products"
                    {
                        $group: {
                            _id: "$_id",
                            totalProductAmount: { $sum: "$products.productAmount" },
                            totalGiftWrapAmount: { $sum: "$products.totalGiftWrapAmount" },
                            totalDiscountAmount: { $sum: "$products.productDiscountAmount" },
                            totalAmount: { $sum: { $add: ["$products.productDiscountAmount", "$products.totalGiftWrapAmount", "$products.productAmount"] } }
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            totalProductAmount: 1,
                            totalGiftWrapAmount: 1,
                            totalDiscountAmount: 1,
                            totalAmount: 1
                        }
                    }
                ]);
                // console.log("cartProductsaggregation", cartProductsaggregation);
                const updateCart = await cart_service_1.default.update(customerCart?._id, {
                    totalProductAmount: cartProductsaggregation.totalProductAmount,
                    totalGiftWrapAmount: cartProductsaggregation.totalGiftWrapAmount,
                    totalDiscountAmount: cartProductsaggregation.totalDiscountAmount,
                    totalAmount: cartProductsaggregation.totalAmount
                });
                // console.log(".............", updateCart);
            }
            // query = { customerId: customer, cartStatus: '1' }
            // const userData = await res.locals.user;
            if (guestUser && !customer) {
                query = { $and: [{ guestUserId: guestUser }, { countryId: country }, { cartStatus: '1' }] };
            }
            else {
                query = { $and: [{ customerId: customer }, { countryId: country }, { cartStatus: '1' }] };
            }
            // query.cartStatus = '1';
            // query.customerId = userData._id;
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const cart = await cart_service_1.default.findCartPopulate({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                hostName: req.get('origin'),
                sort
            });
            if (cart) {
                return controller.sendSuccessResponse(res, {
                    requestedData: cart,
                    message: 'Your cart is ready!'
                });
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Active cart not fount'
                });
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while get cart'
            });
        }
    }
    async addWalletPoint(req, res) {
    }
}
exports.default = new CartController();
