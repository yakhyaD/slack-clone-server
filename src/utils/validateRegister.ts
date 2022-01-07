import { AuthCredentials } from "./AuthCredentials"

const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/

export const validateRegister = (options: AuthCredentials) => {
    if (options.username.length < 3) {
        return [
            {
                field: "username",
                message: "Username must be at least 4 characters long"
            }
        ]
    }
    if (options.password.length < 3) {
        return [
            {
                field: "password",
                message: "Password must be at least 4 characters long"
            }
        ]
    }
    if (options.username.includes('@')) {
        return [
            {
                field: "username",
                message: "username cannot contains @ sign"
            }
        ]
    }
    if (!EMAIL_REGEX.test(options.email)) {
        return [
            {
                field: "email",
                message: "Invalid email"
            }
        ]
    }
    return null;
}
