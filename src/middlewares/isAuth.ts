import { MyContext } from "../type";
import { MiddlewareFn } from "type-graphql";
import { verify } from "jsonwebtoken";

export const isAuth: MiddlewareFn<MyContext> = ({ context }, next) => {
    const AuthHeader = context.req.headers["authorization"];
    const token = AuthHeader?.split(" ")[1];
    if (!token) {
        throw new Error("Not authenticated");
    }
    let payload;
    try {
        payload = verify(token, process.env.ACCESS_TOKEN_SECRET!);
        context.payload = payload;
    } catch (error) {
        console.log(error);
        throw new Error("Not authenticated");
    }

    return next();
}
