import mongoose, { ObjectId } from 'mongoose';
import { FilterOptionsProps, frontendPagination, pagination } from '../../components/pagination';
import CartOrderModel, { CartOrderProps } from '../../model/frontend/cart-order-model';
import CartOrderProductsModel, { CartOrderProductProps } from '../../model/frontend/cart-order-product-model';
import { multilanguageFieldsLookup, productVariantsLookupValues, replaceProductLookupValues, wishlistOfferBrandPopulation, wishlistOfferCategory, wishlistOfferProductPopulation, wishlistProductCategoryLookup } from '../../utils/config/wishlist-config';
import { productLookup, } from '../../utils/config/product-config';
import { getLanguageValueFromSubdomain } from '../../utils/frontend/sub-domain';
import LanguagesModel from '../../model/admin/setup/language-model';
import commonService from './guest/common-service';
import TaxsModel from '../../model/admin/setup/tax-model';
import CartOrdersModel from '../../model/frontend/cart-order-model';
import WebsiteSetupModel from '../../model/admin/setup/website-setup-model';
import { blockReferences } from '../../constants/website-setup';

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
        const { simple = '0' } = options;
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        const languageData = await LanguagesModel.find().exec();
        const languageId = await getLanguageValueFromSubdomain(hostName, languageData)


        // productVariantAttributesLookup
        const modifiedPipeline = {
            $lookup: {
                ...this.cartLookup.$lookup,
                pipeline: [
                    productLookup,
                    { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
                    productVariantsLookupValues("1"),
                    // attributePipeline,
                    { $unwind: { path: "$productDetails.variantDetails", preserveNullAndEmptyArrays: true } },
                    ...(simple === '0' ? [
                        wishlistProductCategoryLookup,
                        multilanguageFieldsLookup(languageId),
                        {
                            $unwind: {
                                path: "$productDetails.languageValues",
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        replaceProductLookupValues,
                        {
                            $unset: "productDetails.languageValues"
                        }
                    ] : [])
                ]
            }
        };

        const pipeline: any[] = [
            modifiedPipeline,
            { $match: query },
            { $sort: finalSort },
        ];
        const { pipeline: offerPipeline, getOfferList, offerApplied } = await commonService.findOffers(0, hostName);
        if (offerApplied.category.categories && offerApplied.category.categories.length > 0) {
            const offerCategory = wishlistOfferCategory(getOfferList, offerApplied.category)
            modifiedPipeline.$lookup.pipeline.push(offerCategory);
        }
        if (offerApplied.brand.brands && offerApplied.brand.brands.length > 0) {
            const offerBrand = wishlistOfferBrandPopulation(getOfferList, offerApplied.brand)
            modifiedPipeline.$lookup.pipeline.push(offerBrand);
        }
        if (offerApplied.product.products && offerApplied.product.products.length > 0) {
            const offerProduct = wishlistOfferProductPopulation(getOfferList, offerApplied.product)
            modifiedPipeline.$lookup.pipeline.push(offerProduct)
        }

        modifiedPipeline.$lookup.pipeline.push({
            $addFields: {
                'productDetails.offer': {
                    $cond: {
                        if: "$productDetails.categoryOffers",
                        then: "$productDetails.categoryOffers",
                        else: {
                            $cond: {
                                if: "$productDetails.brandOffers",
                                then: "$productDetails.brandOffers",
                                else: "$productDetails.productOffers"
                            }
                        }
                    }
                }
            }
        });
        modifiedPipeline.$lookup.pipeline.push({ $unset: "productDetails.categoryOffers" })
        modifiedPipeline.$lookup.pipeline.push({ $unset: "productDetails.brandOffers" })
        modifiedPipeline.$lookup.pipeline.push({ $unset: "productDetails.productOffers" })

        if (skip) {
            pipeline.push({ $skip: skip });
        }

        if (limit) {
            pipeline.push({ $limit: limit });
        }

        const createdCartWithValues = await CartOrderModel.aggregate(pipeline);

        return createdCartWithValues[0];
    }
    async createCart(data: any): Promise<CartOrderProps | null> {
        const cartData = await CartOrderModel.create(data);
        return cartData;
    }

    async updateCartPrice(options: { cartDetails: any; countryId: ObjectId; cartOrderProductUpdateOperations: any }): Promise<any> {
        const { cartDetails, countryId, cartOrderProductUpdateOperations } = options;

        const totalProductAmount = cartDetails.products.reduce((total: number, product: any) => {
            return total + product.productAmount;
        }, 0);
        const totalAmount = totalProductAmount + cartDetails.totalGiftWrapAmount + cartDetails.totalShippingAmount
        if (cartOrderProductUpdateOperations.length > 0 || totalAmount !== cartDetails.totalAmount) {
            await CartOrderProductsModel.bulkWrite(cartOrderProductUpdateOperations);
            const [aggregationResult] = await CartOrderProductsModel.aggregate([
                { $match: { cartId: cartDetails._id } },
                {
                    $group: {
                        _id: "$cartId",
                        totalProductAmount: { $sum: "$productAmount" },
                        totalProductOriginalPrice: { $sum: "$productOriginalPrice" },
                        totalDiscountAmount: { $sum: "$productDiscountAmount" },
                    }
                }
            ]);
            const taxDetails: any = await TaxsModel.findOne({ countryId: countryId })

            if (aggregationResult) {
                const { _id, ...restValues } = aggregationResult;
                if (restValues) {
                    let totalShippingAmount = cartDetails.totalShippingAmount
                    if (totalShippingAmount === 0) {
                        const shippingAmount: any = await WebsiteSetupModel.findOne({ blockReference: blockReferences.shipmentSettings, countryId: cartDetails.countryId });
                        const shippingCharge = ((shippingAmount && Number(shippingAmount?.blockValues?.shippingCharge) > 0) ? Number(shippingAmount?.blockValues?.shippingCharge) : 0);
                        totalShippingAmount = shippingCharge > 0 ? ((restValues.totalProductAmount) - (Number(shippingAmount.blockValues.freeShippingThreshold)) > 0 ? 0 : shippingCharge) : 0;
                    }
                    const updatedCartOrderValues = await CartOrdersModel.findOneAndUpdate(cartDetails._id, {
                        ...restValues,
                        totalShippingAmount,
                        totalAmount: restValues.totalProductAmount + cartDetails.totalGiftWrapAmount + totalShippingAmount,
                        totalTaxAmount: (taxDetails && Number(taxDetails.taxPercentage) > 0) ? ((Number(restValues.totalProductAmount) * Number(taxDetails.taxPercentage)) / (100 + Number(taxDetails.taxPercentage))).toFixed(2) : 0,
                        // totalTaxAmount: (taxDetails && Number(taxDetails?.taxPercentage) > 0) ? ((Number(taxDetails.taxPercentage) / 100) * Number(restValues.totalProductAmount)).toFixed(2) : 0
                    });
                    return updatedCartOrderValues;
                }
            }
        } else { // when pickup with payment gatway, then return back , the shipping amount is zero
            let totalShippingAmount = cartDetails.totalShippingAmount
            if (totalShippingAmount === 0) {
                const shippingAmount: any = await WebsiteSetupModel.findOne({ blockReference: blockReferences.shipmentSettings, countryId: cartDetails.countryId });
                const shippingCharge = ((shippingAmount && Number(shippingAmount?.blockValues?.shippingCharge) > 0) ? Number(shippingAmount?.blockValues?.shippingCharge) : 0);
                totalShippingAmount = shippingCharge > 0 ? ((cartDetails.totalProductAmount) - (Number(shippingAmount.blockValues.freeShippingThreshold)) > 0 ? 0 : shippingCharge) : 0;
                if (totalShippingAmount > 0) {
                    const updatedCartOrderValues = await CartOrdersModel.findOneAndUpdate(cartDetails._id, {
                        ...totalShippingAmount,
                        pickupStoreId: null,
                        couponId: null,
                        totalShippingAmount,
                        totalAmount: cartDetails.totalAmount + totalShippingAmount,
                    });
                    return updatedCartOrderValues;
                }
            }
        }
    }

    async findCartProduct(data: any): Promise<CartOrderProductProps | null> {
        const createdAttributeWithValues = await CartOrderProductsModel.findOne(data);
        return createdAttributeWithValues;
    }

    async createCartProduct(data: any): Promise<CartOrderProductProps | null> {
        const cartData = await CartOrderProductsModel.create(data);
        return cartData
    }

    async updateCartProduct(_id: string, cartData: any): Promise<CartOrderProductProps | null> {
        const updatedCart = await CartOrderProductsModel.findOneAndUpdate(
            { _id: _id },
            cartData,
            { new: true, useFindAndModify: false }
        );
        return updatedCart;
    }

    async updateCartProductByCart(_id: any, cartData: any): Promise<CartOrderProductProps | null> {
        const updatedCart = await CartOrderProductsModel.findOneAndUpdate(
            _id,
            cartData,
            { new: true, useFindAndModify: false }
        );
        return updatedCart;
    }

    async findOneCart(query: any): Promise<CartOrderProps | null> {
        return CartOrderModel.findOne(query);
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
