"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const helpers_1 = require("../../utils/helpers");
const cart_schema_1 = require("../../utils/schemas/frontend/guest/cart-schema");
const base_controller_1 = __importDefault(require("../admin/base-controller"));
const cart_service_1 = __importDefault(require("../../services/frontend/cart-service"));
const common_service_1 = __importDefault(require("../../services/frontend/guest/common-service"));
const cart_service_2 = __importDefault(require("../../services/frontend/cart-service"));
const cart_order_product_model_1 = __importDefault(require("../../model/frontend/cart-order-product-model"));
const product_variants_model_1 = __importDefault(require("../../model/admin/ecommerce/product/product-variants-model"));
const wishlist_schema_1 = require("../../utils/schemas/frontend/auth/wishlist-schema");
const customer_wishlist_servicel_1 = __importDefault(require("../../services/frontend/auth/customer-wishlist-servicel"));
const website_setup_model_1 = __importDefault(require("../../model/admin/setup/website-setup-model"));
const website_setup_1 = require("../../constants/website-setup");
const controller = new base_controller_1.default();
class CartController extends base_controller_1.default {
    async createCartOrder(req, res) {
        try {
            const validatedData = cart_schema_1.cartSchema.safeParse(req.body);
            const user = res.locals.user;
            const uuid = res.locals.uuid;
            if (validatedData.success) {
                const { shippingStatus, shipmentGatwayId, paymentGatwayId, pickupStoreId, orderComments, paymentMethod, paymentMethodCharge, rewardPoints, totalReturnedProduct, totalProductAmount, totalDiscountAmount, totalShippingAmount, totalCouponAmount, totalWalletAmount, totalTaxAmount, totalAmount, codAmount } = validatedData.data;
                const { variantId, quantity, slug, orderStatus } = req.body;
                let customer, guestUser;
                let country = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
                let newCartOrder;
                let newCartOrderProduct;
                customer = user;
                guestUser = uuid;
                const guestUserCart = await cart_service_1.default.findCart({
                    $and: [
                        { guestUserId: guestUser },
                        { countryId: country },
                        { customerId: null }
                    ]
                });
                const productVariantData = await product_variants_model_1.default.findOne({
                    $or: [
                        { _id: variantId },
                        { slug: slug }
                    ]
                });
                if (customer && guestUser && guestUserCart) {
                    const customerCart = await cart_service_1.default.findCart({
                        $and: [
                            { customerId: customer },
                            { countryId: country }
                        ]
                    });
                    // const guestUserCart: any = await CartService.findCart(
                    //     {
                    //         $and: [
                    //             { guestUserId: guestUser },
                    //             { countryId: country }
                    //         ]
                    //     });
                    if (guestUserCart) {
                        const cartProducts = await cart_order_product_model_1.default.find({
                            $or: [
                                { cartId: guestUserCart?._id },
                                { cartId: customerCart?._id }
                            ]
                        });
                        const combinedData = [];
                        const variantIdMap = {};
                        // Iterate through each object in data
                        cartProducts.forEach((item) => {
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
                            }
                            else {
                                // If variantId is already in the map, update the quantity
                                variantIdMap[variantId].quantity += item.quantity;
                            }
                        });
                        // Convert variantIdMap object back to array format
                        for (const key in variantIdMap) {
                            combinedData.push(variantIdMap[key]);
                        }
                        var updateCart;
                        for (let data of combinedData) {
                            const cartProduct = await cart_order_product_model_1.default.findOne({
                                $and: [
                                    { cartId: data.cartId },
                                    { variantId: data.variantId }
                                ]
                            });
                            if (cartProduct) {
                                updateCart = await cart_service_1.default.updateCartProductByCart({
                                    $and: [
                                        { cartId: data.cartId },
                                        { variantId: data.variantId }
                                    ]
                                }, {
                                    cartId: data.cartId,
                                    slug: data.slug,
                                    giftWrapAmount: data.giftWrapAmount,
                                    quantity: data.quantity,
                                    variantId: data.variantId,
                                    productId: data.productId
                                });
                                if (updateCart) {
                                    const deletedData = await cart_service_1.default.destroy(guestUserCart._id);
                                    const updateData = await cart_service_1.default.update(customerCart._id, { guestUserId: null });
                                    const deletedProductData = await cart_service_1.default.destroyCartProduct1({ cartId: guestUserCart._id });
                                    const cart = await cart_service_1.default.findCartPopulate({
                                        query: {
                                            $and: [
                                                { customerId: customer },
                                                { countryId: country }
                                            ]
                                        },
                                        hostName: req.get('origin'),
                                    });
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
                }
                else if (customer || guestUser) {
                    const existingCart = await cart_service_1.default.findCart({
                        $or: [
                            { customerId: customer },
                            { guestUserId: guestUser }
                        ]
                    });
                    // totalProductAmount = 
                    let totalAmountOfProduct = 0;
                    let totalDiscountAmountOfProduct = 0;
                    let quantityProduct = 0;
                    totalAmountOfProduct = productVariantData?.price * quantity;
                    totalDiscountAmountOfProduct = productVariantData.discountPrice * quantity;
                    if (existingCart) {
                        const existingCartProduct = await cart_service_1.default.findCartProduct({
                            $and: [
                                { cartId: existingCart._id },
                                { variantId: productVariantData._id }
                            ]
                        });
                        if (existingCart.totalProductAmount && existingCartProduct && existingCartProduct.quantity) {
                            totalAmountOfProduct = (productVariantData.price * existingCartProduct.quantity);
                            totalDiscountAmountOfProduct = (productVariantData.discountPrice * existingCartProduct.quantity);
                        }
                        else {
                            totalAmountOfProduct = productVariantData?.price * quantity;
                            totalDiscountAmountOfProduct = productVariantData.discountPrice * quantity;
                        }
                        if (quantity == 1) {
                            quantityProduct = existingCartProduct ? existingCartProduct?.quantity + 1 : quantity;
                        }
                        else if (quantity > 1) {
                            quantityProduct = quantity;
                        }
                        else if (quantity == 0) {
                            if (existingCartProduct) {
                                const deletedData = await cart_service_1.default.destroyCartProduct(existingCartProduct._id);
                                if (deletedData) {
                                    const cart = await cart_service_1.default.findCartPopulate({ _id: existingCartProduct.cartId, hostName: req.get('origin') });
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
                    }
                    if (productVariantData && productVariantData.cartMinQuantity || productVariantData.cartMaxQuantity) {
                        if (Number(productVariantData.cartMinQuantity) >= quantityProduct ? 0 : quantity || Number(productVariantData.cartMaxQuantity) <= quantityProduct ? 0 : quantity) {
                            return controller.sendErrorResponse(res, 200, {
                                message: 'Validation error',
                                validation: "Cart minimum quantity is " + productVariantData.cartMinQuantity + " and Cart maximum quantity " + productVariantData.cartMaxQuantity
                            });
                        }
                    }
                    const shippingAmount = await website_setup_model_1.default.findOne({ blockReference: website_setup_1.blockReferences.shipmentSettings });
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
                        newCartOrder = await cart_service_2.default.update(existingCart._id, cartOrderData);
                        if (newCartOrder) {
                            const existingProduct = await cart_service_1.default.findCartProduct({
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
                                newCartOrderProduct = await cart_service_1.default.updateCartProduct(existingProduct._id, cartOrderProductData);
                            }
                            else {
                                newCartOrderProduct = await cart_service_1.default.createCartProduct(cartOrderProductData);
                            }
                        }
                    }
                    else {
                        newCartOrder = await cart_service_2.default.create(cartOrderData);
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
                            newCartOrderProduct = await cart_service_1.default.createCartProduct(cartOrderProductData);
                        }
                    }
                    if (newCartOrder) {
                        const products = await cart_service_1.default.findCartPopulate({
                            _id: newCartOrder._id, hostName: req.get('origin'),
                        });
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
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                });
            }
        }
        catch (error) {
            console.log("*********errorr", error);
            return controller.sendErrorResponse(res, 200, {
                message: error.message || 'Some error occurred while creating cart order',
            });
        }
    }
    async addToWishlist(req, res) {
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
                        const whishlistData = await customer_wishlist_servicel_1.default.findOne({
                            userId: user._id,
                            countryId,
                        });
                        if (whishlistData) {
                            const deletedDataFromCart = await cart_service_1.default.destroyCartProduct(productVariantData._id);
                            if (deletedDataFromCart) {
                                return controller.sendSuccessResponse(res, {
                                    requestedData: {},
                                    message: 'Product removed successfully!'
                                });
                            }
                            else {
                                return controller.sendErrorResponse(res, 500, {
                                    message: 'Somethng went wrong on product removed!'
                                });
                            }
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
            const { variantId, slug } = req.body;
            const cart = await cart_service_1.default.findCartPopulate({
                query: {
                    $or: [
                        { $and: [{ customerId: customer }, { countryId: country }] },
                        { $and: [{ guestUserId: guestUser }, { countryId: country }] }
                    ]
                },
                hostName: req.get('origin'),
            });
            const existingCartProduct = await cart_service_1.default.findCartProduct({
                $or: [
                    { $and: [{ cartId: cart._id }, { variantId: variantId }] },
                    { $and: [{ cartId: cart._id }, { slug: slug }] }
                ]
            });
            const giftWrapAmount = await website_setup_model_1.default.findOne({ blockReference: website_setup_1.blockReferences.enableFeatures });
            var giftWrapCharge;
            if (giftWrapAmount.blockValues.enableGiftWrap == true) {
                giftWrapCharge = Number(giftWrapAmount.blockValues.giftWrapCharge);
            }
            const updateCart = await cart_service_1.default.updateCartProductByCart({
                $and: [
                    { cartId: cart._id },
                    { variantId: variantId }
                ]
            }, { giftWrapAmount: giftWrapCharge });
            const cartUpdate = await cart_service_1.default.update(cart._id, { totalGiftWrapAmount: (cart.totalGiftWrapAmount + giftWrapCharge), totalAmount: (cart.totalAmount + giftWrapCharge) });
            return controller.sendSuccessResponse(res, {
                requestedData: cart,
                message: 'gift wrap added successfully!'
            });
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
            // let query = {
            //     $or: [
            //         { $and: [{ customerId: customer }, { countryId: country }] },
            //         { $and: [{ guestUserId: guestUser }, { countryId: country }] }
            //     ]
            // }
            let query = { _id: { $exists: true } };
            const userData = await res.locals.user;
            // query.status = '1';
            query.customerId = userData._id;
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
            return controller.sendSuccessResponse(res, {
                requestedData: cart,
                message: 'Your cart is ready!'
            });
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while get cart'
            });
        }
    }
    async addCoupon(req, res) {
    }
    async addWalletPoint(req, res) {
    }
}
exports.default = new CartController();
