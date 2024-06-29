import { ObjectId } from "mongoose"
import { CustomrProps } from "../../model/frontend/customers-model"

export const smsGatwayDefaultValues = (username: any, password: any, sender: any, customer: any) => {

    return {
        username,
        password,
        sender,
        recipient: customer.phone,
        message: 'Dear ..., OTP for our registration in timehouse is ' + customer.otp + '. Keep this as confidential.',
    }
}