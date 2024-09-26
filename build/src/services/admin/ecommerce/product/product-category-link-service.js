"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../../components/pagination");
const product_category_link_model_1 = __importDefault(require("../../../../model/admin/ecommerce/product/product-category-link-model"));
const mongoose_1 = __importDefault(require("mongoose"));
class ProductCategoryLinkService {
    constructor() {
        // this.productCategoryLinkAddFields = {
        //     $addFields:
        // };
        this.lookup = {
            $lookup: {
                from: "brands",
                let: { productCategoryLinkApplyValues: '$productCategoryLinkApplyValues' },
                pipeline: [
                    { $match: { $expr: { $in: [{ $toString: "$_id" }, "$$productCategoryLinkApplyValues"] } } },
                    {
                        $project: {
                            _id: 1,
                            brandTitle: 1,
                            slug: 1,
                            brandImageUrl: 1,
                            status: 1
                        }
                    }
                ],
                as: 'appliedValuesForBrand'
            }
        };
        this.categoriesLookup = {
            $lookup: {
                from: "categories",
                let: { productCategoryLinkApplyValues: '$productCategoryLinkApplyValues' },
                pipeline: [
                    { $match: { $expr: { $in: [{ $toString: "$_id" }, "$$productCategoryLinkApplyValues"] } } },
                    {
                        $project: {
                            _id: 1,
                            categoryTitle: 1,
                            slug: 1,
                            categoryImageUrl: 1,
                            categorySecondImageUrl: 1,
                            status: 1
                        }
                    }
                ],
                as: 'appliedValuesForCategory'
            }
        };
        this.productsLookup = {
            $lookup: {
                from: "products",
                let: { productCategoryLinkApplyValues: '$productCategoryLinkApplyValues' },
                pipeline: [
                    { $match: { $expr: { $in: [{ $toString: "$_id" }, "$$productCategoryLinkApplyValues"] } } },
                ],
                as: 'appliedValuesForProduct'
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
            this.productCategoryLinkAddFields
        ];
        pipeline.push(this.lookup, this.categoriesLookup, this.productsLookup);
        return product_category_link_model_1.default.aggregate(pipeline).exec();
    }
    async getTotalCount(query = {}) {
        try {
            const totalCount = await product_category_link_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of productCategoryLinks');
        }
    }
    async find(productId, categoryId, id) {
        const linkData = await product_category_link_model_1.default.find({
            $and: [
                { _id: id },
                { productId: productId },
                { categoryId: categoryId },
            ]
        });
        return linkData;
        // return ProductCategoryLinkModel.find({productId:productId,categoryId:categoryId});
    }
    async findWithProductId(productId) {
        const linkData = await product_category_link_model_1.default.find({ productId: productId });
        return linkData;
        // return ProductCategoryLinkModel.find({productId:productId,categoryId:categoryId});
    }
    async create(productCategoryLinkData) {
        return product_category_link_model_1.default.create(productCategoryLinkData);
    }
    async findOne(productCategoryLinkId) {
        const pipeline = [
            { $match: { _id: mongoose_1.default.Types.ObjectId.createFromHexString(productCategoryLinkId) } },
        ];
        const result = await product_category_link_model_1.default.aggregate(pipeline).exec();
        return result.length > 0 ? result[0] : null;
    }
    async update(productCategoryLinkId, productCategoryLinkData) {
        return product_category_link_model_1.default.findByIdAndUpdate(productCategoryLinkId, productCategoryLinkData, { new: true, useFindAndModify: false });
    }
    async destroy(productCategoryLinkId) {
        return product_category_link_model_1.default.findOneAndDelete({ _id: productCategoryLinkId });
    }
    async categoryLinkService(productId, productCategoryDetails) {
        try {
            if (productId) {
                const productCategory = productCategoryDetails.split(',');
                const existingEntries = await product_category_link_model_1.default.find({ productId: productId });
                if (existingEntries) {
                    const productCategoryIDsToRemove = existingEntries
                        .filter(entry => !productCategory?.some((data) => data?._id?.toString() === entry._id.toString()))
                        .map(entry => entry._id);
                    await product_category_link_model_1.default.deleteMany({ productId: productId, _id: { $in: productCategoryIDsToRemove } });
                }
                if (productCategoryDetails) {
                    const categoryLinkPromises = await Promise.all(productCategory.map(async (data) => {
                        await product_category_link_model_1.default.create({ categoryId: new mongoose_1.default.Types.ObjectId(data), productId: productId });
                    }));
                    await Promise.all(categoryLinkPromises);
                }
                return await product_category_link_model_1.default.find({ productId: productId });
            }
            else {
                throw 'Could not find product Id';
            }
        }
        catch (error) {
            throw error;
        }
    }
}
exports.default = new ProductCategoryLinkService();
