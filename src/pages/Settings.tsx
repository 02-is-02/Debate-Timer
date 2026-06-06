import { useState } from "react";
import Sidebar from "../components/Sidebar";

export default function Settings () {
	const [isFolded, setIsFolded] = useState(false);
	
	return (
		<div className="main-container">
			<Sidebar isFolded={isFolded} toggleFold={() => setIsFolded(!isFolded)} activeRow={4}/>
		</div>
	)
}