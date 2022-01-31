import { Channel } from "../entities/Channel";
import { Message } from "../entities/Message";
import { User } from "../entities/User";
import { isAuth } from "../middlewares/isAuth";
import { MyContext } from "../type";
import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from "type-graphql";

@Resolver()
export class MessageResolver {

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async sendMessage(
        @Arg("text") text: string,
        @Arg("channelId") channelId: number,
        @Ctx() { payload }: MyContext
    ) {
        const channel = await Channel.findOne(channelId);
        const user = await User.findOne({ id: parseInt(payload.userId) })
        if (!channel) {
            return false;
        }
        await Message.create({
            text,
            channelId,
            user
        }).save();
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
}
