import { FilterOptionsProps, pagination } from '../../../../components/pagination';

import { ProductsProps } from '../../../../utils/types/products';
import { UserDataProps } from '../../../../utils/types/common';
import { getCountryId, } from '../../../../utils/helpers';

import ProductVariantModel, { ProductVariantsProps } from '../../../../model/admin/ecommerce/product/product-variants-model';
import ProductSpecificationModel from '../../../../model/admin/ecommerce/product/product-specification-model';
import ProductSpecificationService from '../../../../services/admin/ecommerce/product/product-specification-service';
import SeoPagesModel from '../../../../model/admin/seo-page-model';
import ProductVariantAttributesModel from '../../../../model/admin/ecommerce/product/product-variant-attribute-model';
import AttributesModel from '../../../../model/admin/ecommerce/attribute-model';

import GeneralService from '../../general-service';
import SeoPageService from '../../seo-page-service';
import ProductVariantAttributeService from '../../../../services/admin/ecommerce/product/product-variant-attributes-service';
import { seoPage } from '../../../../constants/admin/seo-page';

class ProductVariantService {

    private lookup: any;
    private project: any;
    constructor() {

        this.project = {
            $project: {
                _id: 1,
                productId: 1,
                variantSku: 1,
                countryId: 1,
                price: 1,
                quantity: 1,
                discountPrice: 1,
                isDefualt: 1,
                hsn: 1,
                mpn: 1,
                barcode: 1,
                extraProductTitle: 1,
                variantDescription: 1,
                cartMinQuantity: 1,
                cartMaxQuantity: 1,
                status: 1,
                createdAt: 1,
            }
        }
    }

    async findAll(options: FilterOptionsProps = {}): Promise<ProductVariantsProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);

        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        let pipeline: any[] = [
            { $match: query },
            { $skip: skip },
            { $limit: limit },
            { $sort: finalSort },

            this.project
        ];

        return ProductVariantModel.aggregate(pipeline).exec();
    }
    async find(query: any): Promise<ProductVariantsProps[]> {

        const variantData = await ProductVariantModel.find(query)
        return variantData
    }
    async findVariant(productId: string, id: string): Promise<ProductVariantsProps[]> {

        const variantData = await ProductVariantModel.find({
            $and: [
                { _id: id },
                { productId: productId }
            ]
        })
        return variantData
    }
    async getTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await ProductVariantModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of productVariants');
        }
    }

    async checkDuplication(countryId: string, data: any, slug: string) {
        const condition1 = { variantSku: data.variantSku };
        const condition2 = { countryId: countryId };
        const condition3 = { slug: slug };

        const query = {
            $and: [
                condition1,
                condition2,
                condition3
            ]
        };
        const variantData = await ProductVariantModel.findOne(query)
        if (variantData) {
            return variantData
        } else {
            return null;
        }
    }

    async create(productId: string, productVariants: ProductVariantsProps, userData: UserDataProps) {

        const productVariantData = {
            productId: productId,
            slug: productVariants.slug,
            extraProductTitle: productVariants.extraProductTitle,
            countryId: productVariants.countryId || getCountryId(userData),
            variantSku: productVariants.variantSku,
            price: productVariants.price,
            discountPrice: productVariants.discountPrice,
            quantity: productVariants.quantity,
            isDefault: Number(productVariants.isDefault),
            variantDescription: productVariants.variantDescription,
            cartMinQuantity: productVariants.cartMinQuantity,
            cartMaxQuantity: productVariants.cartMaxQuantity,
            hsn: productVariants.hsn,
            mpn: productVariants.mpn,
            barcode: productVariants.barcode,

        }

        const createdProductVariant = await ProductVariantModel.create(productVariantData);
        if (createdProductVariant) {
            const pipeline = [
                { $match: { _id: createdProductVariant._id } },
                // this.lookup,
                this.project
            ];

            const createdProductVariantWithValues = await ProductVariantModel.aggregate(pipeline);

            return createdProductVariantWithValues[0];
        } 
        // else {
        //     return null;
        // }
    }


    async findOne(productVariantId: string): Promise<ProductVariantsProps | null> {
        if (productVariantId) {
            const pipeline = [
                { $match: { _id: productVariantId } },
                this.lookup,
                this.project
            ];

            const productVariantDataWithValues = await ProductVariantModel.aggregate(pipeline);

            return productVariantDataWithValues[0];
        } else {
            return null;
        }
    }

    async update(productVariantId: string, productVariantData: any): Promise<ProductVariantsProps | null> {
        const updatedProductVariant = await ProductVariantModel.findByIdAndUpdate(
            productVariantId,
            productVariantData,
            { new: true, useFindAndModify: false }
        );

        if (updatedProductVariant) {
            const pipeline = [
                { $match: { _id: updatedProductVariant._id } },
                // this.lookup,
                this.project
            ];

            const updatedProductVariantWithValues = await ProductVariantModel.aggregate(pipeline);

            return updatedProductVariantWithValues[0];
        } else {
            return null;
        }
    }

    async updateVariant(productId: string, productData: any): Promise<ProductVariantsProps | null> {

        const updatedVariant = await ProductVariantModel.updateMany({ productId: productId }, productData, { new: true, useFindAndModify: false });

        if (updatedVariant) {
            const pipeline = [
                this.project
                // { $match: { _id: updatedVariant._id } },
            ];

            const updatedCategoryWithValues = await ProductVariantModel.aggregate(pipeline);

            return updatedCategoryWithValues[0];
        } else {
            return null;
        }

    }

    async destroy(productVariantId: string): Promise<ProductVariantsProps | null> {
        return ProductVariantModel.findOneAndDelete({ _id: productVariantId });
    }

    async variantService(productdata: ProductsProps, variantDetails: any, userData: UserDataProps): Promise<ProductVariantsProps[]> {
        console.log("variantDetailsvariantDetailsvariantDetails",variantDetails);
        
        try {
            if (productdata._id) {
                const existingEntries = await ProductVariantModel.find({ productId: productdata._id });
                await variantDetails.map(async (variantDetail: any) => {
                    if (existingEntries) {
                        const variantIDsToRemove = existingEntries
                            .filter(entry => !variantDetail.productVariants?.some((data: any) => data?._id?.toString() === entry._id.toString()))
                            .map(entry => entry._id);

                        const deleteVariant = await ProductVariantModel.deleteMany({ productId: productdata._id, _id: { $in: variantIDsToRemove } });
                        console.log("deleteVariant", deleteVariant);

                        if (deleteVariant) {
                            await GeneralService.deleteParentModel([
                                {
                                    variantId: variantIDsToRemove,
                                    model: ProductVariantAttributesModel
                                },
                                {
                                    variantId: variantIDsToRemove,
                                    model: SeoPagesModel
                                },
                                {
                                    variantId: variantIDsToRemove,
                                    model: ProductSpecificationModel
                                },
                            ]);

                        }
                        // })

                    }
                    if (variantDetail.productVariants) {
                        const variantPromises = await Promise.all(variantDetail.productVariants.map(async (data: any, index: number) => {
                            // if (data._id != '') {
                                const existingEntry = await ProductVariantModel.findOne({ _id: data._id });
                                console.log("existingEntry", existingEntry);

                                if (existingEntry) {
                                    // Update existing document
                                    const productVariantData = await ProductVariantModel.findByIdAndUpdate(existingEntry._id, { ...data, productId: productdata._id });
                                    if (productVariantData && productdata.isVariant === 1) {
                                        console.log("variantDetail.productVariants", variantDetail.productVariants[index]._id);

                                        // if (data.productVariantAttributes && data.productVariantAttributes.length > 0) {
                                        await ProductVariantAttributeService.variantAttributeService(productdata._id, data.productVariantAttributes, variantDetail.productVariants[index]._id)
                                        // }
                                        // if (data.productSeo && data.productSeo.length > 0) {
                                        await SeoPageService.seoPageService(productdata._id, data.productSeo, seoPage.ecommerce.products, variantDetail.productVariants[index]._id)
                                        // }
                                        // if (data.productSpecification && data.productSpecification.length > 0) {
                                        await ProductSpecificationService.productSpecificationService(productdata._id, data.productSpecification, variantDetail.productVariants[index]._id)
                                        // }
                                    }else{

                                        await GeneralService.deleteParentModel([
                                            {
                                                variantId:  variantDetail.productVariants[index]._id,
                                                model: ProductVariantAttributesModel
                                            },
                                            {
                                                variantId:  variantDetail.productVariants[index]._id,
                                                model: SeoPagesModel
                                            },
                                            {
                                                variantId:  variantDetail.productVariants[index]._id,
                                                model: ProductSpecificationModel
                                            },
                                        ]);
                                    }
                                }
                             else {
                                console.log("haaai");
                                
                                var slugData
                                if (data.extraProductTitle) {
                                    slugData = productdata.slug + "-" + data.extraProductTitle 
                                }
                                else {
                                    slugData = productdata.slug 
                                }
                                // Create new document
                                const variantData = await this.create(productdata._id, { countryId: variantDetail.countryId, ...data, slug: slugData }, userData);
                               console.log("variantData",variantData);
                               
                                if (variantData) {
                                    if (variantData) {
                                        console.log("variantDetail.productVariants123", variantDetail.productVariants[index]._id);

                                        // if (data.productVariantAttributes && data.productVariantAttributes.length > 0) {
                                        await ProductVariantAttributeService.variantAttributeService(productdata._id, data.productVariantAttributes, variantData._id)
                                        // }
                                        // if (data.productSeo && data.productSeo.length > 0) {
                                        await SeoPageService.seoPageService(productdata._id, data.productSeo, seoPage.ecommerce.products, variantDetail.productVariants[index]._id)
                                        // }
                                        // if (data.productSpecification && data.productSpecification.length > 0) {
                                        await ProductSpecificationService.productSpecificationService(productdata._id, data.productSpecification, variantData._id)
                                        // }
                                    }
                                }
                            }
                        }));

                        await Promise.all(variantPromises);
                    }
                })
                return await ProductVariantModel.find({ productId: productdata._id });
            } else {
                throw 'Could not find product Id';
            }

        } catch (error) {
            console.error('Error in Product Variant service:', error);
            throw error;
        }
    }
}

export default new ProductVariantService();
