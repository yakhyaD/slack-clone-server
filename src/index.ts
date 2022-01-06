import express from "express";
import { ApolloServer, gql } from "apollo-server-express";
// import { buildSchema } from "type-graphql";
const port = process.env.PORT || 8000

const main = async () => {
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
