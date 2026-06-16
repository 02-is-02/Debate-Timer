import { forwardRef, useState } from "react";
import { DebateStage } from "../schema";
import { ChevronDown, ChevronUp } from "lucide-react";

interface MatchCardProps {
	m: any;
	isExpanded: boolean;
	onToggle: () => void;
	onStartMatch: () => void;
	onError?: (msg: string) => void;
}

const MatchCard = forwardRef<HTMLDivElement, MatchCardProps>(
	({ m, isExpanded, onToggle, onStartMatch, onError }, ref) => {
		const [shouldRender, setShouldRender] = useState(isExpanded);

		if (isExpanded && !shouldRender) {
			setShouldRender(true);
		}

		const handleTransitionEnd = (e: React.TransitionEvent) => {
			if (e.target === e.currentTarget && !isExpanded) {
				setShouldRender(false);
			}
		};

		return (
			<div
				ref={ref}
				className={`stage-card ${isExpanded ? "expanded" : ""}`}
				style={{
					display: "flex",
					flexDirection: "column",
					borderRadius: "12px",
					margin: 0,
					transition: "all 0.3s ease",
					overflow: "hidden",
					alignItems: "center"
				}}
			>
				<div 
					onClick={onToggle}
					style={{
						width: "100%",
						justifyContent: "space-between",
						padding: "16px 24px",
						boxSizing: "border-box", 
						cursor: "pointer", 
						display: "flex",
						alignItems: "center",
						borderBottom: isExpanded ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
						transition: "border-color 0.3s ease"
					}}
				>
					<span style={{ color: "#f8fafc", fontSize: "1.15rem", fontWeight: "500" }}>
						{m.name || "未命名赛制"}
					</span>
					{isExpanded ? (<ChevronUp />) : (<ChevronDown />)}
				</div>
				
				<div 
					onTransitionEnd={handleTransitionEnd}
					style={{
						maxHeight: isExpanded ? "450px" : "0px",
						opacity: isExpanded ? 1 : 0,
						transition: "max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-in-out",
						overflow: "hidden",
						cursor: "default"
					}}
				>
					{shouldRender && (
						<div 
							onClick={(e) => e.stopPropagation()}
							style={{ 
								display: "flex", 
								height: "450px",
								padding: "24px", 
								boxSizing: "border-box",
								gap: "40px" 
							}}
						>
							<div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
								<h3 style={{ margin: "0 0 1rem 0", fontSize: "1.2rem", fontWeight: "600", letterSpacing: "1px", color: "white", flexShrink: 0 }}>
									赛制预览
								</h3>
								
								<div 
									className="hide-scrollbar" 
									style={{ 
										flex: 1, 
										overflowY: "auto", 
										display: "flex", 
										flexDirection: "column", 
										gap: "12px",
										paddingRight: "8px" 
									}}
								>
									{(!m.stages || m.stages.length === 0) && <span style={{color: "#64748b"}}>暂无环节</span>}
									
									{m.stages?.map((stage: DebateStage, idx: number) => (
										<div 
											key={stage.id}
											style={{
												padding: "12px 16px",
												background: "rgba(0,0,0,0.2)",
												borderRadius: "8px",
												borderLeft: "4px solid #60a5fa",
												flexShrink: 0
											}}
										>
											<div style={{ fontSize: "1.1rem", fontWeight: "500", color: "white" }}>
												{idx + 1}. {stage.title}
											</div>
											<div style={{ fontSize: "0.85rem", color: "var(--std-glass)", marginTop: "4px" }}>
												{stage.type === 'single' && `${stage.timeLimit}秒`}
												{stage.type === 'double' && `正方 ${stage.leftTimeLimit}s  |  反方 ${stage.rightTimeLimit}s`}
												{stage.type === 'free' && (
													<>
														自由辩论 <br />
														正方 {stage.leftTimeLimit}s  |  反方 {stage.rightTimeLimit}s
													</>
												)}
											</div>
										</div>
									))}
								</div>
							</div>

							<div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
								<h2 style={{ fontSize: "2rem", margin: "0 0 1rem 0", color: "white", flexShrink: 0 }}>控制台</h2>
								
								<div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
									<label style={{ fontSize: "0.9rem", color: "#94a3b8" }}>辩题</label>
									<input className="glass-input" placeholder="例如：人工智能是否会取代人类" style={{ width: "100%", boxSizing: "border-box" }} />
								</div>

								<div style={{ display: "flex", gap: "20px", marginBottom: "2rem" }}>
									<div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
										<label style={{ fontSize: "0.9rem", color: "#60a5fa" }}>正方队伍</label>
										<input className="glass-input" placeholder="输入正方队名" style={{ width: "100%", boxSizing: "border-box" }} />
									</div>
									<div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
										<label style={{ fontSize: "0.9rem", color: "#f87171" }}>反方队伍</label>
										<input className="glass-input" placeholder="输入反方队名" style={{ width: "100%", boxSizing: "border-box" }} />
									</div>
								</div>

								<div style={{ marginTop: "auto", flexShrink: 0 }}>
									<button 
										className="btn-start-match" 
										style={{ 
											width: "100%",
											padding: "12px",
											fontSize: "1.1rem",
											opacity: (m.stages && m.stages.length > 0) ? 1 : 0.5,
											cursor: (m.stages && m.stages.length > 0) ? "pointer" : "not-allowed"
										}}
										onClick={() => {
											if (m.stages && m.stages.length > 0) onStartMatch();
											else {
												if (onError) onError("该赛制没有任何环节，无法启动比赛！");
											};
										}}
									>
										启动比赛
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		);
	}
);

export default MatchCard;