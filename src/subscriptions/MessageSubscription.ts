import { Arg, Subscription } from "type-graphql";
import { Message } from "../entities/Message";

export class MessageSubscription {

    @Subscription(() => Message, {
        topics: "ADD_MESSAGE",
        filter: ({ payload, args }) => args.channelId === payload.channelId
    })
    messageAdded(
        @Arg("channelId") channelId: string) {
        return Message.find({ where: { channelId } });
    }
}
