import { Field, ObjectType } from 'type-graphql';
import { Entity, BaseEntity, PrimaryColumn, ManyToOne, JoinColumn } from "typeorm";
import { Team } from "./Team";
import { User } from "./User";

@ObjectType()
@Entity()
export class Member extends BaseEntity {

    @PrimaryColumn()
    userId: number;

    @PrimaryColumn()
    teamId: number;

    @Field(() => User, { nullable: true })
    @ManyToOne(() => User, user => user.teams, { primary: true })
    @JoinColumn({ name: "userId" })
    user: User;

    @Field(() => Team, { nullable: true })
    @ManyToOne(() => Team, team => team.users, { primary: true })
    @JoinColumn({ name: "teamId" })
    team: Team;
}
