import { isTeamOwner } from './../utils/isTeamOwner';
import { isAuth } from "../middlewares/isAuth";
import { MyContext } from "../type";
import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver, UseMiddleware } from "type-graphql";
import { Channel } from '../entities/Channel';
import { getConnection } from 'typeorm';

@ObjectType()
export class CreateChannelResponse {
    @Field(() => Boolean)
    ok: boolean = false;

    @Field(() => String, { nullable: true })
    error: string;
}

@Resolver()
export class ChannelResolver {

    @Mutation(() => CreateChannelResponse)
    @UseMiddleware(isAuth)
    async createChannel(
        @Arg("name") name: string,
        @Arg("teamId") teamId: number,
        @Ctx() { payload }: MyContext
    ) {
        const team = await isTeamOwner(teamId, parseInt(payload.userId));
        if (!team) {
            return { error: "Not the team owner" }
        }
        const channel = await Channel.create({ name, teamId }).save();
        team.channels = team.channels ? [...team.channels, channel] : [channel];
        await team.save();
        return { ok: true };

    }
    @Query(() => Channel)
    async getChannel(
        @Arg("channelId") channelId: number,
    ) {
        return await getConnection().getRepository(Channel).findOne({
            relations: ["messages", "messages.user"],
            where: { id: channelId }
        });
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async deleteChannel(
        @Arg("channelId") channelId: number,
    ) {
        const channel = await Channel.findOne(channelId);
        if (!channel) {
            return false;
        }
        await channel.remove();
        return true;
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async updateChannel(
        @Arg("channelId") channelId: number,
        @Arg("name") name: string,
    ) {
        const channel = await Channel.findOne(channelId);
        if (!channel) {
            return false;
        }
        channel.name = name;
        await channel.save();
        return true;
    }

}
