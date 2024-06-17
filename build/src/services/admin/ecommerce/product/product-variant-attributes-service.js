"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../../components/pagination");
const product_variant_attribute_model_1 = __importDefault(require("../../../../model/admin/ecommerce/product/product-variant-attribute-model"));
class ProductVariantAttributeService {
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
        return product_variant_attribute_model_1.default.aggregate(pipeline).exec();
    }
    async getTotalCount(query = {}) {
        try {
            const totalCount = await product_variant_attribute_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of productVariantAttributes');
        }
    }
    async create(productVariantAttributes) {
        try {
            if (productVariantAttributes) {
                const existingEntries = await product_variant_attribute_model_1.default.findOne({
                    productId: productVariantAttributes.productId,
                    variantId: productVariantAttributes.variantId,
                    attributeId: productVariantAttributes.attributeId,
                    attributeDetailId: productVariantAttributes.attributeDetailId,
                });
                let attributeValue = {};
                if (existingEntries) {
                    const filter = {
                        productId: productVariantAttributes.productId,
                        variantId: productVariantAttributes.variantId,
                        attributeId: productVariantAttributes.attributeId,
                        attributeDetailId: productVariantAttributes.attributeDetailId,
                    };
                    const update = {
                        $set: {
                            productId: productVariantAttributes.productId,
                            variantId: productVariantAttributes.variantId,
                            attributeId: productVariantAttributes.attributeId,
                            attributeDetailId: productVariantAttributes.attributeDetailId,
                            createdAt: new Date()
                        }
                    };
                    const options = {
                        upsert: false,
                        new: true
                    };
                    attributeValue = await product_variant_attribute_model_1.default.findOneAndUpdate(filter, update, options);
                    return attributeValue;
                }
                else {
                    const isEmptyValue = Object.values(productVariantAttributes).some(value => (value !== ''));
                    // console.log("--**--------------",isEmptyValue);
                    if (isEmptyValue) {
                        const productVariantAttributeData = {
                            productId: productVariantAttributes.productId,
                            variantId: productVariantAttributes.variantId,
                            attributeId: productVariantAttributes.attributeId,
                            attributeDetailId: productVariantAttributes.attributeDetailId,
                            createdAt: new Date()
                        };
                        // console.log("productVariantAttributeData", productVariantAttributeData);
                        attributeValue = await product_variant_attribute_model_1.default.create(productVariantAttributeData);
                        // console.log("attributeValue", attributeValue);
                    }
                    return { ...attributeValue };
                }
            }
            else {
                console.log("null:::");
                return null;
            }
        }
        catch {
            return null;
        }
    }
    async find(productId) {
        return product_variant_attribute_model_1.default.find({ productId: productId });
    }
    async findOne(productVariantAttributeId) {
        if (productVariantAttributeId) {
            const pipeline = [
                { $match: { _id: productVariantAttributeId } },
                this.lookup,
                this.project
            ];
            const productVariantAttributeDataWithValues = await product_variant_attribute_model_1.default.aggregate(pipeline);
            return productVariantAttributeDataWithValues[0];
        }
        else {
            return null;
        }
    }
    async update(productVariantAttributeId, productVariantAttributeData) {
        const updatedproductVariantAttribute = await product_variant_attribute_model_1.default.findByIdAndUpdate(productVariantAttributeId, productVariantAttributeData, { new: true, useFindAndModify: false });
        if (updatedproductVariantAttribute) {
            const pipeline = [
                { $match: { _id: updatedproductVariantAttribute._id } },
                this.lookup,
                this.project
            ];
            const updatedproductVariantAttributeWithValues = await product_variant_attribute_model_1.default.aggregate(pipeline);
            return updatedproductVariantAttributeWithValues[0];
        }
        else {
            return null;
        }
    }
    async destroy(productVariantAttributeId) {
        return product_variant_attribute_model_1.default.findOneAndDelete({ _id: productVariantAttributeId });
    }
    async variantAttributeService(productId, variantDetails, variantId) {
        try {
            if (productId) {
                const existingEntries = await product_variant_attribute_model_1.default.find({ productId: productId });
                if (existingEntries) {
                    const variantAttributeIDsToRemove = existingEntries
                        .filter(entry => !variantDetails?.some((data) => data?._id?.toString() === entry._id.toString()))
                        .map(entry => entry._id);
                    await product_variant_attribute_model_1.default.deleteMany({ productId: productId, _id: { $in: variantAttributeIDsToRemove } });
                }
                if (variantDetails) {
                    const variantAttributePromises = await Promise.all(variantDetails.map(async (data) => {
                        if (data.attributeId != '' && data.attributeDetailId != '' && data._id != '' && data._id != undefined) {
                            const existingEntry = await product_variant_attribute_model_1.default.findOne({ _id: data._id });
                            if (existingEntry) {
                                // Update existing document
                                await product_variant_attribute_model_1.default.findByIdAndUpdate(existingEntry._id, { ...data, productId: productId });
                            }
                            else {
                                // Create new document
                                await product_variant_attribute_model_1.default.create({ attributeId: data.attributeId, attributeDetailId: data.attributeDetailId, productId: productId, variantId: variantId });
                            }
                        }
                    }));
                    await Promise.all(variantAttributePromises);
                }
                return await product_variant_attribute_model_1.default.find({ productId: productId });
            }
            else {
                throw 'Could not find product Id';
            }
        }
        catch (error) {
            console.error('Error in Product Variant attribute service:', error);
            throw error;
        }
    }
}
exports.default = new ProductVariantAttributeService();
