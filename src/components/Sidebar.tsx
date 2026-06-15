import { Menu, Home, FileEdit, Play, Settings, File } from "lucide-react";
import { Link } from "react-router-dom";
import { DebateStages } from "../schema";
import { Trash2 } from "lucide-react";
import { useState } from "react";

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
	onDelete: (id: string) => void;
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

export function MatchSidebar( {isFolded, matches, toggleFold, onSelect, onAdd, onDelete }: matchesProps ) {
	const [deletingId, setDeletingId] = useState<string | null>(null);

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
					color: "var(--base)"
				}}>
					赛制选择
				</label>
				<button className="btn" onClick={onAdd}>+</button>
			</div>

			<div className={`sidebar-content match-inner ${isFolded ? "folded" : ""}` }>
				{/* options */}
				<ul>
					{matches.map((match) => (
						<li 
							key={match.id}
							style={{ 
								display: "flex",
								flexDirection: "row",
								paddingRight: "15px"
							}}
							onClick={() => {onSelect(match); toggleFold();}}>
							<span style={{ flex: 1 }}className={"link"}>
								<File size={18} />
								{match.name || "未命名"}
							</span>
							<button
								onPointerDown={(e) => e.stopPropagation()} 
								onClick={(e) => {
									e.stopPropagation();
									setDeletingId(match.id);
								}}
								style={{ background: "transparent", border: "none", color: "#f43f5e", cursor: "pointer", display: "flex", alignItems: "center", padding: "4px" }}
							>
								<Trash2 className="trash" size={18} />
							</button>
						</li>
					))}
				</ul>
			</div>
			{deletingId !== null && (
				<div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
					<div style={{ background: "#1e293b", border: "1px solid #334155", padding: "24px", borderRadius: "12px", width: "320px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5)" }}>
						<h3 style={{ margin: "0 0 12px 0", color: "#f8fafc" }}>确认删除此环节？</h3>
						<p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: "0 0 20px 0" }}>该操作无法撤销，确定要将该环节从流程中移除吗？</p>
						<div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
							<button onClick={() => setDeletingId(null)} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #475569", background: "transparent", color: "#94a3b8", cursor: "pointer" }}>取消</button>
							<button onClick={() => {onDelete(deletingId as string); setDeletingId(null)}} style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#f43f5e", color: "white", cursor: "pointer" }}>确认删除</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export function PlayingMatchSidebar( {isFolded, matches, toggleFold, onSelect, onAdd }: matchesProps ) {

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
					fontWeight: "bold"
				}}>
					赛制选择
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