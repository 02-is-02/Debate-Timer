import { Menu, Home, FileEdit, Play, Settings, File } from "lucide-react";
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
	onAdd: () => void;
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

export function MatchSidebar( {isFolded, matches, toggleFold, onSelect, onAdd }: matchesProps ) {

	return (
		<div style={{ overflowY: "auto" }} className={`sidebar match ${isFolded ? "folded" : ""}` }>
			<div style={{ 
				display: "flex",
				flexDirection: "row",
				justifyContent: "space-between",
				alignContent: "center"
			}}
			className="sidebar-header" >
				<label style={{ 
					width: "70%",
					display: "block",
					fontSize: "1.3rem", 
					fontWeight: "bold",
					// borderBottom: "1px solid rgb(2, 37, 94)" 
				}}>
					过往赛制
				</label>
				<button className="btn" onClick={onAdd}>+</button>
			</div>

			<div className={`sidebar-content match-inner ${isFolded ? "folded" : ""}` }>
				{/* options */}
				<ul>
					{matches.map((match) => (
						<li 
							key={match.id}
							onClick={() => {onSelect(match); toggleFold();}}>
							<span className={"link"}>
								<File size={16} />
								{match.name || "未命名"}
							</span>
						</li>
					))}
				</ul>
			</div>
		</div>
	)
}