import { sign } from 'jsonwebtoken';
import { User } from '../entities/User';
import { getConnection } from 'typeorm';

import { COOKIE_MAX_AGE, __prod__ } from '../constants';


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

export function sendRefreshToken(res, token) {
    res.cookie('jid', token, {
        httpOnly: true,
        path: '/refresh_token',
        secure: __prod__,
        maxAge: COOKIE_MAX_AGE,
        sameSite: "none"
    });
}

// revoke all token everytime we change or forgot our password
export function revoeRefreshToken(userId) {
    return getConnection().getRepository(User).increment({ id: userId }, 'tokenVersion', 1);
}
