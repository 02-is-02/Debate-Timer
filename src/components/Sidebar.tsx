import { Menu, Home, FileEdit, Play, Settings } from "lucide-react";
import { Link } from "react-router-dom";

interface menuProps {
	activeRow: string;
	isFolded: boolean;
	toggleFold: () => void;
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