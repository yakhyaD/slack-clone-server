import { Team } from './../entities/Team';
import { isAuth } from "../middlewares/isAuth";
import { MyContext } from "../type";
import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver, UseMiddleware } from "type-graphql";
import { Member } from '../entities/Member';
import { getConnection } from 'typeorm';
import { Channel } from '../entities/Channel';

@ObjectType()
export class TeamResponse {
    @Field(() => [Team], { nullable: true })
    teamsOwned?: Team[];

    @Field(() => [Member], { nullable: true })
    teamsInvited?: Member[];
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
            await Channel.create({
                name: "general",
                teamId: team.id
            }).save();
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    @Query(() => TeamResponse)
    @UseMiddleware(isAuth)
    async teams(
        @Ctx() { payload }: MyContext
    ) {
        /**
         * @teamInvited: team user is member of
         */
        const teamsInvited = await getConnection().getRepository(Member).find({
            relations: ["team", "team.channels"],
            where: { userId: parseInt(payload.userId) }
        });

        const teamsOwned = await Team.find({
            where: { ownerId: parseInt(payload.userId) },
            relations: ["channels"]
        });
        return { teamsInvited, teamsOwned };
    }

    @Query(() => Team)
    async team(
        @Arg("teamId") teamId: number,
    ) {
        return await getConnection().getRepository(Team).findOne({
            relations: ["channels", "users"],
            where: { id: teamId }
        });
    }
}
