"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const pagination_1 = require("../../../components/pagination");
const multi_languages_1 = require("../../../constants/multi-languages");
const attribute_detail_model_1 = __importDefault(require("../../../model/admin/ecommerce/attribute-detail-model"));
const attribute_model_1 = __importDefault(require("../../../model/admin/ecommerce/attribute-model"));
const helpers_1 = require("../../../utils/helpers");
class AttributesService {
    constructor() {
        this.attributeDetailsLookup = {
            $lookup: {
                from: 'attributedetails', // Collection name of AttributeDetailModel
                localField: '_id', // Field in AttributesModel
                foreignField: 'attributeId', // Field in AttributeDetailModel
                as: 'attributeValues'
            }
        };
        this.multilanguageFieldsLookup = {
            $lookup: {
                from: 'multilanguagefieleds', // Ensure 'from' field is included
                let: { attributeId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$sourceId', '$$attributeId'] },
                                    { $eq: ['$source', multi_languages_1.multiLanguageSources.ecommerce.attribute] },
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
                attributeTitle: 1,
                slug: 1,
                attributeType: 1,
                status: 1,
                createdAt: 1,
                attributeValues: {
                    $ifNull: ['$attributeValues', []]
                },
                languageValues: {
                    $ifNull: ['$languageValues', []]
                }
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
            this.attributeDetailsLookup,
            this.multilanguageFieldsLookup,
            this.project
        ];
        return attribute_model_1.default.aggregate(pipeline).exec();
    }
    async getTotalCount(query = {}) {
        try {
            const totalCount = await attribute_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of attribute');
        }
    }
    async create(attributeData) {
        const createdAttribute = await attribute_model_1.default.create(attributeData);
        if (createdAttribute) {
            const pipeline = [
                { $match: { _id: createdAttribute._id } },
                this.attributeDetailsLookup,
                this.multilanguageFieldsLookup,
                this.project
            ];
            const createdAttributeWithValues = await attribute_model_1.default.aggregate(pipeline);
            return createdAttributeWithValues[0];
        }
        else {
            return null;
        }
    }
    async findOne(attributeId) {
        if (attributeId) {
            const objectId = new mongoose_1.default.Types.ObjectId(attributeId);
            const pipeline = [
                { $match: { _id: objectId } },
                this.attributeDetailsLookup,
                this.multilanguageFieldsLookup,
                this.project
            ];
            const attributeDataWithValues = await attribute_model_1.default.aggregate(pipeline);
            return attributeDataWithValues[0];
        }
        else {
            return null;
        }
    }
    async findOneAttribute(data) {
        const resultAttribute = await attribute_model_1.default.findOne({ attributeTitle: data.attributeTitle });
        if (resultAttribute) {
            const attributeDetailResult = await this.findOneAttributeDetail(data, resultAttribute._id);
            const result = {
                attributeId: resultAttribute._id,
                attributeDetailId: attributeDetailResult._id
            };
            return result;
        }
        else {
            const attributeData = {
                attributeTitle: data.attributeTitle,
                isExcel: true,
                slug: (0, helpers_1.slugify)(data.attributeTitle)
            };
            const attributeResult = await this.create(attributeData);
            if (attributeResult) {
                const attributeDetailResult = await this.findOneAttributeDetail(data, attributeResult._id);
                const result = {
                    attributeId: attributeResult._id,
                    attributeDetailId: attributeDetailResult._id
                };
                return result;
            }
        }
    }
    async findOneAttributeDetail(data, attributeId) {
        const resultBrand = await attribute_detail_model_1.default.findOne({ $and: [{ itemName: data.itemName }, { attributeId: attributeId }] });
        if (resultBrand) {
            return resultBrand;
        }
        else {
            const brandData = {
                attributeId: attributeId,
                itemName: data.itemName,
                itemValue: data.itemValue,
            };
            const brandResult = await attribute_detail_model_1.default.create(brandData);
            if (brandResult) {
                return brandResult;
            }
        }
    }
    async update(attributeId, attributeData) {
        const updatedAttributes = await attribute_model_1.default.findByIdAndUpdate(attributeId, attributeData, { new: true, useFindAndModify: false });
        if (updatedAttributes) {
            const pipeline = [
                { $match: { _id: updatedAttributes._id } },
                this.attributeDetailsLookup,
                this.multilanguageFieldsLookup,
                this.project
            ];
            const updatedAttributesWithValues = await attribute_model_1.default.aggregate(pipeline);
            return updatedAttributesWithValues[0];
        }
        else {
            return null;
        }
    }
    async attributeDetailsService(attributeId, attributeDetails) {
        try {
            if (attributeId) {
                const existingEntries = await attribute_detail_model_1.default.find({ attributeId: attributeId });
                if (existingEntries) {
                    const attributeDetailIDsToRemove = existingEntries
                        .filter(entry => !attributeDetails.some((data) => data?._id?.toString() === entry?._id?.toString()))
                        .map(entry => entry._id);
                    await attribute_detail_model_1.default.deleteMany({ attributeId: attributeId, _id: { $in: attributeDetailIDsToRemove } });
                }
                const inventryPricingPromises = await Promise.all(attributeDetails.map(async (data) => {
                    const existingEntry = await attribute_detail_model_1.default.findOne({ _id: data._id });
                    if (existingEntry) {
                        // Update existing document
                        await attribute_detail_model_1.default.findByIdAndUpdate(existingEntry._id, { ...data, attributeId: attributeId });
                    }
                    else {
                        // Create new document
                        await attribute_detail_model_1.default.create({ ...data, attributeId: attributeId });
                    }
                }));
                await Promise.all(inventryPricingPromises);
                return await attribute_detail_model_1.default.find({ attributeId: attributeId });
            }
            else {
                throw 'Could not find attribute Id';
            }
        }
        catch (error) {
            console.error('Error in attributeDetailsService:', error);
            throw error;
        }
    }
    async destroy(attributeId) {
        return attribute_model_1.default.findOneAndDelete({ _id: attributeId });
    }
}
exports.default = new AttributesService();