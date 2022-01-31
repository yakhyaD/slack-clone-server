import { MyContext } from '../type';
import { Member } from "../entities/Member";
import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver, UseMiddleware } from "type-graphql";
import { isAuth } from "../middlewares/isAuth";
import { Team } from '../entities/Team';
import { User } from '../entities/User';

@ObjectType()
class AddMemberResponse {
    @Field(() => Boolean)
    ok: boolean;

    @Field(() => String, { nullable: true })
    error: string;
}


@Resolver(Member)
export class MemberResolver {


    @Mutation(() => AddMemberResponse)
    @UseMiddleware(isAuth)
    async addMember(
        @Arg("username") username: string,
        @Arg("teamId") teamId: number,
        @Ctx() { payload }: MyContext
    ) {
        const team = await Team.findOne({ id: teamId });
        if (team!.ownerId !== parseInt(payload.userId)) {
            return {
                ok: false,
                error: "You are not the owner of this team"
            };
        }
        const user = await User.findOne(
            username.includes('@') ? { "email": username } : { "username": username }
        );
        if (!user) {
            return {
                ok: false,
                error: "User not found"
            }
        }
        await Member.create({ userId: user.id, teamId: team!.id }).save();
        return { ok: true };
    }

    @Query(() => [Member])
    async getMembers() {
        return Member.find();
    }
}
