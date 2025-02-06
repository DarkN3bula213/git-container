export interface IMigration {
	name: string;
	up: () => Promise<void>;
	down: () => Promise<void>;
}
