"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cart_order_model_1 = __importDefault(require("../../model/frontend/cart-order-model"));
const cart_order_product_model_1 = __importDefault(require("../../model/frontend/cart-order-product-model"));
class CartService {
    constructor() { }
    async findCart(data) {
        return cart_order_model_1.default.findOne(data);
    }
    async create(data) {
        const cartData = await cart_order_model_1.default.create(data);
        console.log("cartDatacartData", cartData);
        return cartData;
    }
    async update(cartId, cartData) {
        const updatedCart = await cart_order_model_1.default.findByIdAndUpdate(cartId, cartData, { new: true, useFindAndModify: false });
        if (updatedCart) {
            const pipeline = [
                { $match: { _id: updatedCart._id } },
            ];
            const updatedCartWithValues = await cart_order_model_1.default.aggregate(pipeline);
            return updatedCartWithValues[0];
        }
        else {
            return null;
        }
    }
    async updateCartProduct(_id, cartData) {
        console.log("========", _id, cartData);
        const updatedCart = await cart_order_product_model_1.default.findByIdAndUpdate({ _id: _id }, cartData, { new: true, useFindAndModify: false });
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
}
exports.default = new CartService();
