import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Channel } from "./Channel";
import { Member } from "./Member";
import { User } from "./User";

@ObjectType()
@Entity()
export class Team extends BaseEntity {
    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column({ unique: true })
    name!: string;

    @Field()
    @Column()
    ownerId!: number;

    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field()
    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Member, m => m.user)
    users: User[];

    // @ManyToOne(() => User, owner => owner.teamsOwned)
    // owner: User;

    @Field(() => [Channel], { nullable: true })
    @OneToMany(() => Channel, channels => channels.team, {
        cascade: true
    })
    channels: Channel[];
}
