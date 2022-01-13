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
import { User } from "./entities/User";
import { createAccessToken, createRefreshToken, sendRefreshToken } from "./utils/handleToken";
import { MemberResolver } from "./resolvers/MemberResolver";
import { TeamResolver } from "./resolvers/TeamResolver";

// dotenv.config();
const port = process.env.PORT || 8000

const main = async () => {

    await createConnection(typeormConfig);
    const app = express();

    app.use(cookieParser());

    app.post("/refresh_token", async (req, res) => {
        const cookie = req.cookies.jid;

        if (!cookie) {
            return res.send({ ok: false, accessToken: "" });
        }
        let payload;
        try {
            payload = verify(cookie.token, process.env.REFRESH_TOKEN_SECRET!);

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
            resolvers: [UserResolver, TeamResolver, MemberResolver],
            validate: false,
        }),
        context: ({ req, res }) => ({
            req,
            res
        })
    })


    await apolloServer.start();

    apolloServer.applyMiddleware({
        app,
        cors: {
            credentials: true,
            origin: "https://studio.apollographql.com"
        }
    });

    app.listen(port, () => console.log(`server listening on port ${port} `));
}
main().catch((err) => console.error(err));
