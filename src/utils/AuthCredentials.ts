import { InputType, Field } from "type-graphql";

@InputType()
export class AuthCredentials {
    @Field()
    username: string;

    @Field()
    email: string;

    @Field()
    password: string;
}
