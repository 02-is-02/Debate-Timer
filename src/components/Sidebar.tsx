import { Menu, Home, FileEdit, Play, Settings, ChevronLeft, ChevronRight, FolderEdit } from "lucide-react";
import { Link } from "react-router-dom";
import { DebateStages } from "../types";

interface menuProps {
	activeRow: string;
	isFolded: boolean;
	toggleFold: () => void;
}

interface matchesProps {
	isFolded: boolean;
	matches: any[];
	toggleFold: () => void;
	onSelect: (item: DebateStages) => void;
}

export default function MenuSidebar( {isFolded, toggleFold, activeRow}: menuProps ) {

	return (
		<div className={`sidebar ${isFolded ? "folded" : ""}`}>
			<div className="sidebar-header" >
					<button className="btn" onClick={toggleFold}><Menu size={24} strokeWidth={2} /></button>
			</div>

			<div className="sidebar-content">
				{/* options */}
				<ul>
					<li><Link to="/" className={`link ${activeRow === "/" ? "active" : ""}`}><Home size={20} strokeWidth={2} />系统主页</Link></li>
					<li><Link to="/editor" className={`link ${activeRow === "/editor" ? "active" : ""}`}><FileEdit size={20} strokeWidth={2} />赛制编辑器</Link></li>
					<li><Link to="/runner" className={`link ${activeRow === "/runner" ? "active" : ""}`}><Play size={20} strokeWidth={2} />比赛控制台</Link></li>
					<li><Link to="/settings" className={`link ${activeRow === "/settings" ? "active" : ""}`}><Settings size={20} strokeWidth={2} />系统设置</Link></li>
				</ul>
			</div>
		</div>)
}

export function MatchSidebar( {isFolded, matches, toggleFold, onSelect}: matchesProps ) {
	const foldSign = getFoldSign(isFolded);

	return (
		<div className={`sidebar ${isFolded ? "folded" : ""}` }>
			<div className="sidebar-header" >
					<button className="btn" onClick={toggleFold}>{foldSign}</button>
			</div>

			<div style={ isFolded ? { opacity: "0" } : { opacity: "100" } } className="sidebar-content">
				{/* options */}
				<ul>
					{matches.map((match) => (
						<li 
							key={match.id}
							onClick={() => onSelect(match)}>
							<span className={"link"}>{match.name || "未命名"}</span>
						</li>
					))}
				</ul>
			</div>
		</div>
	)
}

function getFoldSign ( isFolded: boolean ) {
	if (isFolded) return (
		<ChevronRight size={20} strokeWidth={2} />
	)
	return (
		<ChevronLeft size={20} strokeWidth={2} />
	)
}