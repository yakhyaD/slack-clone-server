require("dotenv").config();
import express from "express";
import 'reflect-metadata';
import { ApolloServer, gql } from "apollo-server-express";
// import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm"
import { typeormConfig } from "./typeorm.config";

// dotenv.config();
const port = process.env.PORT || 8000

const main = async () => {

    await createConnection(typeormConfig);
    const app = express();

    const typeDefs = gql`
    type Query {
        hello: String
    }
    `;
    const apolloServer = new ApolloServer({
        typeDefs,
        resolvers: {
            Query: {
                hello: () => 'Hello world!',
            }
        },
    })


    await apolloServer.start();

    apolloServer.applyMiddleware({ app });

    app.listen(port, () => console.log(`server listening on port ${port} `));
}

main().catch((err) => console.error(err));
