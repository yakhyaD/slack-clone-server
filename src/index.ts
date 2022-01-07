require("dotenv").config();
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm"
import { typeormConfig } from "./typeorm.config";
import { UserResolver } from "./resolvers/UserResolver";
import 'reflect-metadata';

// dotenv.config();
const port = process.env.PORT || 8000

const main = async () => {

    await createConnection(typeormConfig);
    const app = express();

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [UserResolver],
            validate: false,
        })
    })


    await apolloServer.start();

    apolloServer.applyMiddleware({ app });

    app.listen(port, () => console.log(`server listening on port ${port} `));
}

main().catch((err) => console.error(err));
