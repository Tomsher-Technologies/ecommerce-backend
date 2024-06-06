"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const specifications_detail_model_1 = __importDefault(require("../../../model/admin/ecommerce/specifications-detail-model"));
const multi_languages_1 = require("../../../constants/multi-languages");
const specifications_model_1 = __importDefault(require("../../../model/admin/ecommerce/specifications-model"));
const helpers_1 = require("../../../utils/helpers");
class SpecificationService {
    constructor() {
        this.lookup = {
            $lookup: {
                from: 'specificationdetails',
                localField: '_id',
                foreignField: 'specificationId',
                as: 'specificationValues'
            }
        };
        this.multilanguageFieldsLookup = {
            $lookup: {
                from: 'multilanguagefieleds', // Ensure 'from' field is included
                let: { specificationId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$sourceId', '$$specificationId'] },
                                    { $eq: ['$source', multi_languages_1.multiLanguageSources.ecommerce.specifications] },
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
                specificationTitle: 1,
                slug: 1,
                status: 1,
                createdAt: 1,
                specificationValues: {
                    $ifNull: ['$specificationValues', []]
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
            this.lookup,
            this.multilanguageFieldsLookup,
            this.project,
        ];
        return specifications_model_1.default.aggregate(pipeline).exec();
    }
    async getTotalCount(query = {}) {
        try {
            const totalCount = await specifications_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of specification');
        }
    }
    async create(specificationData) {
        const createSpecification = await specifications_model_1.default.create(specificationData);
        if (createSpecification) {
            const pipeline = [
                { $match: { _id: createSpecification._id } },
                this.lookup,
                this.multilanguageFieldsLookup,
                this.project,
            ];
            const createdSpecificationWithValues = await specifications_model_1.default.aggregate(pipeline);
            return createdSpecificationWithValues[0];
        }
        else {
            return null;
        }
    }
    async findOne(specificationId) {
        const specificationData = await specifications_model_1.default.findById(specificationId);
        if (specificationData) {
            const pipeline = [
                { $match: { _id: specificationData._id } },
                this.lookup,
                this.project,
                this.multilanguageFieldsLookup
            ];
            const SpecificationDataWithValues = await specifications_model_1.default.aggregate(pipeline);
            return SpecificationDataWithValues[0];
        }
        else {
            return null;
        }
    }
    async update(specificationId, specificationData) {
        const updateSpecification = await specifications_model_1.default.findByIdAndUpdate(specificationId, specificationData, { new: true, useFindAndModify: false });
        if (updateSpecification) {
            const pipeline = [
                { $match: { _id: updateSpecification._id } },
                this.lookup,
                this.multilanguageFieldsLookup,
                this.project
            ];
            const updatedSpecificationWithValues = await specifications_model_1.default.aggregate(pipeline);
            return updatedSpecificationWithValues[0];
        }
        else {
            return null;
        }
    }
    async specificationDetailsService(specificationId, specificationDetails) {
        try {
            if (specificationId) {
                const existingEntries = await specifications_detail_model_1.default.find({ specificationId: specificationId });
                if (existingEntries) {
                    const specificationDetailIDsToRemove = existingEntries
                        .filter(entry => !specificationDetails.some((data) => data._id === entry._id))
                        .map(entry => entry._id);
                    await specifications_detail_model_1.default.deleteMany({ specificationId: specificationId, _id: { $in: specificationDetailIDsToRemove } });
                }
                const inventryPricingPromises = await Promise.all(specificationDetails.map(async (data) => {
                    const existingEntry = await specifications_detail_model_1.default.findOne({ _id: data._id });
                    if (existingEntry) {
                        // Update existing document
                        await specifications_detail_model_1.default.findByIdAndUpdate(existingEntry._id, { ...data, specificationId: specificationId });
                    }
                    else {
                        // Create new document
                        await specifications_detail_model_1.default.create({ ...data, specificationId: specificationId });
                    }
                }));
                await Promise.all(inventryPricingPromises);
                return await specifications_detail_model_1.default.find({ specificationId: specificationId });
            }
            else {
                throw 'Could not find specification Id';
            }
        }
        catch (error) {
            console.error('Error in specificationDetailService:', error);
            throw error;
        }
    }
    async destroy(specificationId) {
        return specifications_model_1.default.findOneAndDelete({ _id: specificationId });
    }
    async findOneSpecification(data) {
        const resultSpecification = await specifications_model_1.default.findOne({ specificationTitle: data.specificationTitle });
        if (resultSpecification) {
            const specificationDetailResult = await this.findOneSpecificationDetail(data, resultSpecification._id);
            const result = {
                specificationId: resultSpecification._id,
                specificationDetailId: specificationDetailResult._id
            };
            return result;
        }
        else {
            const specificationData = {
                specificationTitle: data.specificationTitle,
                isExcel: true,
                slug: (0, helpers_1.slugify)(data.specificationTitle)
            };
            const specificationResult = await this.create(specificationData);
            if (specificationResult) {
                const specificationDetailResult = await this.findOneSpecificationDetail(data, specificationResult._id);
                const result = {
                    specificationId: specificationResult._id,
                    specificationDetailId: specificationDetailResult._id
                };
                return result;
            }
        }
    }
    async findOneSpecificationDetail(data, specificationId) {
        const resultBrand = await specifications_detail_model_1.default.findOne({ $and: [{ itemName: data.itemName }, { specificationId: specificationId }] });
        if (resultBrand) {
            return resultBrand;
        }
        else {
            const brandData = {
                specificationId: specificationId,
                itemName: data.itemName,
                itemValue: data.itemValue,
            };
            const brandResult = await specifications_detail_model_1.default.create(brandData);
            if (brandResult) {
                return brandResult;
            }
        }
    }
}
exports.default = new SpecificationService();
