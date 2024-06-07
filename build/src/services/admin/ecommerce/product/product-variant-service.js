"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../../components/pagination");
const helpers_1 = require("../../../../utils/helpers");
const product_variants_model_1 = __importDefault(require("../../../../model/admin/ecommerce/product/product-variants-model"));
const product_specification_model_1 = __importDefault(require("../../../../model/admin/ecommerce/product/product-specification-model"));
const product_specification_service_1 = __importDefault(require("../../../../services/admin/ecommerce/product/product-specification-service"));
const seo_page_model_1 = __importDefault(require("../../../../model/admin/seo-page-model"));
const product_variant_attribute_model_1 = __importDefault(require("../../../../model/admin/ecommerce/product/product-variant-attribute-model"));
const general_service_1 = __importDefault(require("../../general-service"));
const seo_page_service_1 = __importDefault(require("../../seo-page-service"));
const product_variant_attributes_service_1 = __importDefault(require("../../../../services/admin/ecommerce/product/product-variant-attributes-service"));
const seo_page_1 = require("../../../../constants/admin/seo-page");
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
        const variantData = await product_variants_model_1.default.find(query);
        return variantData;
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
        console.log("getCountryId(userData)", userData, "mmmmmmmmmm", await (0, helpers_1.getCountryId)(userData));
        const productVariantData = {
            productId: productId,
            slug: productVariants.slug,
            extraProductTitle: productVariants.extraProductTitle,
            countryId: productVariants.countryId || await (0, helpers_1.getCountryId)(userData),
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
        };
        const createdProductVariant = await product_variants_model_1.default.create(productVariantData);
        if (createdProductVariant) {
            const pipeline = [
                { $match: { _id: createdProductVariant._id } },
                // this.lookup,
                this.project
            ];
            const createdProductVariantWithValues = await product_variants_model_1.default.aggregate(pipeline);
            return createdProductVariantWithValues[0];
        }
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
        if (updatedProductVariant) {
            const pipeline = [
                { $match: { _id: updatedProductVariant._id } },
                // this.lookup,
                this.project
            ];
            const updatedProductVariantWithValues = await product_variants_model_1.default.aggregate(pipeline);
            return updatedProductVariantWithValues[0];
        }
        else {
            return null;
        }
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
        console.log("variantDetailsvariantDetailsvariantDetails", variantDetails);
        try {
            if (productdata._id) {
                const existingEntries = await product_variants_model_1.default.find({ productId: productdata._id });
                await variantDetails.map(async (variantDetail) => {
                    if (existingEntries) {
                        const variantIDsToRemove = existingEntries
                            .filter(entry => !variantDetail.productVariants?.some((data) => data?._id?.toString() === entry._id.toString()))
                            .map(entry => entry._id);
                        const deleteVariant = await product_variants_model_1.default.deleteMany({ productId: productdata._id, _id: { $in: variantIDsToRemove } });
                        console.log("deleteVariant", deleteVariant);
                        if (deleteVariant) {
                            await general_service_1.default.deleteParentModel([
                                {
                                    variantId: variantIDsToRemove,
                                    model: product_variant_attribute_model_1.default
                                },
                                {
                                    variantId: variantIDsToRemove,
                                    model: seo_page_model_1.default
                                },
                                {
                                    variantId: variantIDsToRemove,
                                    model: product_specification_model_1.default
                                },
                            ]);
                        }
                        // })
                    }
                    if (variantDetail.productVariants) {
                        const variantPromises = await Promise.all(variantDetail.productVariants.map(async (data, index) => {
                            // if (data._id != '') {
                            const existingEntry = await product_variants_model_1.default.findOne({ _id: data._id });
                            console.log("existingEntry", existingEntry);
                            if (existingEntry) {
                                // Update existing document
                                const productVariantData = await product_variants_model_1.default.findByIdAndUpdate(existingEntry._id, { ...data, productId: productdata._id });
                                if (productVariantData && productdata.isVariant === 1) {
                                    console.log("variantDetail.productVariants", variantDetail.productVariants[index]._id);
                                    // if (data.productVariantAttributes && data.productVariantAttributes.length > 0) {
                                    await product_variant_attributes_service_1.default.variantAttributeService(productdata._id, data.productVariantAttributes, variantDetail.productVariants[index]._id);
                                    // }
                                    // if (data.productSeo && data.productSeo.length > 0) {
                                    await seo_page_service_1.default.seoPageService(productdata._id, data.productSeo, seo_page_1.seoPage.ecommerce.products, variantDetail.productVariants[index]._id);
                                    // }
                                    // if (data.productSpecification && data.productSpecification.length > 0) {
                                    await product_specification_service_1.default.productSpecificationService(productdata._id, data.productSpecification, variantDetail.productVariants[index]._id);
                                    // }
                                }
                                else {
                                    await general_service_1.default.deleteParentModel([
                                        {
                                            variantId: variantDetail.productVariants[index]._id,
                                            model: product_variant_attribute_model_1.default
                                        },
                                        {
                                            variantId: variantDetail.productVariants[index]._id,
                                            model: seo_page_model_1.default
                                        },
                                        {
                                            variantId: variantDetail.productVariants[index]._id,
                                            model: product_specification_model_1.default
                                        },
                                    ]);
                                }
                            }
                            else {
                                console.log("haaai");
                                var slugData;
                                if (data.extraProductTitle) {
                                    slugData = productdata.slug + "-" + data.extraProductTitle;
                                }
                                else {
                                    slugData = productdata.slug;
                                }
                                // Create new document
                                const variantData = await this.create(productdata._id, { countryId: variantDetail.countryId, ...data, slug: slugData }, userData);
                                console.log("variantData", variantData);
                                if (variantData) {
                                    if (variantData) {
                                        console.log("variantDetail.productVariants123", variantDetail.productVariants[index]._id);
                                        // if (data.productVariantAttributes && data.productVariantAttributes.length > 0) {
                                        await product_variant_attributes_service_1.default.variantAttributeService(productdata._id, data.productVariantAttributes, variantData._id);
                                        // }
                                        // if (data.productSeo && data.productSeo.length > 0) {
                                        await seo_page_service_1.default.seoPageService(productdata._id, data.productSeo, seo_page_1.seoPage.ecommerce.products, variantDetail.productVariants[index]._id);
                                        // }
                                        // if (data.productSpecification && data.productSpecification.length > 0) {
                                        await product_specification_service_1.default.productSpecificationService(productdata._id, data.productSpecification, variantData._id);
                                        // }
                                    }
                                }
                            }
                        }));
                        await Promise.all(variantPromises);
                    }
                });
                return await product_variants_model_1.default.find({ productId: productdata._id });
            }
            else {
                throw 'Could not find product Id';
            }
        }
        catch (error) {
            console.error('Error in Product Variant service:', error);
            throw error;
        }
    }
}
exports.default = new ProductVariantService();
