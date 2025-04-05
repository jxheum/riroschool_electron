import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const algorithm = 'aes-256-cbc';
const keyFilePath = path.join(process.cwd(), 'encryption_key'); // 키를 저장할 파일 경로

// 암호화 키를 로드하거나 생성
function getKey() {
    if (fs.existsSync(keyFilePath)) {
        // 키 파일이 존재하면 키를 읽어옴
        return fs.readFileSync(keyFilePath);
    } else {
        // 키 파일이 없으면 새 키를 생성하고 저장
        const newKey = crypto.randomBytes(32); // 32바이트 키 생성
        fs.writeFileSync(keyFilePath, newKey);
        return newKey;
    }
}

const key = getKey(); // 암호화 키 로드

// 암호화 함수
export function encrypt(text) {
    const iv = crypto.randomBytes(16); // 암호화 시마다 새로운 IV 생성
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { encryptedData: encrypted, iv: iv.toString('hex') }; // IV를 함께 반환
}

// 복호화 함수
export function decrypt(encryptedData, ivHex) {
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(ivHex, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}