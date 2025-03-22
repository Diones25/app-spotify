import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes/router';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use(router);

const PORT = process.env.PORT || 8888;

app.listen(PORT, () => {
  console.log(`app running on http://localhost:${PORT}`);
});