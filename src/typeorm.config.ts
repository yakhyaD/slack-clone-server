import path from 'path';
import { Channel } from './entities/Channel';
import { DirectMessage } from './entities/DirectMessage';
import { Member } from './entities/Member';
import { Message } from './entities/Message';
import { Team } from './entities/Team';
import { User } from './entities/User';


export const typeormConfig: any = {
    type: process.env.DB_TYPE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    logging: true,
    synchronize: true,
    entities: [User, Team, Channel, Message, Member, DirectMessage],
    migrations: [path.join(__dirname, './migrations/*.js|ts')],
    cli: {
        "migrationsDir": path.join(__dirname, './migrations')
    }
}
