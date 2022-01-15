import { BASE_URL } from "../constants";

export const forgotPasswordEmail = (token: string) => (
    `<a href="${BASE_URL}/${token}">
        Reset Password
    </a>`
)
