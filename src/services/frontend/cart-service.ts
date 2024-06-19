import mongoose from 'mongoose';
import { FilterOptionsProps, pagination } from '../../components/pagination';
import CartOrderModel, { CartOrderProps } from '../../model/frontend/cart-order-model';
import CartOrderProductsModel from '../../model/frontend/cart-order-product-model';



class CartService {
    constructor() { }

    async findCart(data: any): Promise<CartOrderProps | null> {
        return CartOrderModel.findOne(data);
    }
    async create(data: any): Promise<CartOrderProps | null> {

        const cartData = await CartOrderModel.create(data);
        console.log("cartDatacartData", cartData);

        return cartData

    }

    async update(cartId: string, cartData: any): Promise<CartOrderProps | null> {
        const updatedCart = await CartOrderModel.findByIdAndUpdate(
            cartId,
            cartData,
            { new: true, useFindAndModify: false }
        );

        if (updatedCart) {
            const pipeline = [
                { $match: { _id: updatedCart._id } },
            ];

            const updatedCartWithValues = await CartOrderModel.aggregate(pipeline);

            return updatedCartWithValues[0];
        } else {
            return null;
        }
    }

    async updateCartProduct(_id: string, cartData: any): Promise<void | null> {
        console.log("========",_id,cartData);
        
        const updatedCart = await CartOrderProductsModel.findByIdAndUpdate(
            { _id: _id },
            cartData,
            { new: true, useFindAndModify: false }
        );
        console.log("updatedCart", updatedCart);

        if (updatedCart) {
            const pipeline = [
                { $match: { _id: updatedCart._id } },
            ];

            const updatedCartWithValues = await CartOrderProductsModel.aggregate(pipeline);

            return updatedCartWithValues[0];
        } else {
            return null;
        }
    }
}

export default new CartService();
