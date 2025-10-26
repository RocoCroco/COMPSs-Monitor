import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import workspaces from './routes/workspaces.js';
import agents from './routes/agents.js';
import monitor from './routes/monitor.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/workspaces', workspaces);
app.use('/api/agents', agents);
app.use('/api/monitor', monitor);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`backend up on :${port}`));
