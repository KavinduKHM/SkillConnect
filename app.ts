import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'SkillConnect API is running' });
});

// Routes
// TODO: Import and use routes

app.listen(PORT, () => {
  console.log(🚀 Server running on port );
});

export default app;
