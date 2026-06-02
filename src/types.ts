
interface BaseStage {
	id: string;
	title: string;
}

// 1. 单计时器环节（比如：正方立论）
export interface SingleStage extends BaseStage {
	type: "single";
	timeLimit: number;
}

// 2. 双计时器/自由辩环节（比如：自由辩论、奇袭）
export interface MultiStage extends BaseStage {
	type: "double" | "free";
	leftTimeLimit: number;
	rightTimeLimit: number;
}

export interface NoneStage extends BaseStage {
	type: "none";
}

export type DebateStage = SingleStage | MultiStage | NoneStage;