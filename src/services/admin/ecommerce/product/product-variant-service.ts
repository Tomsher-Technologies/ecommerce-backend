import { FilterOptionsProps, pagination } from '../../../../components/pagination';

import ProductVariantModel, { ProductVariantsProps } from '../../../../model/admin/ecommerce/product/product-variants-model';
import ProductVariantAttributeService from '../../../../services/admin/ecommerce/product/product-variant-attributes-service';
import ProductSeoService from '../../../../services/admin/ecommerce/product/product-seo-service';
import ProductSpecificationService from '../../../../services/admin/ecommerce/product/product-specification-service';
import generalService from '../../general-service';
import ProductSeoModel from '../../../../model/admin/ecommerce/product/product-seo-model';
import ProductVariantAttributesModel from '../../../../model/admin/ecommerce/product/product-variant-attribute-model';
import ProductSpecificationModel from '../../../../model/admin/ecommerce/product/product-specification-model';

class ProductVariantService {

    private lookup: any;
    private project: any;
    constructor() {

        this.project = {
            $project: {
                _id: 1,
                productId: 1,
                sku: 1,
                countryId: 1,
                price: 1,
                quantity: 1,
                discountPrice: 1,
                isDefualt: 1,
                hsn: 1,
                mpn: 1,
                barcode: 1,
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
    async find(productId: string): Promise<ProductVariantsProps[]> {

        const variantData = await ProductVariantModel.find({ productId: productId })
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

    async create(productId: string, productVariants: any) {
        const productVariantData = {
            productId: productId,
            slug: productVariants.slug,
            countryId: productVariants.countryId,
            variantSku: productVariants.productVariants.sku,
            price: productVariants.productVariants.price,
            description: productVariants.productVariants.description,
            discountPrice: productVariants.productVariants.discountPrice,
            quantity: productVariants.productVariants.quantity,
            isDefault: productVariants.productVariants.isDefault,
            variantDescription: productVariants.productVariants.variantDescription,
            cartMinQuantity: productVariants.productVariants.cartMinQuantity,
            cartMaxQuantity: productVariants.productVariants.cartMaxQuantity,

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
        } else {
            return null;
        }
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

    async variantService(productId: string | null, variantDetails: any): Promise<ProductVariantsProps[]> {
        try {
            if (productId) {
                const existingEntries = await ProductVariantModel.find({ productId: productId });
                if (existingEntries) {
                    const variantIDsToRemove = existingEntries
                        .filter(entry => !variantDetails?.some((data: any) => data?._id?.toString() === entry._id.toString()))
                        .map(entry => entry._id);

                    const deleteVariant = await ProductVariantModel.deleteMany({ productId: productId, _id: { $in: variantIDsToRemove } });
                    console.log("**************",deleteVariant);
                    
                    if(deleteVariant){
                        console.log("test",variantIDsToRemove);
                        
                        await generalService.deleteParentModel([
                            {
                                variantId: variantIDsToRemove,
                                model: ProductVariantAttributesModel
                            },
                            {
                                variantId: variantIDsToRemove,
                                model: ProductSeoModel
                            },
                            {
                                variantId: variantIDsToRemove,
                                model: ProductSpecificationModel
                            },
                        ]);
        
                    }
                }
                if (variantDetails) {
                    const variantPromises = await Promise.all(variantDetails.map(async (data: any) => {
                        const existingEntry = await ProductVariantModel.findOne({ _id: data._id });
                        if (existingEntry) {
                            // Update existing document
                            const productVariantData = await ProductVariantModel.findByIdAndUpdate(existingEntry._id, { ...data, productId: productId });
                            if (productVariantData) {
                                // if (data.productVariantAtrributes && data.productVariantAtrributes.length > 0) {
                                await ProductVariantAttributeService.variantAttributeService(productId, { ...data.productVariantAtrributes })
                                // }
                                // if (data.productSeo && data.productSeo.length > 0) {
                                await ProductSeoService.productSeoService(productId, { ...data.productSeo })
                                // }
                                // if (data.productSpecification && data.productSpecification.length > 0) {
                                await ProductSpecificationService.productSpecificationService(productId, { ...data.productSpecification })
                                // }
                            }
                        } else {
                            // Create new document
                            await ProductVariantModel.create({ ...data, productId: productId });
                        }
                    }));

                    await Promise.all(variantPromises);
                }
                return await ProductVariantModel.find({ productId: productId });
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
