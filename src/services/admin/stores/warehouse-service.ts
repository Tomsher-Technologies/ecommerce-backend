import { FilterOptionsProps, pagination } from '../../../components/pagination';

import WarehouseModel, { WarehouseProps } from '../../../model/admin/stores/warehouse-model';


class WarehouseService {
    async findAll(options: FilterOptionsProps = {}): Promise<WarehouseProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);
        let queryBuilder = WarehouseModel.find(query) 
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
            const totalCount = await WarehouseModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of warehouses');
        }
    }

    async create(WarehouseData: any): Promise<WarehouseProps> {
        return WarehouseModel.create(WarehouseData);
    }

    async findOne(warehouseId: string): Promise<WarehouseProps | null> {
        return WarehouseModel.findById(warehouseId);
    }

    async update(warehouseId: string, WarehouseData: any): Promise<WarehouseProps | null> {
        return WarehouseModel.findByIdAndUpdate(warehouseId, WarehouseData, { new: true, useFindAndModify: false });
    }

    async destroy(warehouseId: string): Promise<WarehouseProps | null> {
        return WarehouseModel.findOneAndDelete({ _id: warehouseId });
    }
}

export default new WarehouseService();
