import { FilterOptionsProps, pagination } from '@components/pagination';
import AttributeDetailModel from '@model/admin/ecommerce/attribute-detail-model';

import AttributesModel, { AttributesProps } from '@model/admin/ecommerce/attribute-model';


class AttributesService {
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
            {
                $lookup: {
                    from: 'attributedetails', // Collection name of AttributeDetailModel
                    localField: '_id', // Field in AttributesModel
                    foreignField: 'attributeId', // Field in AttributeDetailModel
                    as: 'attributeValues'
                }
            },
            {
                $project: {
                    _id: 1,
                    attributeTitle: 1,
                    en_attributeLabel: 1,
                    ar_attributeLabel: 1,
                    createdAt: 1,
                    attributeValues: {
                        $ifNull: ['$attributeValues', []] 
                    }
                }
            }
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

    async create(attributeData: any): Promise<AttributesProps> {
        return AttributesModel.create(attributeData);
    }

    async findOne(attributeId: string): Promise<AttributesProps | null> {
        return AttributesModel.findById(attributeId);
    }

    async update(attributeId: string, attributeData: any): Promise<AttributesProps | null> {
        return AttributesModel.findByIdAndUpdate(attributeId, attributeData, { new: true, useFindAndModify: false });
    }

    async attributeDetailsService(attributeId: string | null, attributeDetails: any): Promise<AttributesProps[]> {
        try {
            if (attributeId) {
                const existingEntries = await AttributeDetailModel.find({ attributeId: attributeId });
                if (existingEntries) {
                    const attributeDetailIDsToRemove = existingEntries
                        .filter(entry => !attributeDetails.some((data: any) => data._id.toString() === entry._id.toString()))
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
