import { FilterOptionsProps, pagination } from '../../../../src/components/pagination';
import ContactUsModel, { ContactUsProps } from '../../../model/frontend/contact-us-model';



class ContactUsService {

    async create(languageData: any): Promise<ContactUsProps> {
        return ContactUsModel.create(languageData);
    }

}

export default new ContactUsService();
