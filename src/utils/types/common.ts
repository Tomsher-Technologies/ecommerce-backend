
export interface QueryParams {
    _id?: string;
    page_size?: string;
    limit?: string;
    status?: string;
    sortby?: string;
    sortorder?: string;
    keyword?: string;
    countryId?: string;
    userTypeID?: string;
    subject?: string;
}

export interface UserDataProps {
    _id: string;
    userTypeID: string;
    countryId: string;
    firstName: string;
    phone: string;
    status: string;
}

export interface QueryParamsWithPage {
    _id?: string;
    page_size?: string;
    limit?: string;
    status?: string;
    sortby?: string;
    sortorder?: string;
    keyword?: string;
    page?: string;
    pageReference?: string;
    countryId?: string;
}

