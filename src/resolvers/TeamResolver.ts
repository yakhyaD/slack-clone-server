import { Team } from './../entities/Team';
import { isAuth } from "../middlewares/isAuth";
import { MyContext } from "../type";
import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver, UseMiddleware } from "type-graphql";
import { Member } from '../entities/Member';
import { getConnection } from 'typeorm';
import { Channel } from '../entities/Channel';
// import { User } from 'src/entities/User';
import { User } from '../entities/User';

@ObjectType()
export class TeamResponse {
    @Field(() => [Team], { nullable: true })
    teamsOwned?: Team[];

    @Field(() => [Member], { nullable: true })
    teamsInvited?: Member[];
}

@ObjectType()
export class SingleTeam {
    @Field()
    id!: number;

    @Field()
    name!: string;

    @Field()
    ownerId!: number;

    @Field()
    createdAt: Date;

    @Field(() => [User], { nullable: true })
    users: User[]

    @Field(() => [Channel], { nullable: true })
    channels: Channel[]
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
            await Member.create({ userId: parseInt(payload.userId), teamId: team.id }).save();
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

    @Query(() => [Team])
    @UseMiddleware(isAuth)
    async teams(
        @Ctx() { payload }: MyContext
    ) {
        const res = await getConnection().getRepository(Member).find({
            relations: ["team", "team.channels", "team.users"],
            where: { userId: parseInt(payload.userId) }
        });
        return [...res.map(r => r.team)];
    }

    @Query(() => SingleTeam)
    async team(
        @Arg("teamId") teamId: number,
    ) {
        const team = await getConnection().getRepository(Team).findOne({
            relations: ["channels", "channels.messages"],
            where: { id: teamId }
        });
        if (!team) {
            return { error: "Team not found" };
        }
        console.log(team)
        return team;
    }


    @Query(() => [User])
    @UseMiddleware(isAuth)
    async members(
        @Arg("teamId") teamId: number,
        @Ctx() { payload }: MyContext
    ) {
        const members = await getConnection().getRepository(Member).find({
            relations: ["user"],
            where: { teamId }
        });
        return [...members.map(m => m.user).filter(user => user.id !== parseInt(payload.userId))];
    }

}
