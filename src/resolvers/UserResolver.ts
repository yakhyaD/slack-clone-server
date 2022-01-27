import { validateRegister } from './../utils/validateRegister';
import { AuthCredentials } from './../utils/AuthCredentials';
import { User } from "../entities/User";
import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver, UseMiddleware } from "type-graphql";
import argon2 from "argon2";
import { getConnection } from 'typeorm';
import { createAccessToken, createRefreshToken, sendRefreshToken } from "../utils/handleToken";
import { MyContext } from '../type';
import { isAuth } from '../middlewares/isAuth';
import { FORGOT_PASSWORD } from '../constants';
import { sendMail } from '../utils/sendMail';
import { v4 as uuidV4 } from 'uuid';
import { forgotPasswordEmail } from '../utils/emailMarkup';

@ObjectType()
class ErrorField {
    @Field(() => String)
    field: string;

    @Field(() => String)
    message: string;
}
@ObjectType()
class UserResponse {
    @Field(() => [ErrorField], { nullable: true })
    errors?: ErrorField[]

    @Field(() => User, { nullable: true })
    user?: User;

    @Field(() => String, { nullable: true })
    access_token?: string;
}


@Resolver(User)
export class UserResolver {

    @Query(() => User, { nullable: true })
    @UseMiddleware(isAuth)
    async me(
        @Ctx() { payload }: MyContext
    ) {
        return User.findOne({ id: parseInt(payload.userId) });
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg("options") options: AuthCredentials,
    ) {
        const errors = validateRegister(options);

        if (errors) {
            return {
                errors
            }
        }
        const hashedPassword = await argon2.hash(options.password);
        let user;
        try {
            const result = await getConnection()
                .createQueryBuilder()
                .insert()
                .into(User)
                .values({
                    username: options.username,
                    email: options.email,
                    password: hashedPassword
                })
                .returning("*")
                .execute();
            user = result.raw[0];
        } catch (error) {
            if (error.code === '23505') {
                if (error.detail.includes('@')) {
                    return {
                        errors: [{
                            field: "email ",
                            message: "email already exists"
                        }],
                    }
                } else {
                    return {
                        errors: [{
                            field: "username ",
                            message: "Username already exists"
                        }],
                    }
                }
            }
        }
        return { user };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("username") username: string,
        @Arg("password") password: string,
        @Ctx() { res }: MyContext
    ) {

        const user = await User.findOne(
            username.includes('@') ? { "email": username } : { "username": username }
        );
        if (!user) {
            return {
                errors: [{
                    field: "username",
                    message: "user not found"
                }]
            }
        }
        const valid = await argon2.verify(user.password, password);
        // console.log("valid password", valid);
        if (!valid) {
            console.log("invalid password");
            return {
                errors: [{
                    field: "password",
                    message: "password is incorrect"
                }]
            }
        }


        sendRefreshToken(res, createRefreshToken(user));

        return {
            user,
            access_token: createAccessToken(user)
        };
    }
    @Mutation(() => Boolean)
    logout() {
        return true;
    }

    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg("email") email: string,
        @Ctx() { redis }: MyContext,
    ) {
        const user = await User.findOne({ email });
        if (!user) {
            return false
        }
        const token = uuidV4()
        const key = FORGOT_PASSWORD + token;
        // token expires in 15 minutes
        await redis.set(key, `${user.id}`, "ex", 1000 * 60 * 15);
        await sendMail(email, forgotPasswordEmail(token))
        return true;
    }

    @Mutation(() => UserResponse)
    async resetPassword(
        @Arg("newPassword") newPassword: string,
        @Arg("token") token: string,
        @Ctx() { res, redis }: MyContext
    ): Promise<UserResponse> {
        const key = FORGOT_PASSWORD + token
        const redisValue = await redis.get(key)

        if (!redisValue) {
            return {
                errors: [{
                    field: "token",
                    message: "Token expired"
                }]
            }
        }
        if (newPassword.length < 3) {
            return {
                errors: [{
                    field: "password",
                    message: "Password must be at least 3 characters"
                }]
            }
        }
        const user = await User.findOne({ id: parseInt(redisValue + "") });
        if (!user) {
            return {
                errors: [{
                    field: "token",
                    message: "User not found"
                }]
            }
        }
        const samePassword = await argon2.verify(user.password, newPassword);
        if (samePassword) {
            return {
                errors: [{
                    field: "password",
                    message: "New password must be different from old password"
                }]
            }
        }
        sendRefreshToken(res, createRefreshToken(user));
        redis.del(key)

        const hashedPassword = await argon2.hash(newPassword)
        await User.update(user.id, {
            password: hashedPassword,
            tokenVersion: user.tokenVersion + 1
        })

        return {
            user,
            access_token: createAccessToken(user)
        }
    }

}
