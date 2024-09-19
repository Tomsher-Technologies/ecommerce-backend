"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const mongoose_1 = __importDefault(require("mongoose"));
const helpers_1 = require("../../utils/helpers");
const cart_schema_1 = require("../../utils/schemas/frontend/guest/cart-schema");
const offers_1 = require("../../constants/offers");
const base_controller_1 = __importDefault(require("../admin/base-controller"));
const wishlist_schema_1 = require("../../utils/schemas/frontend/auth/wishlist-schema");
const website_setup_1 = require("../../constants/website-setup");
const cart_order_config_1 = require("../../utils/config/cart-order-config");
const common_service_1 = __importDefault(require("../../services/frontend/guest/common-service"));
const product_service_1 = __importDefault(require("../../services/frontend/guest/product-service"));
const cart_service_1 = __importDefault(require("../../services/frontend/cart-service"));
const customer_wishlist_servicel_1 = __importDefault(require("../../services/frontend/auth/customer-wishlist-servicel"));
const product_variants_model_1 = __importDefault(require("../../model/admin/ecommerce/product/product-variants-model"));
const cart_order_product_model_1 = __importDefault(require("../../model/frontend/cart-order-product-model"));
const website_setup_model_1 = __importDefault(require("../../model/admin/setup/website-setup-model"));
const tax_model_1 = __importDefault(require("../../model/admin/setup/tax-model"));
const cart_order_model_1 = __importDefault(require("../../model/frontend/cart-order-model"));
const cart_utils_1 = require("../../utils/frontend/cart-utils");
const controller = new base_controller_1.default();
class CartController extends base_controller_1.default {
    async findUserCart(req, res) {
        try {
            const { page_size = 1, limit = 20, sortby = '', sortorder = '' } = req.query;
            let country = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (!country) {
                return controller.sendErrorResponse(res, 500, { message: 'Country is missing' });
            }
            const customer = res.locals.user;
            const guestUser = res.locals.uuid;
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
                        { cartStatus: '1' },
                        { isGuest: false }
                    ]
                });
                if (guestUserCart) {
                    let isMergeCart = true;
                    if (!customerCart) {
                        await cart_order_model_1.default.findOneAndUpdate(guestUserCart?._id, {
                            customerId: new mongoose_1.default.Types.ObjectId(customer),
                            guestUserId: null,
                            isGuest: false
                        });
                        isMergeCart = false;
                    }
                    if (isMergeCart) {
                        const cartProductDetails = await cart_order_product_model_1.default.aggregate((0, cart_order_config_1.cartOrderProductsGroupSumAggregate)(customerCart?._id, guestUserCart?._id));
                        if (cartProductDetails && cartProductDetails.length > 0) {
                            const bulkOps = cartProductDetails.flatMap((detail) => [
                                {
                                    updateOne: {
                                        filter: {
                                            variantId: detail.variantId,
                                            cartId: customerCart?._id
                                        },
                                        update: {
                                            $set: {
                                                productId: detail.productId,
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
                            const updateCartProduct = await cart_order_product_model_1.default.bulkWrite(bulkOps);
                            if (updateCartProduct) {
                                const cartMergeDetails = (0, cart_order_config_1.cartOrderGroupSumAggregate)(customerCart, guestUserCart);
                                const shippingAmount = await website_setup_model_1.default.findOne({ blockReference: website_setup_1.blockReferences.shipmentSettings, countryId: country });
                                const shippingCharge = (shippingAmount ? Number(shippingAmount.blockValues.shippingCharge) : 0);
                                const finalShippingCharge = shippingCharge > 0 ? ((cartMergeDetails.totalProductAmount) - (Number(shippingAmount.blockValues.freeShippingThreshold)) > 0 ? 0 : shippingCharge) : 0;
                                await cart_order_model_1.default.updateOne({ _id: customerCart._id }, {
                                    $set: {
                                        totalProductOriginalPrice: cartMergeDetails.totalProductOriginalPrice,
                                        totalProductAmount: cartMergeDetails.totalProductAmount,
                                        totalGiftWrapAmount: cartMergeDetails.totalGiftWrapAmount,
                                        totalDiscountAmount: cartMergeDetails.totalDiscountAmount,
                                        totalShippingAmount: finalShippingCharge,
                                        totalAmount: (cartMergeDetails.totalAmount + finalShippingCharge)
                                    }
                                }, { upsert: true });
                                const deleteGuestCart = await cart_order_model_1.default.findOneAndDelete({ _id: guestUserCart._id });
                                if (deleteGuestCart) {
                                    await cart_order_product_model_1.default.deleteMany({ cartId: guestUserCart._id });
                                }
                            }
                        }
                    }
                }
            }
            let query;
            if (!customer && guestUser) {
                query = { $and: [{ guestUserId: guestUser }, { countryId: country }, { cartStatus: '1' }] };
            }
            else {
                query = { $and: [{ customerId: customer }, { countryId: country }, { cartStatus: '1' }] };
            }
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const cartDetails = await cart_service_1.default.findCartPopulate({
                query,
                hostName: req.get('origin'),
                simple: '1'
            });
            if (cartDetails && Object.keys(cartDetails).length > 0) {
                const variantIds = cartDetails.products.map((product) => product.variantId);
                const productVariants = await product_variants_model_1.default.find({
                    _id: { $in: variantIds }
                });
                const cartOrderProductUpdateOperations = [];
                for (const variant of productVariants) {
                    await (0, cart_utils_1.cartPriceUpdateValueSet)({
                        cartDetails,
                        variant,
                        cartOrderProductUpdateOperations,
                    });
                }
                await cart_service_1.default.updateCartPrice({
                    cartDetails,
                    countryId: country,
                    cartOrderProductUpdateOperations
                });
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Active cart not fount1'
                });
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
    async createCartOrder(req, res) {
        try {
            const validatedData = cart_schema_1.cartSchema.safeParse(req.body);
            if (validatedData.success) {
                let country = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
                if (!country) {
                    return controller.sendErrorResponse(res, 500, { message: 'Country is missing' });
                }
                const { variantId, quantity, slug, orderStatus, quantityChange, addOnQuantity } = req.body;
                let newCartOrder;
                let totalAmountOfProduct = 0;
                let totalDiscountAmountOfProduct = 0;
                let quantityProduct = quantity || 1;
                let totalProductOriginalPrice = 0;
                let totalGiftWrapAmount = 0;
                let query = {};
                if (variantId) {
                    query = {
                        ...query,
                        'productVariants._id': new mongoose_1.default.Types.ObjectId(variantId),
                    };
                }
                else {
                    query = {
                        ...query,
                        'productVariants.slug': slug,
                    };
                }
                const productVariant = await product_service_1.default.findProductList({
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
                const productVariantData = productVariant[0].productVariants[0];
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
                let existingCart;
                if (customer) {
                    existingCart = await cart_order_model_1.default.findOne({
                        $and: [
                            { customerId: customer },
                            { countryId: country },
                            { cartStatus: '1' }
                        ]
                    });
                }
                else {
                    existingCart = await cart_order_model_1.default.findOne({
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
                var cartOrderData;
                const shippingAmount = await website_setup_model_1.default.findOne({ blockReference: website_setup_1.blockReferences.shipmentSettings, countryId: country });
                const shippingCharge = (shippingAmount ? Number(shippingAmount.blockValues.shippingCharge) : 0);
                const taxDetails = await tax_model_1.default.findOne({ countryId: country });
                if (offerProduct) {
                    if (offerProduct && offerProduct.offerType) {
                        if (offerProduct.offerType == offers_1.offerTypes.percent) {
                            offerAmount = productVariantData.discountPrice > 0 ? (productVariantData.discountPrice * (offerProduct.offerIN / 100)) : (productVariantData.price * (offerProduct.offerIN / 100));
                        }
                        if (offerProduct.offerType == offers_1.offerTypes.amountOff) {
                            offerAmount = offerProduct.offerIN;
                        }
                    }
                }
                singleProductTotal = offerAmount > 0 ? ((productVariantData.discountPrice > 0) ? (productVariantData.discountPrice - offerAmount) : (productVariantData.price - offerAmount)) : (productVariantData.discountPrice ? productVariantData.discountPrice : productVariantData.price);
                if (existingCart) {
                    const existingCartProduct = await cart_order_product_model_1.default.findOne({
                        $and: [
                            { cartId: existingCart._id },
                            { variantId: productVariantData._id }
                        ]
                    });
                    if (quantity === 1) {
                        quantityProduct = existingCartProduct ? (quantityChange ? quantity : existingCartProduct.quantity + 1) : quantity;
                    }
                    else if (addOnQuantity) {
                        quantityProduct = existingCartProduct.quantity + quantity;
                    }
                    else if (quantity == 0) {
                        if (existingCartProduct) {
                            const deletedData = await cart_service_1.default.destroyCartProduct(existingCartProduct._id);
                            if (deletedData) {
                                const checkCartProducts = await cart_order_product_model_1.default.find({ cartId: existingCartProduct.cartId });
                                if (checkCartProducts && checkCartProducts.length == 0) {
                                    const deletedData = await cart_service_1.default.destroy(existingCartProduct.cartId);
                                }
                                else {
                                    totalDiscountAmountOfProduct = existingCart?.totalDiscountAmount - existingCartProduct.productDiscountAmount;
                                    totalProductOriginalPrice = existingCart?.totalProductOriginalPrice - existingCartProduct.productOriginalPrice;
                                    totalAmountOfProduct = existingCart?.totalProductAmount - existingCartProduct.productAmount;
                                    const removeGiftWrapAmount = existingCartProduct.giftWrapAmount;
                                    const finalShippingCharge = shippingCharge > 0 ? ((totalAmountOfProduct) - (Number(shippingAmount.blockValues.freeShippingThreshold)) > 0 ? 0 : shippingCharge) : 0;
                                    const cartUpdate = await cart_order_model_1.default.findByIdAndUpdate(existingCartProduct.cartId, {
                                        totalProductAmount: totalAmountOfProduct,
                                        totalProductOriginalPrice: totalProductOriginalPrice,
                                        totalDiscountAmount: totalDiscountAmountOfProduct,
                                        totalShippingAmount: finalShippingCharge,
                                        totalGiftWrapAmount: existingCart.totalGiftWrapAmount - removeGiftWrapAmount,
                                        totalAmount: (totalAmountOfProduct + (existingCart.totalGiftWrapAmount - removeGiftWrapAmount)) + finalShippingCharge,
                                    }, { new: true, useFindAndModify: false });
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
                            return controller.sendErrorResponse(res, 200, {
                                message: 'Something went wrong: the product is not in the cart.'
                            });
                        }
                    }
                    if (productVariantData.quantity < quantityProduct) {
                        return controller.sendErrorResponse(res, 200, {
                            // message: 'Validation error',
                            message: "Reached maximum quantity"
                        });
                    }
                    if (productVariantData.cartMinQuantity || productVariantData.cartMaxQuantity) {
                        if ((productVariantData.cartMinQuantity != "") && Number(productVariantData.cartMinQuantity) > quantityProduct) {
                            return controller.sendErrorResponse(res, 200, {
                                // message: 'Validation error',
                                message: `The minimum purchase quantity is ${productVariantData.cartMinQuantity}`
                            });
                        }
                        if ((productVariantData.cartMaxQuantity != "") && Number(productVariantData.cartMaxQuantity) < quantityProduct) {
                            return controller.sendErrorResponse(res, 200, {
                                // message: 'Validation error',
                                message: `The maximum purchase quantity is ${productVariantData.cartMaxQuantity}`
                            });
                        }
                    }
                    singleProductTotal *= quantityProduct;
                    singleProductDiscountTotal = (productVariantData.price * quantityProduct) - singleProductTotal;
                    singleProductOriginalTotal = quantityProduct * productVariantData.price;
                    if (!existingCartProduct) {
                        totalDiscountAmountOfProduct = existingCart.totalDiscountAmount + singleProductDiscountTotal;
                        totalAmountOfProduct = existingCart.totalProductAmount + singleProductTotal;
                        totalProductOriginalPrice = existingCart.totalProductOriginalPrice + singleProductOriginalTotal;
                        totalGiftWrapAmount = existingCart.totalGiftWrapAmount;
                    }
                    else {
                        totalDiscountAmountOfProduct = existingCart.totalDiscountAmount - (existingCartProduct.productDiscountAmount) + singleProductDiscountTotal;
                        totalAmountOfProduct = existingCart.totalProductAmount - (existingCartProduct.productAmount) + singleProductTotal;
                        totalGiftWrapAmount = existingCart.totalGiftWrapAmount > 0 ? existingCart.totalGiftWrapAmount : 0;
                        totalProductOriginalPrice = existingCart.totalProductOriginalPrice - (existingCartProduct.productOriginalPrice) + singleProductOriginalTotal;
                    }
                    const finalShippingCharge = shippingCharge > 0 ? ((totalAmountOfProduct) - (Number(shippingAmount.blockValues.freeShippingThreshold)) > 0 ? 0 : shippingCharge) : 0;
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
                    newCartOrder = await cart_order_model_1.default.findByIdAndUpdate(existingCart._id, cartOrderData, { new: true, useFindAndModify: false });
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
                        const existingProduct = await cart_order_product_model_1.default.findOne({
                            $and: [
                                { cartId: newCartOrder._id },
                                { variantId: productVariantData._id }
                            ]
                        });
                        if (existingProduct) {
                            await cart_service_1.default.updateCartProduct(existingProduct._id, cartOrderProductData);
                        }
                        else {
                            await cart_service_1.default.createCartProduct(cartOrderProductData);
                        }
                    }
                }
                else {
                    console.log(Number(productVariantData.cartMaxQuantity));
                    if (productVariantData.cartMinQuantity || productVariantData.cartMaxQuantity) {
                        if ((productVariantData.cartMinQuantity != "") && Number(productVariantData.cartMinQuantity) > quantityProduct) {
                            return controller.sendErrorResponse(res, 200, {
                                // message: 'Validation error',
                                message: `The minimum purchase quantity is ${productVariantData.cartMinQuantity}`
                            });
                        }
                        if ((productVariantData.cartMaxQuantity != "") && Number(productVariantData.cartMaxQuantity) < quantityProduct) {
                            return controller.sendErrorResponse(res, 200, {
                                // message: 'Validation error',
                                message: `The maximum purchase quantity is ${productVariantData.cartMaxQuantity}`
                            });
                        }
                    }
                    singleProductTotal *= quantityProduct;
                    singleProductDiscountTotal = (productVariantData.price * quantityProduct) - singleProductTotal;
                    singleProductOriginalTotal = productVariantData.price * quantityProduct;
                    totalDiscountAmountOfProduct = singleProductDiscountTotal;
                    totalAmountOfProduct = singleProductTotal;
                    totalProductOriginalPrice = singleProductOriginalTotal;
                    const finalShippingCharge = shippingCharge > 0 ? ((totalAmountOfProduct) - (Number(shippingAmount.blockValues.freeShippingThreshold)) > 0 ? 0 : shippingCharge) : 0;
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
                    newCartOrder = await cart_service_1.default.createCart(cartOrderData);
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
                        await cart_service_1.default.createCartProduct(cartOrderProductData);
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
            const validatedData = wishlist_schema_1.addToWishlistSchema.safeParse(req.body);
            if (validatedData.success) {
                const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
                if (!countryId) {
                    return controller.sendErrorResponse(res, 500, {
                        message: 'Country is missing'
                    });
                }
                const { slug, sku } = validatedData.data;
                const productVariantData = await product_variants_model_1.default.findOne({
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
                const cartDetails = await cart_order_model_1.default.findOne({
                    $or: [
                        { $and: [{ customerId: user }, { countryId: countryId }] },
                    ],
                    cartStatus: "1"
                });
                if (cartDetails) {
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
                            if (deletedDataFromCart) {
                                const checkCartProducts = await cart_order_product_model_1.default.find({ cartId: deletedDataFromCart.cartId });
                                if (checkCartProducts.length == 0) {
                                    await cart_order_product_model_1.default.findOneAndDelete({ _id: deletedDataFromCart.cartId });
                                }
                                else {
                                    const cartUpdate = await cart_order_model_1.default.findByIdAndUpdate(cartDetails._id, {
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
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
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
            var cartDetails;
            const customer = res.locals.user;
            const guestUser = res.locals.uuid;
            const query = {
                cartStatus: "1",
                countryId: country
            };
            if (customer || guestUser) {
                if (customer) {
                    query['customerId'] = customer;
                }
                else if (guestUser) {
                    query['guestUserId'] = guestUser;
                }
                cartDetails = await cart_order_model_1.default.findOne(query);
            }
            if (cartDetails) {
                const existingCartProduct = await cart_service_1.default.findCartProduct({
                    $or: [
                        { $and: [{ cartId: cartDetails._id }, { variantId: variantId }] },
                        { $and: [{ cartId: cartDetails._id }, { slug: slug }] }
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
                        const giftWrapUpdateAmount = existingCartProduct.giftWrapAmount ? -giftWrapCharge : giftWrapCharge;
                        await cart_service_1.default.updateCartProductByCart(existingCartProduct._id, { giftWrapAmount: existingCartProduct.giftWrapAmount ? 0 : giftWrapCharge });
                        await cart_order_model_1.default.findByIdAndUpdate(cartDetails._id, {
                            totalGiftWrapAmount: cartDetails.totalGiftWrapAmount + giftWrapUpdateAmount,
                            totalAmount: cartDetails.totalAmount + giftWrapUpdateAmount
                        }, { new: true, useFindAndModify: false });
                        const resultCart = await cart_service_1.default.findCartPopulate({ query });
                        return controller.sendSuccessResponse(res, {
                            requestedData: resultCart,
                            message: 'gift wrap updated successfully!'
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
    async changeGuest(req, res) {
        const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
        if (!countryId) {
            return controller.sendErrorResponse(res, 200, { message: 'Country is missing' });
        }
        const customer = res.locals.user;
        const guestUser = res.locals.uuid;
        const guestUserCart = await cart_order_model_1.default.findOneAndUpdate({ customerId: customer, cartStatus: '1' }, { $set: { customerId: null, isGuest: true, guestUserId: guestUser } }, { new: true });
        if (guestUserCart) {
            return controller.sendSuccessResponse(res, {
                message: 'Change guest successfully!'
            });
        }
        else {
            return controller.sendErrorResponse(res, 200, {
                message: 'Validation error',
            });
        }
    }
}
exports.default = new CartController();
