import { Team } from './../entities/Team';
import { isAuth } from "../middlewares/isAuth";
import { MyContext } from "../type";
import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver, UseMiddleware } from "type-graphql";
import { Member } from '../entities/Member';
import { getConnection } from 'typeorm';
import { Channel } from '../entities/Channel';
// import { User } from '../entities/User';

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

    @Field(() => [Member], { nullable: true })
    users: Member[]

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
        // const user = await User.findOne({ id: parseInt(payload.userId) })
        /**
         * @teamInvited: team user is member of
        */
        // const teamsInvited = [] as Team[];

        const res = await getConnection().getRepository(Member).find({
            relations: ["team", "team.channels", "team.users"],
            where: { userId: parseInt(payload.userId) }
        });
        console.log(res)
        console.log([...res.map(r => r.team)])
        return [...res.map(r => r.team)];
        // if (res.length > 0) {
        //     console.log(res)
        //     res.forEach(item => {
        //         teamsInvited.push(item.team)
        //     })
        // }


        // const teamsOwned = await Team.find({
        //     where: { users: user },
        //     relations: ["channels"]
        // });
        // console.log(teamsOwned)
        // return teamsOwned;
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

}
