export type StageType = "single" | "double" | "free" | "none";

interface BaseStage {
	id: number;
	title: string;
}

export interface SingleStage extends BaseStage {
	type: "single";
	timeLimit: number;
}

export interface DoubleStage extends BaseStage {
	type: "double";
	leftTimeLimit: number;
	rightTimeLimit: number;
}

export interface FreeStage extends BaseStage {
	type: "free";
	leftTimeLimit: number;
	rightTimeLimit: number;
	start: "left" | "right";
}

export interface NoneStage extends BaseStage {
	type: "none";
}

export type DebateStage = SingleStage | DoubleStage | FreeStage | NoneStage;

export interface DebateStages {
	id: string;
	name: string
	stages: DebateStage[];
}