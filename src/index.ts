require("dotenv").config();
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm"
import { typeormConfig } from "./typeorm.config";
import { UserResolver } from "./resolvers/UserResolver";
import 'reflect-metadata';
import cookieParser from "cookie-parser";
import { verify } from "jsonwebtoken";
import { createServer } from 'http';
import { execute, subscribe } from 'graphql';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import cors from "cors";

import { User } from "./entities/User";
import { createAccessToken, createRefreshToken, sendRefreshToken } from "./utils/handleToken";
import { MemberResolver } from "./resolvers/MemberResolver";
import { TeamResolver } from "./resolvers/TeamResolver";
import { ChannelResolver } from "./resolvers/ChannelResolver";
import { MessageResolver } from "./resolvers/MessageResolver";
import { redis } from "./redis"
import { __prod__ } from "./constants";
import { pubSub } from "./pubsub";

const port = process.env.PORT || 8000


const main = async () => {

    await createConnection(typeormConfig);

    const app = express();

    const httpServer = createServer(app);

    app.use(cors({
        origin: [
            "https://studio.apollographql.com",
            process.env.PUBLIC_FRONT_URL as string,
        ],
        credentials: true
    }))
    app.use(cookieParser());

    app.post("/refresh_token", async (req, res) => {
        const refresh_token = req.cookies.jid;

        if (!refresh_token) {
            return res.send({ ok: false, accessToken: "" });
        }
        let payload;
        try {
            payload = verify(refresh_token, process.env.REFRESH_TOKEN_SECRET!);
        } catch (err) {
            console.log(err);
            res.send({ ok: false, accessToken: "" });
        }
        const user = await User.findOne({ id: payload.userId });
        if (!user) {
            return res.send({ ok: false, accessToken: "" });
        }

        if (user.tokenVersion !== payload.tokenVersion) {
            return res.send({ ok: false, accessToken: "" });
        }

        sendRefreshToken(res, createRefreshToken(user));
        return res.send({ ok: true, accessToken: createAccessToken(user) })

    })


    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [UserResolver, TeamResolver, MemberResolver, ChannelResolver, MessageResolver],
            validate: false,
            pubSub
        }),
        context: ({ req, res }) => ({
            req,
            res,
            redis
        })
    })

    await apolloServer.start();

    apolloServer.applyMiddleware({
        app,
        cors: false
    });


    httpServer.listen(port, async () => {
        SubscriptionServer.create({
            schema: await buildSchema({
                resolvers: [UserResolver, TeamResolver, MemberResolver, ChannelResolver, MessageResolver],
                pubSub
            }),
            execute,
            subscribe
        },
            {
                server: httpServer,
                path: apolloServer.graphqlPath
            }
        );
        console.log(`server listening on port ${port} `)
    });
}
main().catch((err) => console.error(err));
