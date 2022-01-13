import { Team } from "../entities/Team";

export const isTeamOwner = async (teamId: number, userId: number): Promise<Team | undefined> => {
    return Team.findOne({ where: { id: teamId, ownerId: userId } });
}
