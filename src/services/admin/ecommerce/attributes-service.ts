import mongoose from 'mongoose';
import { FilterOptionsProps, pagination } from '../../../components/pagination';
import { multiLanguageSources } from '../../../constants/multi-languages';
import AttributeDetailModel from '../../../model/admin/ecommerce/attribute-detail-model';

import AttributesModel, { AttributesProps } from '../../../model/admin/ecommerce/attribute-model';
import { slugify } from '../../../utils/helpers';


class AttributesService {
    private attributeDetailsLookup: any;
    private multilanguageFieldsLookup: any;
    private project: any;

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
                                    { $eq: ['$source', multiLanguageSources.ecommerce.attribute] },
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

    async findAll(options: FilterOptionsProps = {}): Promise<AttributesProps[]> {
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

            this.attributeDetailsLookup,
            this.multilanguageFieldsLookup,

            this.project
        ];

        return AttributesModel.aggregate(pipeline).exec();
    }

    async getTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await AttributesModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of attribute');
        }
    }

    async create(attributeData: any): Promise<AttributesProps | null> {
        const createdAttribute = await AttributesModel.create(attributeData);

        if (createdAttribute) {
            const pipeline = [
                { $match: { _id: createdAttribute._id } },
                this.attributeDetailsLookup,
                this.multilanguageFieldsLookup,

                this.project
            ];

            const createdAttributeWithValues = await AttributesModel.aggregate(pipeline);

            return createdAttributeWithValues[0];
        } else {
            return null;
        }
    }

    async findOne(attributeId: string): Promise<AttributesProps | null> {
        if (attributeId) {
            const objectId = new mongoose.Types.ObjectId(attributeId);
            const pipeline = [
                { $match: { _id: objectId } },
                this.attributeDetailsLookup,
                this.multilanguageFieldsLookup,

                this.project
            ];

            const attributeDataWithValues = await AttributesModel.aggregate(pipeline);

            return attributeDataWithValues[0];
        } else {
            return null;
        }
    }
    async findOneAttribute(data: any): Promise<void | null> {

        const resultAttribute: any = await AttributesModel.findOne({ attributeTitle: data.attribute });
        if (resultAttribute) {
            const attributeDetailResult = await this.findOneAttributeDetail(data, resultAttribute._id)
            // console.log("attributeDetailResult:",attributeDetailResult);

            const result: any = {
                resultAttribute,
                attributeDetailResult
            }
            return result
        } else {
            const attributeData = {
                attributeTitle: data.attribute,
                isExcel: true,
                slug: slugify(data.attribute)

            }
            // console.log("brandData:", attributeData);
            const attributeResult: any = await this.create(attributeData)
            if (attributeResult) {
                const attributeDetailResult = await this.findOneAttributeDetail(data.attributeDetailName, attributeResult[0]._id)
                // console.log("attributeDetailResult:",attributeDetailResult);

                const result: any = {
                    attributeResult,
                    attributeDetailResult
                }
                return result
            }
        }
    }

    async findOneAttributeDetail(data: any, attributeId: string): Promise<void | null> {
        // console.log("data",data,attributeId);

        const resultBrand: any = await AttributeDetailModel.findOne({ itemName: data.attributeName });
        if (resultBrand) {
            return resultBrand
        } else {
            const brandData = {
                attributeId: attributeId,
                itemName: data.attributeName,
                itemValue: data.attributeValue,

            }
            // console.log("brandData:", data);
            const brandResult: any = await AttributeDetailModel.create(brandData);
            if (brandResult) {
                return brandResult
            }
        }
    }

    async update(attributeId: string, attributeData: any): Promise<AttributesProps | null> {
        const updatedAttributes = await AttributesModel.findByIdAndUpdate(
            attributeId,
            attributeData,
            { new: true, useFindAndModify: false }
        );

        if (updatedAttributes) {
            const pipeline = [
                { $match: { _id: updatedAttributes._id } },
                this.attributeDetailsLookup,
                this.multilanguageFieldsLookup,

                this.project
            ];

            const updatedAttributesWithValues = await AttributesModel.aggregate(pipeline);

            return updatedAttributesWithValues[0];
        } else {
            return null;
        }
    }

    async attributeDetailsService(attributeId: string | null, attributeDetails: any): Promise<AttributesProps[]> {
        try {
            if (attributeId) {
                const existingEntries = await AttributeDetailModel.find({ attributeId: attributeId });
                if (existingEntries) {
                    const attributeDetailIDsToRemove = existingEntries
                        .filter(entry => !attributeDetails.some((data: any) => data?._id?.toString() === entry?._id?.toString()))
                        .map(entry => entry._id);
                    await AttributeDetailModel.deleteMany({ attributeId: attributeId, _id: { $in: attributeDetailIDsToRemove } });
                }
                const inventryPricingPromises = await Promise.all(attributeDetails.map(async (data: any) => {
                    const existingEntry = await AttributeDetailModel.findOne({ _id: data._id });
                    if (existingEntry) {
                        // Update existing document
                        await AttributeDetailModel.findByIdAndUpdate(existingEntry._id, { ...data, attributeId: attributeId });
                    } else {
                        // Create new document
                        await AttributeDetailModel.create({ ...data, attributeId: attributeId });
                    }
                }));

                await Promise.all(inventryPricingPromises);

                return await AttributeDetailModel.find({ attributeId: attributeId });
            } else {
                throw 'Could not find attribute Id';
            }

        } catch (error) {
            console.error('Error in attributeDetailsService:', error);
            throw error;
        }
    }


    async destroy(attributeId: string): Promise<AttributesProps | null> {
        return AttributesModel.findOneAndDelete({ _id: attributeId });
    }
}

export default new AttributesService();
