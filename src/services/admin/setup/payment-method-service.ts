import { FilterOptionsProps, pagination } from '../../../components/pagination';

import PaymentMethodModel, { PaymentMethodProps } from '../../../model/admin/setup/payment-methods-model';
import { paymentMethodLookup, paymentMethodProject } from '../../../utils/config/payment-method-config';


class PaymentMethodService {
    async findAll(options: FilterOptionsProps = {}): Promise<PaymentMethodProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);

        const defaultSort = { createdAt: 1 };
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

            paymentMethodLookup,
            paymentMethodProject,
        ];

        return PaymentMethodModel.aggregate(pipeline).exec();
    }
    async getTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await PaymentMethodModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of payment methods');
        }
    }

    async create(paymentMethodData: any): Promise<PaymentMethodProps> {
        return PaymentMethodModel.create(paymentMethodData);
    }

    async findOne(paymentMethodId: string): Promise<PaymentMethodProps | null> {
        return PaymentMethodModel.findById(paymentMethodId);
    }

    async findOneByPaymentMethodCode(paymentMethodCode: string): Promise<PaymentMethodProps | null> {
        const result: any = await PaymentMethodModel.findOne({ paymentMethodCode: paymentMethodCode });
        return result._id
    }

    async update(paymentMethodId: string, paymentMethodData: any): Promise<PaymentMethodProps | null> {
        return PaymentMethodModel.findByIdAndUpdate(paymentMethodId, paymentMethodData, { new: true, useFindAndModify: false });
    }

    async destroy(paymentMethodId: string): Promise<PaymentMethodProps | null> {
        return PaymentMethodModel.findOneAndDelete({ _id: paymentMethodId });
    }
    async findPaymentMethod(data: any): Promise<PaymentMethodProps | null> {
        return PaymentMethodModel.findOne(data);
    }
    async findPaymentMethodId(data: any): Promise<void | null> {
        const resultPaymentMethod: any = await PaymentMethodModel.findOne(data);
        if (resultPaymentMethod) {
            return resultPaymentMethod
        }
    }
}

export default new PaymentMethodService();
