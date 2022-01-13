import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, UpdateDateColumn, ManyToOne, PrimaryGeneratedColumn, PrimaryColumn, JoinColumn } from "typeorm";
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
    @PrimaryColumn()
    userId: number;

    @Field()
    @PrimaryColumn()
    channelId: number;

    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field()
    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => Channel, channel => channel.messages)
    @JoinColumn({ name: "channelId" })
    channel: Channel;

    @Field(() => User)
    @JoinColumn({ name: "userId" })
    @ManyToOne(() => User, user => user.messages)
    user: User;

}
