import { validateRegister } from './../utils/validateRegister';
import { AuthCredentials } from './../utils/AuthCredentials';
import { User } from "../entities/User";
import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver, UseMiddleware } from "type-graphql";
import argon2 from "argon2";
import { getConnection } from 'typeorm';
import { createAccessToken, createRefreshToken, sendRefreshToken } from "../utils/handleToken";
import { MyContext } from '../type';
import { isAuth } from '../middlewares/isAuth';

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
    access_token: string;
}


@Resolver(User)
export class UserResolver {

    @Query(() => String)
    @UseMiddleware(isAuth)
    me(
        @Ctx() { payload }: MyContext
    ) {
        return `I am user ${payload.userId} `;
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

}
