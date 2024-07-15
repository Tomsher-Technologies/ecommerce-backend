"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const pagination_1 = require("../../../components/pagination");
const multi_languages_1 = require("../../../constants/multi-languages");
const category_model_1 = __importDefault(require("../../../model/admin/ecommerce/category-model"));
const helpers_1 = require("../../../utils/helpers");
class CategoryService {
    constructor() {
        this.parentCategoryLookup = {
            $lookup: {
                from: 'categories',
                localField: '_id',
                foreignField: 'parentCategory',
                as: 'subCategories',
                pipeline: [
                    {
                        $lookup: {
                            from: 'categories',
                            localField: '_id',
                            foreignField: 'parentCategory',
                            as: 'subCategories',
                        },
                    },
                ],
            }
        };
        this.multilanguageFieldsLookup = {
            $lookup: {
                from: 'multilanguagefieleds', // Ensure 'from' field is included
                let: { categoryId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$sourceId', '$$categoryId'] },
                                    { $eq: ['$source', multi_languages_1.multiLanguageSources.ecommerce.categories] },
                                ],
                            },
                        },
                    },
                ],
                as: 'languageValues',
            },
        };
        this.project = {
            $project: {
                _id: 1,
                categoryTitle: 1,
                slug: 1,
                description: 1,
                categoryImageUrl: 1,
                parentCategory: 1,
                corporateGiftsPriority: 1,
                type: 1,
                level: 1,
                status: 1,
                createdAt: 1,
                metaTitle: 1,
                metaKeywords: 1,
                metaDescription: 1,
                metaImageUrl: 1,
                ogTitle: 1,
                ogDescription: 1,
                twitterTitle: 1,
                twitterDescription: 1,
                subCategories: {
                    $ifNull: ['$subCategories', []]
                },
                languageValues: { $ifNull: ['$languageValues', []] },
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
            this.multilanguageFieldsLookup,
            this.project
        ];
        return category_model_1.default.aggregate(pipeline).exec();
    }
    async getTotalCount(query = {}) {
        try {
            const totalCount = await category_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of categories');
        }
    }
    async populateParentCategories(category) {
        if (category.parentCategory) {
            try {
                const parentCategory = await category_model_1.default.findById(category.parentCategory);
                if (parentCategory) {
                    category.parentCategory = await this.populateParentCategories(parentCategory);
                }
            }
            catch (error) {
                console.error(`Error finding parent category: ${error}`);
            }
        }
        return category;
    }
    async findAllParentCategories(options = {}) {
        const { query } = (0, pagination_1.pagination)(options.query || {}, options);
        let categories = await category_model_1.default.find(query)
            .populate('parentCategory', 'categoryTitle')
            .lean();
        categories = await Promise.all(categories.map(async (category) => {
            category = await this.populateParentCategories(category);
            return category;
        }));
        return categories;
    }
    async findAllChilledCategories(query) {
        try {
            const rootCategories = await category_model_1.default.find(query); // Find root categories
            if (!rootCategories || rootCategories.length === 0) {
                return null;
            }
            const categoriesWithSubcategories = [];
            for (const rootCategory of rootCategories) {
                const processedCategory = await this.processCategory(rootCategory);
                categoriesWithSubcategories.push(processedCategory);
            }
            return categoriesWithSubcategories;
        }
        catch (error) {
            console.error("Error finding categories:", error);
            return null;
        }
    }
    async processCategory(category) {
        const subcategories = await category_model_1.default.find({ parentCategory: category._id });
        if (subcategories && subcategories.length > 0) {
            const processedSubcategories = [];
            for (const subcategory of subcategories) {
                const processedSubcategory = await this.processCategory(subcategory);
                processedSubcategories.push(processedSubcategory);
            }
            return { ...category.toObject(), subCategories: processedSubcategories };
        }
        else {
            return { ...category.toObject(), subCategories: [] };
        }
    }
    async findSubCategory(category) {
        const findCategories = await this.getParentChilledCategory({ parentCategory: category._id });
        const categoriesWithSubcategories = [];
        if (findCategories) {
            for (let i = 0; i < findCategories.length; i++) {
                const data = {
                    level: parseInt(category.level) + 1,
                    slug: (0, helpers_1.categorySlugify)(category.slug + "-" + findCategories[i].categoryTitle)
                };
                const query = findCategories[i]._id;
                const categories = await this.update(query, data);
                const result = await this.findSubCategory(categories);
                categoriesWithSubcategories.push(result);
            }
        }
    }
    async getParentChilledCategory(query) {
        return category_model_1.default.find(query);
    }
    async create(categoryData) {
        const createdCategory = await category_model_1.default.create(categoryData);
        if (createdCategory) {
            const pipeline = [
                { $match: { _id: createdCategory._id } },
                this.multilanguageFieldsLookup,
                this.parentCategoryLookup,
                this.project
            ];
            const createdCategoryWithValues = await category_model_1.default.aggregate(pipeline);
            return createdCategoryWithValues[0];
        }
        else {
            return null;
        }
    }
    async findOne(categoryId) {
        try {
            if (categoryId) {
                const objectId = new mongoose_1.default.Types.ObjectId(categoryId);
                const pipeline = [
                    { $match: { _id: objectId } },
                    this.multilanguageFieldsLookup,
                ];
                const categoryDataWithValues = await category_model_1.default.aggregate(pipeline);
                return categoryDataWithValues[0] || null;
            }
            else {
                return null;
            }
        }
        catch (error) {
            return null;
        }
    }
    async findOneCategory(data) {
        return category_model_1.default.findOne(data);
    }
    async findCategoryId(categoryTitle) {
        const slug = (0, helpers_1.categorySlugify)(categoryTitle);
        let categoryResult = await this.findOneCategory({ slug: slug });
        if (categoryResult) {
            return categoryResult;
        }
        else {
            function splitHyphenOutsideParentheses(inputStr) {
                const parts = inputStr.split(/-(?![^()]*\))/);
                return parts;
            }
            const catData = await splitHyphenOutsideParentheses(slug);
            let currentSlug = '';
            let parentCategory = null;
            for await (const data of catData) {
                if (currentSlug !== '') {
                    currentSlug += '-';
                }
                currentSlug += (0, helpers_1.categorySlugify)(data);
                categoryResult = await this.findOneCategory({ slug: currentSlug });
                if (categoryResult == null) {
                    const titleData = await splitHyphenOutsideParentheses(currentSlug);
                    const lastItem = data;
                    const parentSlug = titleData.slice(0, -1).join('-');
                    if (parentSlug) {
                        parentCategory = await this.findOneCategory({ slug: parentSlug });
                    }
                    const categoryData = {
                        categoryTitle: (0, helpers_1.capitalizeWords)(lastItem.replace(/_/g, ' ')),
                        slug: currentSlug,
                        parentCategory: parentCategory ? parentCategory._id : null,
                        level: parentCategory ? (parseInt(parentCategory.level) + 1).toString() : '0',
                        isExcel: true
                    };
                    await this.create(categoryData);
                    categoryResult = await this.findOneCategory({ slug: currentSlug });
                }
                else {
                    parentCategory = categoryResult;
                }
            }
            const result = await this.findOneCategory({ slug: (0, helpers_1.categorySlugify)(categoryTitle) });
            if (result) {
                return result;
            }
        }
    }
    async findParentCategory(parentCategory) {
        return category_model_1.default.findOne({ _id: parentCategory });
    }
    async update(categoryId, categoryData) {
        const updatedCategory = await category_model_1.default.findByIdAndUpdate(categoryId, categoryData, { new: true, useFindAndModify: false });
        if (updatedCategory) {
            const pipeline = [
                { $match: { _id: updatedCategory._id } },
                this.multilanguageFieldsLookup,
            ];
            const updatedCategoryWithValues = await category_model_1.default.aggregate(pipeline);
            return updatedCategoryWithValues[0];
        }
        else {
            return null;
        }
    }
    async destroy(categoryId) {
        return category_model_1.default.findOneAndDelete({ _id: categoryId });
    }
    async updateWebsitePriority(container1, columnKey) {
        try {
            await category_model_1.default.updateMany({ [columnKey]: { $gt: '0' } }, { [columnKey]: '0' });
            if (container1 && container1.length > 0) {
                for (let i = 0; i < container1.length; i++) {
                    const categoryId = container1[i];
                    const category = await category_model_1.default.findById(categoryId);
                    if (category) {
                        category[columnKey] = (i + 1).toString();
                        await category.save({ validateBeforeSave: false });
                    }
                }
            }
        }
        catch (error) {
            throw new Error(error + 'Failed to update ' + columnKey);
        }
    }
}
exports.default = new CategoryService();
