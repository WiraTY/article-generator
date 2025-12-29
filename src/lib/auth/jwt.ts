import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET_KEY || 'default-secret-key-change-me-in-prod';
const key = new TextEncoder().encode(SECRET_KEY);

export interface SessionPayload {
    userId: number;
    email: string;
    name: string;
    role: 'super_admin' | 'author' | 'user';
    [key: string]: any;
}

export async function signSession(payload: SessionPayload): Promise<string> {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d') // 7 days
        .sign(key);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(token, key);
        return payload as unknown as SessionPayload;
    } catch (error) {
        return null;
    }
}
