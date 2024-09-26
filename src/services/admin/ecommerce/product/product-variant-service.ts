import { FilterOptionsProps, pagination } from '../../../../components/pagination';

import { ProductsProps } from '../../../../utils/types/products';
import { UserDataProps } from '../../../../utils/types/common';
import { getCountryId, getCountryIdWithSuperAdmin, slugify, } from '../../../../utils/helpers';

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
import CountryModel from '../../../../model/admin/setup/country-model';
import SeoPageModel from '../../../../model/admin/seo-page-model';
import { Types } from 'mongoose';

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
                variantImageUrl: 1,
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
    async find(query: any): Promise<ProductVariantsProps | null> {
        const variantData = await ProductVariantModel.findOne(query)
        if (variantData) {
            return variantData
        }
        else {
            return null
        }
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
            countryId: productVariants.countryId || await getCountryIdWithSuperAdmin(userData),
            variantSku: productVariants.variantSku,
            price: productVariants.price,
            discountPrice: ((productVariants.discountPrice === null || (productVariants as any).discountPrice === 'null') ? 0 : Number(productVariants.discountPrice)),
            quantity: productVariants.quantity,
            isDefault: Number(productVariants.isDefault),
            variantDescription: productVariants.variantDescription,
            cartMinQuantity: productVariants.cartMinQuantity,
            cartMaxQuantity: productVariants.cartMaxQuantity,
            hsn: productVariants.hsn,
            mpn: productVariants.mpn,
            barcode: productVariants.barcode,
            isExcel: productVariants?.isExcel
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

        return updatedProductVariant;

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
        try {
            if (!productdata._id) throw new Error('Product ID is required.');

            const existingVariants = await ProductVariantModel.find({ productId: productdata._id });

            const variantPromises = variantDetails.map(async (variantDetail: any) => {
                if (existingVariants) {
                    const variantIDsToRemove = existingVariants
                        .filter(entry => !variantDetail.productVariants?.some((data: any) => data?._id?.toString() === entry._id.toString()))
                        .map(entry => entry._id);

                    await GeneralService.deleteParentModel([
                        { variantId: variantIDsToRemove, model: ProductVariantAttributesModel },
                        { variantId: variantIDsToRemove, model: SeoPagesModel },
                        { variantId: variantIDsToRemove, model: ProductSpecificationModel }
                    ]);
                }

                if (variantDetail.productVariants) {
                    const productVariantPromises = variantDetail.productVariants.map(async (data: any, index: number) => {
                        const existingVariant = existingVariants.find((variant: any) => variant._id.toString() === data._id.toString());
                        let productVariantData: any;

                        if (existingVariant) {
                            productVariantData = await ProductVariantModel.findByIdAndUpdate(existingVariant._id, { ...data, productId: productdata._id }, { new: true });
                        } else {
                            const countryData = await CountryModel.findById(variantDetail.countryId);
                            const slug = slugify(`${productdata.productTitle}-${countryData?.countryShortTitle}-${index + 1}`);
                            productVariantData = await this.create(productdata._id, { ...data, slug, countryId: variantDetail.countryId }, userData);
                        }

                        if (productVariantData) {
                            await this.handleVariantAttributes(data, productdata, variantDetail, index);
                            await this.handleProductSpecifications(data, productdata, variantDetail, index);
                            await this.handleSeoData(data, productdata, productVariantData);
                        }
                    });

                    await Promise.all(productVariantPromises);
                }
            });

            await Promise.all(variantPromises);

            return await ProductVariantModel.find({ productId: productdata._id });

        } catch (error) {
            console.error('Error in Product Variant Service:', error);
            throw new Error('Failed to update product variants.');
        }
    }

    private async handleVariantAttributes(data: any, productdata: ProductsProps, variantDetail: any, index: number) {
        if (data.productVariantAttributes && data.productVariantAttributes.length > 0) {
            const bulkOps = data.productVariantAttributes
                .filter((attr: any) => attr.attributeId && attr.attributeDetailId)
                .map((attr: any) => ({
                    updateOne: {
                        filter: { _id: new Types.ObjectId(attr._id) },
                        update: {
                            $set: {
                                variantId: variantDetail.productVariants[index]._id,
                                productId: productdata._id,
                                attributeId: attr.attributeId,
                                attributeDetailId: attr.attributeDetailId
                            }
                        },
                        upsert: true
                    }
                }));

            if (bulkOps.length > 0) {
                await ProductVariantAttributesModel.bulkWrite(bulkOps);
            }
        }
    }

    private async handleProductSpecifications(data: any, productdata: ProductsProps, variantDetail: any, index: number) {
        if (data.productSpecification && data.productSpecification.length > 0) {
            const bulkOps = data.productSpecification
                .filter((spec: any) => spec.specificationId && spec.specificationDetailId)
                .map((spec: any) => ({
                    updateOne: {
                        filter: { _id: new Types.ObjectId(spec._id) },
                        update: {
                            $set: {
                                variantId: variantDetail.productVariants[index]._id,
                                productId: productdata._id,
                                specificationId: spec.specificationId,
                                specificationDetailId: spec.specificationDetailId
                            }
                        },
                        upsert: true
                    }
                }));

            if (bulkOps.length > 0) {
                await ProductSpecificationModel.bulkWrite(bulkOps);
            }
        }
    }

    private async handleSeoData(data: any, productdata: ProductsProps, productVariantData: any) {
        const seoData = data.productSeo;

        if (seoData && (seoData.metaTitle || seoData.metaKeywords || seoData.metaDescription || seoData.ogTitle || seoData.ogDescription || seoData.twitterTitle || seoData.twitterDescription)) {
            await SeoPageModel.updateOne(
                { _id: seoData._id ? new Types.ObjectId(seoData._id) : new Types.ObjectId() },
                {
                    $set: {
                        pageId: productdata._id,
                        pageReferenceId: productVariantData._id || null,
                        page: seoPage.ecommerce.products,
                        metaTitle: seoData.metaTitle,
                        metaKeywords: seoData.metaKeywords,
                        metaDescription: seoData.metaDescription,
                        ogTitle: seoData.ogTitle,
                        ogDescription: seoData.ogDescription,
                        twitterTitle: seoData.twitterTitle,
                        twitterDescription: seoData.twitterDescription
                    }
                },
                { upsert: true }
            );
        }
    }

}

export default new ProductVariantService();
