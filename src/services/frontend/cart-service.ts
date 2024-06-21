import mongoose from 'mongoose';
import { FilterOptionsProps, pagination } from '../../components/pagination';
import CartOrderModel, { CartOrderProps } from '../../model/frontend/cart-order-model';
import CartOrderProductsModel, { CartOrderProductProps } from '../../model/frontend/cart-order-product-model';



class CartService {

    private cartLookup: any;
    private multilanguageFieldsLookup: any;
    private project: any;

    constructor() {
        this.cartLookup = {
            $lookup: {
                from: 'CartOrderProducts', // Collection name of AttributeDetailModel
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
                    $ifNull: ['$attributeValues', []]
                },

            }
        };

    }
    async findCart(data: any): Promise<CartOrderProps | null> {
        return CartOrderModel.findOne(data);
    }
    async create(data: any): Promise<CartOrderProps | null> {

        const cartData = await CartOrderModel.create(data);

        if (cartData) {
            const pipeline = [
                { $match: { _id: cartData._id } },

            ];

            const createdCartWithValues = await CartOrderModel.aggregate(pipeline);

            return createdCartWithValues[0];
        } else {
            return null;
        }
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


    async findCartProduct(data: any): Promise<CartOrderProductProps | null> {



        const pipeline = [
            { $match: data },

        ];

        const createdAttributeWithValues = await CartOrderProductsModel.aggregate(pipeline);

        return createdAttributeWithValues[0];

    }

    async findAllCart(data: any): Promise<void[]> {
        return CartOrderProductsModel.find(data);
    }

    async createCartProduct(data: any): Promise<CartOrderProductProps | null> {

        const cartData = await CartOrderProductsModel.create(data);

        if (cartData) {
            const pipeline = [
                { $match: { _id: cartData._id } },

            ];

            const createdAttributeWithValues = await CartOrderProductsModel.aggregate(pipeline);

            return createdAttributeWithValues[0];
        } else {
            return null;
        }
    }

    async updateCartProduct(_id: string, cartData: any): Promise<CartOrderProductProps | null> {

        const updatedCart = await CartOrderProductsModel.findOneAndUpdate(
            { _id: _id },
            cartData,
            { new: true, useFindAndModify: false }
        );

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

    async updateCartProductByCart(_id: string, cartData: any): Promise<CartOrderProductProps | null> {

        const updatedCart = await CartOrderProductsModel.findOneAndUpdate(
            { cartId: _id },
            cartData,
            { new: true, useFindAndModify: false }
        );

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

    async destroy(cartId: string): Promise<CartOrderProps | null> {
        return CartOrderModel.findOneAndDelete({ _id: cartId });
    }

    async destroyCartProduct(id: string): Promise<CartOrderProductProps | null> {
        return CartOrderProductsModel.findOneAndDelete({ _id: id });
    }

    async destroyCartProduct1(data: any): Promise<CartOrderProductProps | null> {
        return CartOrderProductsModel.findOneAndDelete(data);
    }
}

export default new CartService();
