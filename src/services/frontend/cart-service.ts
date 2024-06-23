import mongoose from 'mongoose';
import { FilterOptionsProps, frontendPagination, pagination } from '../../components/pagination';
import CartOrderModel, { CartOrderProps } from '../../model/frontend/cart-order-model';
import CartOrderProductsModel, { CartOrderProductProps } from '../../model/frontend/cart-order-product-model';
import { multilanguageFieldsLookup, productVariantsLookupValues, replaceProductLookupValues, wishlistOfferBrandPopulation, wishlistOfferCategory, wishlistOfferProductPopulation } from '../../utils/config/wishlist-config';
import { productLookup } from '../../utils/config/product-config';
import { getLanguageValueFromSubdomain } from '../../utils/frontend/sub-domain';
import LanguagesModel from '../../model/admin/setup/language-model';
import commonService from './guest/common-service';



class CartService {

    private cartLookup: any;

    constructor() {
        this.cartLookup = {
            $lookup: {
                from: 'cartorderproducts', // Collection name of AttributeDetailModel
                localField: '_id', // Field in AttributesModel
                foreignField: 'cartId', // Field in AttributeDetailModel
                as: 'products',

            }
        };


    }
    async findCart(data: any): Promise<CartOrderProps | null> {

        const createdCartWithValues = await CartOrderModel.find(data);

        return createdCartWithValues[0];
    }
    async findCartPopulate(options: any): Promise<CartOrderProps[]> {

        const { query, skip, limit, sort, hostName } = frontendPagination(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        const languageData = await LanguagesModel.find().exec();
        const languageId = await getLanguageValueFromSubdomain(hostName, languageData)

        const { pipeline: offerPipeline, getOfferList, offerApplied } = await commonService.findOffers(0, hostName);


        const modifiedPipeline = {
            $lookup: {
                ...this.cartLookup.$lookup,
                pipeline: [
                    productLookup,
                    { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
                    productVariantsLookupValues,
                    { $unwind: { path: "$productDetails.variantDetails", preserveNullAndEmptyArrays: true } },
                    multilanguageFieldsLookup(languageId),
                    { $unwind: { path: "$productDetails.languageValues", preserveNullAndEmptyArrays: true } },
                    replaceProductLookupValues,
                    { $unset: "productDetails.languageValues" },

                ]
            }
        };

        const pipeline: any[] = [
            modifiedPipeline,
            { $match: query },

            { $sort: finalSort },

        ];

        if (offerApplied.product.products && offerApplied.product.products.length > 0) {
            const offerProduct = wishlistOfferProductPopulation(getOfferList, offerApplied.product)
            pipeline.push(offerProduct)

        } else if (offerApplied.brand.brands && offerApplied.brand.brands.length > 0) {
            const offerBrand = wishlistOfferBrandPopulation(getOfferList, offerApplied.brand)

            pipeline.push(offerBrand);
        } else if (offerApplied.category.categories && offerApplied.category.categories.length > 0) {
            const offerCategory = wishlistOfferCategory(getOfferList, offerApplied.category)
            pipeline.push(offerCategory);
        }

        if (skip) {
            pipeline.push({ $skip: skip });
        }

        if (limit) {
            pipeline.push({ $limit: limit });
        }

        const createdCartWithValues = await CartOrderModel.aggregate(pipeline);
        // console.log("createdCartWithValues", createdCartWithValues);

        return createdCartWithValues[0];
        // return CartOrderModel.findOne(data);
    }
    async create(data: any): Promise<CartOrderProps | null> {

        const cartData = await CartOrderModel.create(data);

        if (cartData) {
            const pipeline: any[] = [
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
                this.cartLookup
            ];

            const updatedCartWithValues = await CartOrderModel.aggregate(pipeline);

            return updatedCartWithValues[0];
        } else {
            return null;
        }
    }


    async findCartProduct(data: any): Promise<CartOrderProductProps | null> {

        const createdAttributeWithValues = await CartOrderProductsModel.findOne(data);

        return createdAttributeWithValues;

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

    async updateCartProductByCart(_id: any, cartData: any): Promise<CartOrderProductProps | null> {

        const updatedCart = await CartOrderProductsModel.findOneAndUpdate(
            _id,
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
