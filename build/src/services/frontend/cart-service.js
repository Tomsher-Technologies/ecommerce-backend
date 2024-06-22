"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cart_order_model_1 = __importDefault(require("../../model/frontend/cart-order-model"));
const cart_order_product_model_1 = __importDefault(require("../../model/frontend/cart-order-product-model"));
class CartService {
    constructor() {
        this.cartLookup = {
            $lookup: {
                from: 'cartorderproducts', // Collection name of AttributeDetailModel
                localField: '_id', // Field in AttributesModel
                foreignField: 'cartId', // Field in AttributeDetailModel
                as: 'products'
            }
        };
        this.project = {
            $project: {
                customerId: 1,
                guestUserId: 1,
                countryId: 1,
                cartStatus: 1,
                orderStatus: 1,
                shippingStatus: 1,
                shipmentGatwayId: 1,
                paymentGatwayId: 1,
                pickupStoreId: 1,
                orderComments: 1,
                paymentMethod: 1,
                paymentMethodCharge: 1,
                rewardPoints: 1,
                totalProductAmount: 1,
                totalReturnedProduct: 1,
                totalDiscountAmount: 1,
                totalShippingAmount: 1,
                totalCouponAmount: 1,
                totalWalletAmount: 1,
                totalTaxAmount: 1,
                totalAmount: 1,
                products: {
                    $ifNull: ['$products', []]
                },
            }
        };
    }
    async findCart(data) {
        const createdCartWithValues = await cart_order_model_1.default.find(data);
        return createdCartWithValues[0];
    }
    async findCartPopulate(data) {
        const pipeline = [
            { $match: data },
            this.cartLookup,
            this.project
        ];
        const createdCartWithValues = await cart_order_model_1.default.aggregate(pipeline);
        console.log(createdCartWithValues);
        return createdCartWithValues[0];
        // return CartOrderModel.findOne(data);
    }
    async create(data) {
        const cartData = await cart_order_model_1.default.create(data);
        if (cartData) {
            const pipeline = [
                { $match: { _id: cartData._id } },
            ];
            const createdCartWithValues = await cart_order_model_1.default.aggregate(pipeline);
            return createdCartWithValues[0];
        }
        else {
            return null;
        }
    }
    async update(cartId, cartData) {
        const updatedCart = await cart_order_model_1.default.findByIdAndUpdate(cartId, cartData, { new: true, useFindAndModify: false });
        if (updatedCart) {
            const pipeline = [
                { $match: { _id: updatedCart._id } },
                this.cartLookup
            ];
            const updatedCartWithValues = await cart_order_model_1.default.aggregate(pipeline);
            return updatedCartWithValues[0];
        }
        else {
            return null;
        }
    }
    async findCartProduct(data) {
        const createdAttributeWithValues = await cart_order_product_model_1.default.findOne(data);
        return createdAttributeWithValues;
    }
    async findAllCart(data) {
        return cart_order_product_model_1.default.find(data);
    }
    async createCartProduct(data) {
        const cartData = await cart_order_product_model_1.default.create(data);
        if (cartData) {
            const pipeline = [
                { $match: { _id: cartData._id } },
            ];
            const createdAttributeWithValues = await cart_order_product_model_1.default.aggregate(pipeline);
            return createdAttributeWithValues[0];
        }
        else {
            return null;
        }
    }
    async updateCartProduct(_id, cartData) {
        const updatedCart = await cart_order_product_model_1.default.findOneAndUpdate({ _id: _id }, cartData, { new: true, useFindAndModify: false });
        if (updatedCart) {
            const pipeline = [
                { $match: { _id: updatedCart._id } },
            ];
            const updatedCartWithValues = await cart_order_product_model_1.default.aggregate(pipeline);
            return updatedCartWithValues[0];
        }
        else {
            return null;
        }
    }
    async updateCartProductByCart(_id, cartData) {
        const updatedCart = await cart_order_product_model_1.default.findOneAndUpdate(_id, cartData, { new: true, useFindAndModify: false });
        console.log("updatedCart", updatedCart);
        if (updatedCart) {
            const pipeline = [
                { $match: { _id: updatedCart._id } },
            ];
            const updatedCartWithValues = await cart_order_product_model_1.default.aggregate(pipeline);
            return updatedCartWithValues[0];
        }
        else {
            return null;
        }
    }
    async destroy(cartId) {
        return cart_order_model_1.default.findOneAndDelete({ _id: cartId });
    }
    async destroyCartProduct(id) {
        return cart_order_product_model_1.default.findOneAndDelete({ _id: id });
    }
    async destroyCartProduct1(data) {
        return cart_order_product_model_1.default.findOneAndDelete(data);
    }
}
exports.default = new CartService();
