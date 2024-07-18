import { FilterOptionsProps, pagination } from '../../../components/pagination';
import SpecificationDetailModel from '../../../model/admin/ecommerce/specifications-detail-model';
import { multiLanguageSources } from '../../../constants/multi-languages';

import SpecificationModel, { SpecificationProps } from '../../../model/admin/ecommerce/specifications-model';
import { capitalizeWords, slugify } from '../../../utils/helpers';
import GeneralService from '../../../services/admin/general-service';


class SpecificationService {
    private lookup: any;
    private multilanguageFieldsLookup: any;
    private project: any;

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
                                    { $eq: ['$source', multiLanguageSources.ecommerce.specifications] },
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
                specificationDisplayName: 1,
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
        }

    }
    async findAll(options: FilterOptionsProps = {}): Promise<SpecificationProps[]> {
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
            this.lookup,
            this.multilanguageFieldsLookup,
            this.project,

        ];

        return SpecificationModel.aggregate(pipeline).exec();
    }
    async getTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await SpecificationModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of specification');
        }
    }

    async create(specificationData: any): Promise<SpecificationProps | null> {
        const createSpecification = await SpecificationModel.create(specificationData);
        if (createSpecification) {
            const pipeline = [
                { $match: { _id: createSpecification._id } },
                this.lookup,
                this.multilanguageFieldsLookup,
                this.project,
            ];

            const createdSpecificationWithValues = await SpecificationModel.aggregate(pipeline);

            return createdSpecificationWithValues[0];
        } else {
            return null;
        }
    }

    async findOne(specificationId: string): Promise<SpecificationProps | null> {
        const specificationData = await SpecificationModel.findById(specificationId);
        if (specificationData) {
            const pipeline = [
                { $match: { _id: specificationData._id } },
                this.lookup,
                this.project,
                this.multilanguageFieldsLookup
            ];

            const SpecificationDataWithValues = await SpecificationModel.aggregate(pipeline);

            return SpecificationDataWithValues[0];
        } else {
            return null;
        }
    }

    async update(specificationId: string, specificationData: any): Promise<SpecificationProps | null> {
        const updateSpecification = await SpecificationModel.findByIdAndUpdate(specificationId, specificationData, { new: true, useFindAndModify: false });
        if (updateSpecification) {
            const pipeline = [
                { $match: { _id: updateSpecification._id } },
                this.lookup,
                this.multilanguageFieldsLookup,
                this.project
            ];

            const updatedSpecificationWithValues = await SpecificationModel.aggregate(pipeline);

            return updatedSpecificationWithValues[0];
        } else {
            return null;
        }
    }

    async specificationDetailsService(specificationId: string | null, specificationDetails: any): Promise<SpecificationProps[]> {
        try {
            if (specificationId) {
                const existingEntries = await SpecificationDetailModel.find({ specificationId: specificationId });
                if (existingEntries) {
                    const specificationDetailIDsToRemove = existingEntries
                        .filter(entry => !specificationDetails.some((data: any) => data._id === entry._id))
                        .map(entry => entry._id);
                    await SpecificationDetailModel.deleteMany({ specificationId: specificationId, _id: { $in: specificationDetailIDsToRemove } });
                }
                const inventryPricingPromises = await Promise.all(specificationDetails.map(async (data: any) => {
                    const existingEntry = await SpecificationDetailModel.findOne({ _id: data._id });
                    if (existingEntry) {
                        // Update existing document
                        await SpecificationDetailModel.findByIdAndUpdate(existingEntry._id, { ...data, specificationId: specificationId });
                    } else {
                        // Create new document
                        await SpecificationDetailModel.create({ ...data, specificationId: specificationId });
                    }
                }));

                await Promise.all(inventryPricingPromises);

                return await SpecificationDetailModel.find({ specificationId: specificationId });
            } else {
                throw 'Could not find specification Id';
            }

        } catch (error) {
            console.error('Error in specificationDetailService:', error);
            throw error;
        }
    }


    async destroy(specificationId: string): Promise<SpecificationProps | null> {
        return SpecificationModel.findOneAndDelete({ _id: specificationId });
    }

    async findOneSpecification(data: any): Promise<void | null> {

        const resultSpecification: any = await SpecificationModel.findOne({ specificationTitle: data.specificationTitle.trim() });

        if (resultSpecification) {
            const specificationDetailResult: any = await this.findOneSpecificationDetail(data, resultSpecification._id)

            const result: any = {
                specificationId: resultSpecification._id,
                specificationDetailId: specificationDetailResult._id
            }
            return result
        } else {
            const specificationData = {
                specificationTitle: capitalizeWords(data.specificationTitle),
                specificationDisplayName: data.specificationDisplayName,
                isExcel: true,
                slug: slugify(data.specificationTitle)
            }
            const specificationResult: any = await this.create(specificationData)
            if (specificationResult) {
                const specificationDetailResult: any = await this.findOneSpecificationDetail(data, specificationResult._id)

                const result: any = {
                    specificationId: specificationResult._id,
                    specificationDetailId: specificationDetailResult._id
                }
                return result
            }
        }
    }

    async findOneSpecificationDetail(data: any, specificationId: string): Promise<void | null> {
        const resultBrand: any = await SpecificationDetailModel.findOne({ $and: [{ itemName: data.itemName }, { specificationId: specificationId }] });
        if (resultBrand) {
            return resultBrand
        } else {
            const brandData = {
                specificationId: specificationId,
                itemName: data.itemName,
                itemValue: data.itemValue,

            }
            const brandResult: any = await SpecificationDetailModel.create(brandData);
            if (brandResult) {
                return brandResult
            }
        }
    }

}

export default new SpecificationService();
