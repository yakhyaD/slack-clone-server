import { DirectMessage } from '../entities/DirectMessage';
import { Channel } from "../entities/Channel";
import { Message } from "../entities/Message";
import { isAuth } from "../middlewares/isAuth";
import { MyContext } from "../type";
import { Arg, Ctx, Mutation, Query, Resolver, Root, Subscription, UseMiddleware } from "type-graphql";
import { pubSub } from "../pubsub";

@Resolver()
export class MessageResolver {

    @Subscription(() => Message, {
        topics: "ADD_MESSAGE",
        filter: ({ payload, args }) => args.channelId === payload.channelId
    })
    async messageAdded(
        @Root() payload: Message,
        @Arg("channelId") channelId: number
    ) {
        return Message.findOne({ where: { channelId, id: payload.id }, relations: ["user"] });
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async sendMessage(
        @Arg("text") text: string,
        @Arg("channelId") channelId: number,
        @Ctx() { payload }: MyContext
    ) {
        const channel = await Channel.findOne(channelId);
        // const user = await User.findOne({ id: parseInt(payload.userId) })
        if (!channel) {
            return false;
        }
        const message = await Message.create({
            text,
            channelId,
            userId: parseInt(payload.userId)
        }).save();
        pubSub.publish("ADD_MESSAGE", message);
        return true;
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async deleteMessage(
        @Arg("messageId") messageId: number,
        @Ctx() { payload }: MyContext
    ) {
        const message = await Message.findOne({ id: messageId });
        if (message?.userId !== parseInt(payload.userId)) {
            return false;
        }
        await message.remove();
        return true;
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async sendDirectMessage(
        @Arg("text") text: string,
        @Arg("receiver") receiver: number,
        @Arg("teamId") teamId: number,
        @Ctx() { payload }: MyContext
    ) {
        try {
            await DirectMessage.create({
                text,
                senderId: parseInt(payload.userId),
                receiverId: receiver,
                teamId
            }).save();
            return true;
        } catch (e) {
            // console.log(e)
            return false;
        }
    }

    @Query(() => [DirectMessage])
    @UseMiddleware(isAuth)
    async directMessages(
        @Arg("teamId") teamId: number,
        @Arg("receiverId") receiverId: number,
        @Ctx() { payload }: MyContext
    ) {
        return DirectMessage.find({
            where: {
                teamId,
                senderId: parseInt(payload.userId),
                receiverId
            }
        });
    }
}
