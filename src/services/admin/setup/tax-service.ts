import { FilterOptionsProps, pagination } from '../../../../src/components/pagination';

import TaxModel, { TaxProps } from '../../../../src/model/admin/setup/tax-model';


class TaxService {
    async findAll(options: FilterOptionsProps = {}): Promise<TaxProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);
        let queryBuilder = TaxModel.find(query) 
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
            const totalCount = await TaxModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of tax');
        }
    }

    async create(taxData: any): Promise<TaxProps> {
        return TaxModel.create(taxData);
    }

    async findOne(taxId: string): Promise<TaxProps | null> {
        return TaxModel.findById(taxId);
    }

    async update(taxId: string, taxData: any): Promise<TaxProps | null> {
        return TaxModel.findByIdAndUpdate(taxId, taxData, { new: true, useFindAndModify: false });
    }

    async destroy(taxId: string): Promise<TaxProps | null> {
        return TaxModel.findOneAndDelete({ _id: taxId });
    }
}

export default new TaxService();
