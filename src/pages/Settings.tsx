import { useState, useEffect } from 'react';
import { TextField, MenuItem, Select, Button } from '@mui/material';
import { useToast } from '../utils/Context';

export default function Settings() {
	const { showToast } = useToast();
	
	const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
	const [model, setModel] = useState(localStorage.getItem('gemini_model') || 'Gemini 2.5 Flash');

	const handleSave = () => {
		localStorage.setItem('gemini_api_key', apiKey);
		localStorage.setItem('gemini_model', model);
		showToast("设置已保存", "success");
	};

	return (
		<div className='container'>
			<TextField 
				label="Gemini API Key" 
				type="password"
				value={apiKey}
				onChange={(e) => setApiKey(e.target.value)}
				placeholder="AIzaSy..."
			/>
			
			<Select 
				value={model} 
				onChange={(e) => setModel(e.target.value)}
			>
				<MenuItem value="gemini-2.5-flash">Gemini 2.5 Flash</MenuItem>
				<MenuItem value="gemini-2.5-pro">Gemini 2.5 Pro</MenuItem>
				<MenuItem value="gemini-2.0-flash">Gemini 2.0 Flash</MenuItem>
				<MenuItem value="gemini-flash-latest">Gemini Flash</MenuItem>
			</Select>

			<Button variant="contained" onClick={handleSave}>保存配置</Button>
		</div>
	);
}