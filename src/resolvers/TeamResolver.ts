import { Team } from './../entities/Team';
import { isAuth } from "../middlewares/isAuth";
import { MyContext } from "../type";
import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver, UseMiddleware } from "type-graphql";
import { Channel } from '../entities/Channel';
import { Member } from '../entities/Member';
import { getConnection } from 'typeorm';

@ObjectType()
export class TeamResponse {
    @Field(() => [Team], { nullable: true })
    teamsOwned: Team[];

    @Field(() => [Member], { nullable: true })
    teamsInvited: Member[];
}

@Resolver()
export class TeamResolver {
    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async createTeam(
        @Arg("name") name: string,
        @Ctx() { payload }: MyContext
    ) {
        try {
            const team = await Team.create({ name, ownerId: parseInt(payload.userId) }).save();
            await Channel.create({ name: "general", teamId: team.id }).save();
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    @Query(() => TeamResponse)
    @UseMiddleware(isAuth)
    async getTeams(
        @Ctx() { payload }: MyContext
    ) {
        /**
         * @teamInvited: team user is member of
         */
        const teamsInvited = await getConnection().getRepository(Member).find({
            relations: ["team"],
            where: { userId: parseInt(payload.userId) }
        });

        const teamsOwned = await Team.find({ where: { ownerId: parseInt(payload.userId) } });
        return { teamsInvited, teamsOwned };
    }
}
