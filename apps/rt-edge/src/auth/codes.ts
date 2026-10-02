/**
 * Room-code, operator-code and device-cookie primitives (spec §4.10, §8.4; D33, DR5, DR7, DR10; O-9, O-10;
 * ports/auth.port.ts "Code hashing"). Both ends of every hash live here; the state module stores opaque strings.
 *
 * - room code: 6 Crockford base32 characters from a CSPRNG; stored as
 *   `hex(HMAC-SHA256(identity.secret('room-code-hmac'), 'room:' + normalizeEdgeCode(code)))`, so a stolen database
 *   alone cannot be brute-forced offline;
 * - operator code: minted in the cloud; the box checks scrypt over `normalizeOperatorCode(code)` with the delivered
 *   salt and cost, in constant time (same scrypt parameters as the Eclipse route: r 8, p 1);
 * - device binding: the `etab_edge_device` cookie holds 32 random bytes (base64url); only `hex(sha256(value))` is kept.
 *
 * Nothing here logs or returns a code value except `generateRoomCode` (shown once on the read-out card).
 */
import { createHash, createHmac, randomBytes, randomInt, scrypt, timingSafeEqual } from 'crypto';

import { EDGE_CODE_ALPHABET, ROOM_CODE_LENGTH } from '../contracts';
import type { OperatorCodeDelivery } from '../ports';

/** A fresh room code (normalized, e.g. `K7Q4M2`), uniformly random over the 32-letter alphabet. */
export function generateRoomCode(): string {
    let code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) code += EDGE_CODE_ALPHABET[randomInt(EDGE_CODE_ALPHABET.length)];
    return code;
}

/** The stored hash of a NORMALIZED room code. */
export function roomCodeHash(secret: Uint8Array, normalizedCode: string): string {
    return createHmac('sha256', secret).update(`room:${normalizedCode}`, 'utf8').digest('hex');
}

/** The audit digest of an email typed at sign-in start (keyed, so the audit log cannot be dictionary-reversed). */
export function emailDigest(secret: Uint8Array, email: string): string {
    return createHmac('sha256', secret).update(`email:${email.trim().toLowerCase()}`, 'utf8').digest('hex');
}

/** `hex(sha256(cookieValue))`: what the box stores and compares for the O-9 device binding. */
export function deviceHash(cookieValue: string): string {
    return createHash('sha256').update(cookieValue, 'utf8').digest('hex');
}

/** A new device cookie value: 32 random bytes, base64url (43 characters). */
export function newDeviceCookieValue(): string {
    return randomBytes(32).toString('base64url');
}

const DEVICE_COOKIE_RE = /^[A-Za-z0-9_-]{16,128}$/;

/** The presented device cookie when it is one the box could have set; anything else counts as no cookie. */
export function usableDeviceCookie(value: unknown): string | null {
    return typeof value === 'string' && DEVICE_COOKIE_RE.test(value) ? value : null;
}

/** Coarse device class for "Used 10:48 · iPad" (contract `RoomCodeRow.deviceLabel`). Never the raw User-Agent. */
export function deviceLabelOf(userAgent: string | null | undefined): string {
    const ua = String(userAgent ?? '');
    if (/\biPad\b/i.test(ua)) return 'iPad';
    if (/\b(iPhone|iPod)\b/i.test(ua)) return 'iPhone';
    if (/\bAndroid\b/i.test(ua)) return 'Android';
    if (/\bWindows\b/i.test(ua)) return 'Windows';
    if (/\bMacintosh\b|\bMac OS X\b/i.test(ua)) return 'Mac';
    return 'Other';
}

/** Largest scrypt cost the box accepts from the cloud (2^20): a bigger one would let a bad delivery stall the box. */
export const OPERATOR_CODE_MAX_SCRYPT_N = 1 << 20;

/**
 * Does `normalizedCode` match the delivered operator-code hash? Constant-time compare; a malformed delivery
 * (bad salt, hash, cost) never matches. scrypt runs on the libuv pool, so the event loop is not blocked.
 */
export function operatorCodeMatches(normalizedCode: string, delivery: Pick<OperatorCodeDelivery, 'alg' | 'salt' | 'hash' | 'scryptN'>): Promise<boolean> {
    return new Promise(resolve => {
        try {
            if (!delivery || delivery.alg !== 'scrypt') return resolve(false);
            const N = delivery.scryptN;
            if (!Number.isInteger(N) || N < 2 || N > OPERATOR_CODE_MAX_SCRYPT_N || (N & (N - 1)) !== 0) return resolve(false);
            const salt = Buffer.from(String(delivery.salt ?? ''), 'base64');
            const expected = Buffer.from(String(delivery.hash ?? ''), 'base64');
            if (!salt.length || expected.length < 16 || expected.length > 64) return resolve(false);
            scrypt(normalizedCode, salt, expected.length, { N, r: 8, p: 1, maxmem: 256 * N * 8 + 1024 * 1024 }, (error, actual) => {
                if (error || !actual || actual.length !== expected.length) return resolve(false);
                resolve(timingSafeEqual(actual, expected));
            });
        } catch {
            resolve(false);
        }
    });
}
