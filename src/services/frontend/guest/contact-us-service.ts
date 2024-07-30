import { FilterOptionsProps, pagination } from '../../../../src/components/pagination';
import ContactUsModel, { ContactUsProps } from '../../../model/frontend/contact-us-model';



class ContactUsService {

    async create(contactUsData: any): Promise<ContactUsProps> {
        return ContactUsModel.create(contactUsData);
    }

}

export default new ContactUsService();
