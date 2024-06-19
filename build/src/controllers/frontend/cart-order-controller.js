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
const mongoose_1 = __importDefault(require("mongoose"));
const common_service_1 = __importDefault(require("../../services/frontend/guest/common-service"));
const cart_service_2 = __importDefault(require("../../services/frontend/cart-service"));
const cart_order_product_model_1 = __importDefault(require("../../model/frontend/cart-order-product-model"));
const controller = new base_controller_1.default();
class CartController extends base_controller_1.default {
    async createCartOrder(req, res) {
        try {
            const validatedData = cart_schema_1.cartSchema.safeParse(req.body);
            const user = res.locals.user;
            if (validatedData.success) {
                const { shippingStatus, shipmentGatwayId, paymentGatwayId, pickupStoreId, orderComments, paymentMethod, paymentMethodCharge, rewardPoints, totalReturnedProduct, totalDiscountAmount, totalShippingAmount, totalCouponAmount, totalWalletAmount, totalTaxAmount, totalOrderAmount } = validatedData.data;
                let customer, guestUser;
                let country = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
                let newCartOrder;
                const isObjectId = /^[0-9a-fA-F]{24}$/.test(user);
                if (isObjectId) {
                    customer = user;
                }
                else {
                    guestUser = user;
                }
                if (customer || guestUser) {
                    const existingProduct = await cart_service_1.default.findCart({
                        $or: [
                            { customerId: customer },
                            { guestUserId: guestUser }
                        ]
                    });
                    const cartOrderData = {
                        customerId: customer,
                        guestUserId: guestUser,
                        countryId: country,
                        cartStatus: '1',
                        orderStatus: '0',
                        orderStatusAt: new Date(), // Assuming orderStatusAt is set at creation time
                        shippingStatus,
                        shipmentGatwayId,
                        paymentGatwayId,
                        pickupStoreId,
                        orderComments,
                        paymentMethod,
                        paymentMethodCharge,
                        rewardPoints,
                        totalReturnedProduct,
                        totalDiscountAmount,
                        totalShippingAmount,
                        totalCouponAmount,
                        totalWalletAmount,
                        totalTaxAmount,
                        totalOrderAmount,
                        createdBy: user._id, // Assuming user._id is the creator of this entry
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };
                    if (existingProduct) {
                        newCartOrder = await cart_service_2.default.update(existingProduct._id, cartOrderData);
                        if (newCartOrder) {
                            console.log("hfghgfhfgh", newCartOrder._id, validatedData);
                            const { productId, variantId, quantity, sku, slug, orderStatus } = req.body;
                            const existingProduct = await cart_order_product_model_1.default.find({
                                $and: [
                                    { cartId: newCartOrder._id },
                                    { productId: new mongoose_1.default.Types.ObjectId(productId) },
                                    { variantId: new mongoose_1.default.Types.ObjectId(variantId) }
                                ]
                            });
                            console.log("newCartOrderProduct", newCartOrder._id, productId, "llllll", existingProduct);
                            const cartOrderProductData = {
                                cartId: newCartOrder._id,
                                customerId: customer,
                                productId,
                                variantId,
                                quantity: existingProduct[0].quantity ? existingProduct[0].quantity + 1 : quantity,
                                sku,
                                slug,
                                orderStatus,
                                createdAt: new Date(),
                                updatedAt: new Date()
                            };
                            let newCartOrderProduct;
                            if (existingProduct) {
                                newCartOrderProduct = await cart_service_1.default.updateCartProduct(existingProduct[0]._id, cartOrderProductData);
                                console.log("cartOrderProductData", cartOrderProductData);
                            }
                            else {
                                newCartOrderProduct = await cart_order_product_model_1.default.create(cartOrderProductData);
                            }
                            if (newCartOrderProduct) {
                                console.log("newCartOrderProduct", newCartOrderProduct);
                            }
                            // Rest of your code
                        }
                    }
                    else {
                        newCartOrder = await cart_service_2.default.create(cartOrderData);
                    }
                    if (newCartOrder) {
                        // Adjust response structure as needed
                        return controller.sendSuccessResponse(res, {
                            requestedData: {
                                newCartOrder,
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
            // Handle specific validation errors or general errors
            if (error && error.errors && error.errors.someSpecificField && error.errors.someSpecificField.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        someSpecificField: error.errors.someSpecificField.properties.message
                    }
                });
            }
            // Handle other errors
            return controller.sendErrorResponse(res, 200, {
                message: error.message || 'Some error occurred while creating cart order',
            });
        }
    }
    async createCartProduct(cartId, data) {
        try {
            console.log("data", data);
            const { productId, variantId, quantity, sku, slug, orderStatus } = data;
            const cartOrderProductData = {
                cartId: cartId,
                productId,
                variantId,
                quantity,
                sku,
                slug,
                orderStatus,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const newCartOrderProduct = await cart_order_product_model_1.default.create(cartOrderProductData);
            if (newCartOrderProduct) {
                return newCartOrderProduct;
            }
        }
        catch (error) {
            console.error("Error creating cart order product:", error);
            throw error; // Re-throw error to be handled by calling function
        }
    }
}
exports.default = new CartController();
