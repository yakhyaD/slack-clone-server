import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, ManyToOne, OneToMany } from "typeorm";
import { Message } from "./Message";
import { Team } from "./Team";

@ObjectType()
@Entity()
export class Channel extends BaseEntity {
    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column()
    name!: string;

    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field()
    @UpdateDateColumn()
    updatedAt: Date;

    @Field()
    @Column()
    teamId!: number;

    @ManyToOne(() => Team, team => team.channels)
    team: Team;

    @OneToMany(() => Message, messages => messages.channel, {
        cascade: true
    })
    messages: Message[];
}
