import { sign } from 'jsonwebtoken';
import { User } from '../entities/User';
import { getConnection } from 'typeorm';
import { Response } from 'express';

import { __prod__ } from '../constants';


export function createAccessToken(user) {
    return sign(
        {
            userId: user.id,
        },
        process.env.ACCESS_TOKEN_SECRET!,
        {
            expiresIn: '15m',
        }
    )
}
export function createRefreshToken(user) {
    return sign(
        { userId: user.id, tokenVersion: user.tokenVersion },
        process.env.REFRESH_TOKEN_SECRET!,
        {
            expiresIn: '7d',
        }
    )
}

export function sendRefreshToken(res: Response, token: string) {
    res.cookie('jid', token, {
        httpOnly: true,
        // path: '/refresh_token',
        secure: __prod__,
        // maxAge: COOKIE_MAX_AGE,
        sameSite: __prod__ ? "none" : "lax"
    });
}

// revoke all token everytime we change or forgot our password
export async function revoeRefreshToken(userId) {
    return getConnection().getRepository(User).increment({ id: userId }, 'tokenVersion', 1);
}
