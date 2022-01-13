import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, UpdateDateColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Channel } from "./Channel";
import { User } from "./User";

@ObjectType()
@Entity()
export class Message extends BaseEntity {

    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column({ type: "text" })
    text!: string;

    @Field()
    @Column()
    userId: number;

    @Field()
    @Column()
    channelId: number;

    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field()
    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => Channel, channel => channel.messages)
    channel: Channel;

    @Field(() => User)
    @ManyToOne(() => User, user => user.messages)
    user: User;

}
