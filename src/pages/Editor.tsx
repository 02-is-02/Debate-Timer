import { useNavigate } from "react-router-dom";
import { DebateStage, StageType } from "../types";
import StageBlock from "../components/StageBlock"; // 引入你刚写的积木

interface EditorProps {
	stages: DebateStage[];
	setStages: (stages: DebateStage[]) => void;
}

export default function Editor({ stages, setStages}: EditorProps) {
  const navigate = useNavigate();

  const handleAddStage = (type: StageType) => {
    const newId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    let newStage: DebateStage;
    if (type === "single") newStage = { id: newId, type: "single", title: "新单计时", timeLimit: 180 };
    else if (type === "double") newStage = { id: newId, type: type, title: "新双计时", leftTimeLimit: 240, rightTimeLimit: 240 };
	else if (type === "free" ) newStage = { id: newId, type:type, title: "新自由辩", leftTimeLimit: 240, rightTimeLimit: 240, start: "left" }
    else newStage = { id: newId, type: "none", title: "新无计时" };
    setStages([...stages, newStage]);
  };

  const handleUpdateStage = (id: string, updates: Partial<DebateStage>) => {
    setStages(stages.map(stage => stage.id === id ? { ...stage, ...updates } as DebateStage : stage));
  };

  const handleDelete = (id: string) => {
    setStages(stages.filter(stage => stage.id !== id));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("dragIndex", index.toString());
    setTimeout(() => (e.target as HTMLElement).style.opacity = "0.5", 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = "1";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = Number(e.dataTransfer.getData("dragIndex"));
    if (dragIndex === dropIndex) return;
    const newStages = [...stages];
    const [draggedItem] = newStages.splice(dragIndex, 1);
    newStages.splice(dropIndex, 0, draggedItem);
    setStages(newStages);
  };

  const handleSave = () => {
    console.log("保存的赛制：", stages);
    alert("保存成功！");
    navigate("/");
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h2>🛠️ 赛制编辑器</h2>
        <div>
          <button className="btn" onClick={() => navigate("/")} style={{ marginRight: "1rem" }}>返回</button>
          <button className="btn" onClick={handleSave} style={{ backgroundColor: "#2ecc71", color: "white", borderColor: "#27ae60" }}>保存配置</button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {stages.map((stage, index) => (
          <StageBlock
            key={stage.id}
            stage={stage}
            index={index}
            onUpdate={handleUpdateStage}
            onDelete={handleDelete}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
          />
        ))}
      </div>

      <div style={{ marginTop: "2rem", padding: "1.5rem", border: "2px dashed #ccc", borderRadius: "8px", textAlign: "center" }}>
        <h4 style={{ margin: "0 0 1rem 0", color: "#666" }}>➕ 添加新环节</h4>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <button className="btn" onClick={() => handleAddStage("single")}>+ 单计时环节</button>
          <button className="btn" onClick={() => handleAddStage("free")}>+ 互斥双计时</button>
          <button className="btn" onClick={() => handleAddStage("none")}>+ 无计时/休息</button>
        </div>
      </div>
    </div>
  );
}