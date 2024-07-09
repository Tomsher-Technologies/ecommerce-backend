"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../../components/pagination");
const product_specification_model_1 = __importDefault(require("../../../../model/admin/ecommerce/product/product-specification-model"));
class ProductSpecificationService {
    constructor() {
        this.project = {
            $project: {
                _id: 1,
                productId: 1,
                variantId: 1,
                specificationId: 1,
                specificationDetailId: 1,
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
        return product_specification_model_1.default.aggregate(pipeline).exec();
    }
    async find(productId) {
        return product_specification_model_1.default.find({ productId: productId });
    }
    async getTotalCount(query = {}) {
        try {
            const totalCount = await product_specification_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of productSpecification');
        }
    }
    async create(productSpecification) {
        try {
            if (productSpecification) {
                const existingEntries = await product_specification_model_1.default.findOne({
                    productId: productSpecification.productId,
                    variantId: productSpecification.variantId,
                    specificationId: productSpecification.specificationId,
                    specificationDetailId: productSpecification.specificationDetailId,
                });
                let specificationValue = {};
                if (existingEntries) {
                    const filter = {
                        productId: productSpecification.productId,
                        variantId: productSpecification.variantId,
                        specificationId: productSpecification.specificationId,
                        specificationDetailId: productSpecification.specificationDetailId,
                    };
                    const update = {
                        $set: {
                            productId: productSpecification.productId,
                            variantId: productSpecification.variantId,
                            specificationId: productSpecification.specificationId,
                            specificationDetailId: productSpecification.specificationDetailId,
                            createdAt: new Date()
                        }
                    };
                    const options = {
                        upsert: false,
                        new: true
                    };
                    specificationValue = await product_specification_model_1.default.findOneAndUpdate(filter, update, options);
                    return specificationValue;
                }
                else {
                    const isEmptyValue = Object.values(productSpecification).some(value => (value !== ''));
                    if (isEmptyValue) {
                        const productSpecificationData = {
                            productId: productSpecification.productId,
                            variantId: productSpecification.variantId,
                            specificationId: productSpecification.specificationId,
                            specificationDetailId: productSpecification.specificationDetailId,
                            createdAt: new Date()
                        };
                        specificationValue = await product_specification_model_1.default.create(productSpecificationData);
                    }
                    return specificationValue;
                }
            }
            else {
                console.log("null:::");
                return null;
            }
        }
        catch {
            console.log("error");
            return null;
        }
    }
    async findOne(productSpecificationId) {
        if (productSpecificationId) {
            const pipeline = [
                { $match: { _id: productSpecificationId } },
                this.lookup,
                this.project
            ];
            const productSpecificationDataWithValues = await product_specification_model_1.default.aggregate(pipeline);
            return productSpecificationDataWithValues[0];
        }
        else {
            return null;
        }
    }
    async update(productSpecificationId, productSpecificationData) {
        const updatedproductSpecification = await product_specification_model_1.default.findByIdAndUpdate(productSpecificationId, productSpecificationData, { new: true, useFindAndModify: false });
        if (updatedproductSpecification) {
            const pipeline = [
                { $match: { _id: updatedproductSpecification._id } },
                this.lookup,
                this.project
            ];
            const updatedproductSpecificationWithValues = await product_specification_model_1.default.aggregate(pipeline);
            return updatedproductSpecificationWithValues[0];
        }
        else {
            return null;
        }
    }
    async destroy(productSpecificationId) {
        return product_specification_model_1.default.findOneAndDelete({ _id: productSpecificationId });
    }
    async productSpecificationService(productId, specificationDetails, variantId) {
        try {
            if (productId) {
                const existingEntries = await product_specification_model_1.default.find({ productId: productId });
                if (existingEntries) {
                    const specificationIDsToRemove = existingEntries
                        .filter(entry => !specificationDetails?.some((data) => data?._id?.toString() === entry._id.toString()))
                        .map(entry => entry._id);
                    await product_specification_model_1.default.deleteMany({ productId: productId, variantId: variantId, _id: { $in: specificationIDsToRemove } });
                }
                if (specificationDetails) {
                    const productSpecificationPromises = await Promise.all(specificationDetails.map(async (data) => {
                        if (data.specificationId != '' && data.specificationDetailId != '' && data._id != '' && data?._id != 'undefined') {
                            const existingEntry = await product_specification_model_1.default.findOne({ _id: data._id });
                            if (existingEntry) {
                                // Update existing document
                                await product_specification_model_1.default.findByIdAndUpdate(existingEntry._id, { ...data, productId: productId });
                            }
                            else {
                                // Create new document
                                await product_specification_model_1.default.create({ specificationId: data.specificationId, specificationDetailId: data.specificationDetailId, productId: productId, variantId: variantId });
                            }
                        }
                    }));
                    await Promise.all(productSpecificationPromises);
                }
                return await product_specification_model_1.default.find({ productId: productId });
            }
            else {
                throw 'Could not find product specification Id';
            }
        }
        catch (error) {
            console.error('Error in Product specification service:', error);
            throw error;
        }
    }
}
exports.default = new ProductSpecificationService();
