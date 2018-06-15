import * as crypto from 'crypto';
import { Db } from 'mongodb';
import * as pathSep from 'path';
import * as fs from 'fs';
import * as index from './index';
import { config } from './config';
export class Util {

	// tslint:disable:indent
	public static getDb(request: any): Db {
		return request.mongo.db;
	}
	public static uniqid() {
		const uniqid = require('uniqid');
		return uniqid();
	}
	public static uploadRootPath() {
		const path = __dirname + '../upload';
		return path;
	}
	public static hash(data: any) {
		const hash = crypto.createHash('sha256');
		hash.update(JSON.stringify(data));
		const key = hash.digest('hex');
		return key;
	}
	public static jwtKey() {
		return '6C76rmkogGjhnILHgdVfogcn5cYMvjZk';
	}
	public static async writeLog(request, payload, collection) {
		try {
			const mongo = Util.getDb(request);
			const insertlog = await mongo.collection(collection).insert(payload);
		} catch (error) {
			return false;
		}
	}
	public static existFolder(path) {
		return fs.existsSync(path);
	}
	public static mkdirFolder(path) {
		return fs.mkdirSync(path);
	}
	public static unlinkFile(path) {
		return fs.unlinkSync(path);
	}
	public static isRefreshAvailable(end: number) {
		const now = Date.now();
		let toString = end.toString();
		// change END length form 10 to be 13
		if (end.toString().length === 10) {
			toString += '000';
		}
		end = Number(toString);
		if (now < end && (end - now) <= config.jwt.refreshInterval) { return true; }
		return false;
	}
}
