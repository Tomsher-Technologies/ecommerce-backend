import { FilterOptionsProps, pagination } from '@components/pagination';
import SpecificationDetailModel from '@model/admin/ecommerce/specifications-detail-model';

import SpecificationModel, { SpecificationProps } from '@model/admin/ecommerce/specifications-model';


class SpecificationService {
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
            {
                $lookup: {
                    from: 'specificationdetails', 
                    localField: '_id', 
                    foreignField: 'specificationId', 
                    as: 'specificationValues'
                }
            },
            {
                $project: {
                    _id: 1,
                    specificationTitle: 1,
                    slug: 1,
                    createdAt: 1,
                    specificationValues: {
                        $ifNull: ['$specificationValues', []] 
                    }
                }
            }
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

    async create(specificationData: any): Promise<SpecificationProps> {
        return SpecificationModel.create(specificationData);
    }

    async findOne(specificationId: string): Promise<SpecificationProps | null> {
        return SpecificationModel.findById(specificationId);
    }

    async update(specificationId: string, specificationData: any): Promise<SpecificationProps | null> {
        return SpecificationModel.findByIdAndUpdate(specificationId, specificationData, { new: true, useFindAndModify: false });
    }

    async specificationDetailsService(specificationId: string | null, specificationDetails: any): Promise<SpecificationProps[]> {
        try {
            if (specificationId) {
                const existingEntries = await SpecificationDetailModel.find({ specificationId: specificationId });
                if (existingEntries) {
                    const specificationDetailIDsToRemove = existingEntries
                        .filter(entry => !specificationDetails.some((data: any) => data._id.toString() === entry._id.toString()))
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
}

export default new SpecificationService();
