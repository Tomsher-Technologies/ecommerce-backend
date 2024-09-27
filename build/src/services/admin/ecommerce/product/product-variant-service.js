"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../../components/pagination");
const helpers_1 = require("../../../../utils/helpers");
const product_variants_model_1 = __importDefault(require("../../../../model/admin/ecommerce/product/product-variants-model"));
const product_specification_model_1 = __importDefault(require("../../../../model/admin/ecommerce/product/product-specification-model"));
const seo_page_model_1 = __importDefault(require("../../../../model/admin/seo-page-model"));
const product_variant_attribute_model_1 = __importDefault(require("../../../../model/admin/ecommerce/product/product-variant-attribute-model"));
const general_service_1 = __importDefault(require("../../general-service"));
const seo_page_1 = require("../../../../constants/admin/seo-page");
const country_model_1 = __importDefault(require("../../../../model/admin/setup/country-model"));
const seo_page_model_2 = __importDefault(require("../../../../model/admin/seo-page-model"));
const mongoose_1 = require("mongoose");
class ProductVariantService {
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
        };
    }
    async findAll(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        let pipeline = [
            { $match: query },
            { $skip: skip },
            { $limit: limit },
            { $sort: finalSort },
            this.project
        ];
        return product_variants_model_1.default.aggregate(pipeline).exec();
    }
    async find(query) {
        const variantData = await product_variants_model_1.default.findOne(query);
        if (variantData) {
            return variantData;
        }
        else {
            return null;
        }
    }
    async findVariant(productId, id) {
        const variantData = await product_variants_model_1.default.find({
            $and: [
                { _id: id },
                { productId: productId }
            ]
        });
        return variantData;
    }
    async getTotalCount(query = {}) {
        try {
            const totalCount = await product_variants_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of productVariants');
        }
    }
    async checkDuplication(countryId, data, slug) {
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
        const variantData = await product_variants_model_1.default.findOne(query);
        if (variantData) {
            return variantData;
        }
        else {
            return null;
        }
    }
    async create(productId, productVariants, userData) {
        const productVariantData = {
            productId: productId,
            slug: productVariants.slug,
            extraProductTitle: productVariants.extraProductTitle,
            countryId: productVariants.countryId || await (0, helpers_1.getCountryIdWithSuperAdmin)(userData),
            variantSku: productVariants.variantSku,
            price: productVariants.price,
            discountPrice: ((productVariants.discountPrice === null || productVariants.discountPrice === 'null') ? 0 : Number(productVariants.discountPrice)),
            quantity: productVariants.quantity,
            isDefault: Number(productVariants.isDefault),
            variantDescription: productVariants.variantDescription,
            cartMinQuantity: productVariants.cartMinQuantity,
            cartMaxQuantity: productVariants.cartMaxQuantity,
            hsn: productVariants.hsn,
            mpn: productVariants.mpn,
            barcode: productVariants.barcode,
            isExcel: productVariants?.isExcel
        };
        return await product_variants_model_1.default.create(productVariantData);
        // if (createdProductVariant) {
        //     const pipeline = [
        //         { $match: { _id: createdProductVariant._id } },
        //         // this.lookup,
        //         this.project
        //     ];
        //     const createdProductVariantWithValues = await ProductVariantModel.aggregate(pipeline);
        //     return createdProductVariantWithValues[0];
        // }
        // else {
        //     return null;
        // }
    }
    async findOne(productVariantId) {
        if (productVariantId) {
            const pipeline = [
                { $match: { _id: productVariantId } },
                this.lookup,
                this.project
            ];
            const productVariantDataWithValues = await product_variants_model_1.default.aggregate(pipeline);
            return productVariantDataWithValues[0];
        }
        else {
            return null;
        }
    }
    async update(productVariantId, productVariantData) {
        const updatedProductVariant = await product_variants_model_1.default.findByIdAndUpdate(productVariantId, productVariantData, { new: true, useFindAndModify: false });
        return updatedProductVariant;
    }
    async updateVariant(productId, productData) {
        const updatedVariant = await product_variants_model_1.default.updateMany({ productId: productId }, productData, { new: true, useFindAndModify: false });
        if (updatedVariant) {
            const pipeline = [
                this.project
                // { $match: { _id: updatedVariant._id } },
            ];
            const updatedCategoryWithValues = await product_variants_model_1.default.aggregate(pipeline);
            return updatedCategoryWithValues[0];
        }
        else {
            return null;
        }
    }
    async destroy(productVariantId) {
        return product_variants_model_1.default.findOneAndDelete({ _id: productVariantId });
    }
    async variantService(productdata, variantDetails, userData) {
        try {
            if (!productdata._id)
                throw new Error('Product ID is required.');
            const existingVariants = await product_variants_model_1.default.find({ productId: productdata._id });
            const variantPromises = variantDetails.map(async (variantDetail) => {
                if (existingVariants) {
                    const variantIDsToRemove = existingVariants
                        .filter(entry => !variantDetail.productVariants?.some((data) => data?._id?.toString() === entry._id.toString()))
                        .map(entry => entry._id);
                    await general_service_1.default.deleteParentModel([
                        { variantId: variantIDsToRemove, model: product_variant_attribute_model_1.default },
                        { variantId: variantIDsToRemove, model: seo_page_model_1.default },
                        { variantId: variantIDsToRemove, model: product_specification_model_1.default }
                    ]);
                }
                if (variantDetail.productVariants) {
                    const productVariantPromises = variantDetail.productVariants.map(async (data, index) => {
                        const existingVariant = existingVariants.find((variant) => variant._id.toString() === data._id.toString());
                        let productVariantData;
                        if (existingVariant) {
                            productVariantData = await product_variants_model_1.default.findByIdAndUpdate(existingVariant._id, {
                                ...data,
                                productId: productdata._id,
                                status: (productdata.status === data.status ? productdata.status : data.status) || productdata.status
                            }, { new: true });
                        }
                        else {
                            const countryData = await country_model_1.default.findById(variantDetail.countryId);
                            const slug = (0, helpers_1.slugify)(`${productdata.productTitle}-${countryData?.countryShortTitle}-${index + 1}`);
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
            return await product_variants_model_1.default.find({ productId: productdata._id });
        }
        catch (error) {
            console.error('Error in Product Variant Service:', error);
            throw new Error('Failed to update product variants.');
        }
    }
    async handleVariantAttributes(data, productdata, variantDetail, index) {
        if (data.productVariantAttributes && data.productVariantAttributes.length > 0) {
            const bulkOps = data.productVariantAttributes
                .filter((attr) => attr.attributeId && attr.attributeDetailId)
                .map((attr) => ({
                updateOne: {
                    filter: { _id: new mongoose_1.Types.ObjectId(attr._id) },
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
                await product_variant_attribute_model_1.default.bulkWrite(bulkOps);
            }
        }
    }
    async handleProductSpecifications(data, productdata, variantDetail, index) {
        if (data.productSpecification && data.productSpecification.length > 0) {
            const bulkOps = data.productSpecification
                .filter((spec) => spec.specificationId && spec.specificationDetailId)
                .map((spec) => ({
                updateOne: {
                    filter: { _id: new mongoose_1.Types.ObjectId(spec._id) },
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
                await product_specification_model_1.default.bulkWrite(bulkOps);
            }
        }
    }
    async handleSeoData(data, productdata, productVariantData) {
        const seoData = data.productSeo;
        if (seoData && (seoData.metaTitle || seoData.metaKeywords || seoData.metaDescription || seoData.ogTitle || seoData.ogDescription || seoData.twitterTitle || seoData.twitterDescription)) {
            await seo_page_model_2.default.updateOne({ _id: seoData._id ? new mongoose_1.Types.ObjectId(seoData._id) : new mongoose_1.Types.ObjectId() }, {
                $set: {
                    pageId: productdata._id,
                    pageReferenceId: productVariantData._id || null,
                    page: seo_page_1.seoPage.ecommerce.products,
                    metaTitle: seoData.metaTitle,
                    metaKeywords: seoData.metaKeywords,
                    metaDescription: seoData.metaDescription,
                    ogTitle: seoData.ogTitle,
                    ogDescription: seoData.ogDescription,
                    twitterTitle: seoData.twitterTitle,
                    twitterDescription: seoData.twitterDescription
                }
            }, { upsert: true });
        }
    }
}
exports.default = new ProductVariantService();
