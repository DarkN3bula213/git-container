import { debug } from 'console';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import supertest from 'supertest';
import { app } from '../src/app';

export const validUserData = {
	username: 'fazal22',
	email: 'fazal@admin.hps.com',
	name: 'Khawaja Fazal Ur Rehman',
	father_name: 'Khawaja Abdul Rasheed Rathore',
	gender: 'male',
	cnic: '34603-6721888-7',
	dob: '1974-11-22',
	cnic_issued_date: '2021-03-02',
	cnic_expiry_date: '2031-03-02',
	password: 'temp1234'
};

export const validCredentials = {
	email: 'fazal@admin.hps.com',
	password: 'temp1234'
};

export const WrongCredentials = {
	email: 'fazal@admin.hps.com',
	password: 'temp12345'
};

export const incompleteCredentials = {
	email: 'fazal@admin.hps.com'
};

export const classes = [
	{
		className: 'Prep',
		fee: 1050,
		section: ['A', 'B', 'C', 'D']
	},
	{
		className: 'Nursery',
		fee: 1000,
		section: ['A', 'B', 'C', 'D', 'E']
	},
	{
		className: '1st',
		fee: 1100,
		section: ['A', 'B', 'C', 'D']
	},
	{
		className: '2nd',
		fee: 1150,
		section: ['A', 'B', 'C', 'D']
	},
	{
		className: '3rd',
		fee: 1200,
		section: ['A', 'B', 'C', 'D']
	},
	{
		className: '4th',
		fee: 1250,
		section: ['A', 'B', 'C', 'D']
	},
	{
		className: '5th',
		fee: 1300,
		section: ['A', 'B', 'C', 'D']
	},
	{
		className: '6th',
		fee: 1500,
		section: ['A', 'B', 'C', 'D']
	},
	{
		className: '7th',
		fee: 1550,
		section: ['A', 'B', 'C', 'D']
	},
	{
		className: '8th',
		fee: 1700,
		section: ['A', 'B', 'C', 'D']
	},
	{
		className: '9th',
		fee: 2000,
		section: ['A', 'B']
	},
	{
		className: '10th',
		fee: 2300,
		section: ['A', 'B']
	}
];

export const updateClass = {
	className: 'Prep',
	fee: 100
};

export const defaultHeaders = {
	Origin: 'http://localhost:3000',
	'x-api-key': 'testapikey123'
};

type Options =
	| {
			type?: 'default';
			serverOptions?: NonNullable<
				Parameters<(typeof MongoMemoryServer)['create']>[0]
			>;
	  }
	| {
			type: 'replSet';
			serverOptions?: NonNullable<
				Parameters<(typeof MongoMemoryReplSet)['create']>[0]
			>;
	  };

export async function setup(options?: Options) {
	const type = options?.type ?? 'default';
	const serverOptions = options?.serverOptions;

	debug('Starting setup with options:', { type, serverOptions });

	debug('Starting mongo memory server');
	if (type !== 'replSet') {
		globalThis.__MONGO_DB__ = await MongoMemoryServer.create(serverOptions);
		globalThis.__MONGO_URI__ = globalThis.__MONGO_DB__.getUri();
	} else {
		globalThis.__MONGO_DB__ =
			await MongoMemoryReplSet.create(serverOptions);
		globalThis.__MONGO_URI__ = globalThis.__MONGO_DB__.getUri();
	}

	debug('Mongo URI:', globalThis.__MONGO_URI__);
}

export async function teardown() {
	debug('Starting teardown');
	if (globalThis.__MONGO_DB__) {
		debug('Stopping mongo memory server');
		await globalThis.__MONGO_DB__.stop();
	}
}

export const request = supertest(app);