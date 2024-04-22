import { FilterOptionsProps, pagination } from '@components/pagination';

import BrandsModel, { BrandProps } from '@model/admin/ecommerce/brands-model';


class BrandsService {
    async findAll(options: FilterOptionsProps = {}): Promise<BrandProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);
        let queryBuilder = BrandsModel.find(query) 
        .skip(skip)
        .limit(limit)
        .lean();

        if (sort) {
            queryBuilder = queryBuilder.sort(sort);
        }

        return queryBuilder;
    }
    async getTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await BrandsModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of brands');
        }
    }

    async create(brandData: any): Promise<BrandProps> {
        return BrandsModel.create(brandData);
    }

    async findOne(brandId: string): Promise<BrandProps | null> {
        return BrandsModel.findById(brandId);
    }

    async update(brandId: string, brandData: any): Promise<BrandProps | null> {
        return BrandsModel.findByIdAndUpdate(brandId, brandData, { new: true, useFindAndModify: false });
    }

    async destroy(brandId: string): Promise<BrandProps | null> {
        return BrandsModel.findOneAndDelete({ _id: brandId });
    }

    async updateWebsitePriority(container1: any[] | undefined, columnKey: keyof BrandProps): Promise<void> {
        try {
            // Set columnKey to '0' for all documents initially
            await BrandsModel.updateMany({ [columnKey]: { $gt: '0' } }, { [columnKey]: '0' });

            if (container1 && container1.length > 0) {
                // Loop through container1 and update [mode] for each corresponding document
                for (let i = 0; i < container1.length; i++) {
                    const brandId = container1[i];
                    const brand = await BrandsModel.findById(brandId);
                    if (brand) {
                        (brand as any)[columnKey] = (i + 1).toString();
                        await brand.save({ validateBeforeSave: false });
                    }
                }
            }
        } catch (error) {
            throw new Error(error + 'Failed to update ' + columnKey);
        }
    }
}

export default new BrandsService();
