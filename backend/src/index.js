import CryptoJS from 'crypto-js';
import express from 'express';
import cors from 'cors';
import router from './routes/index';

const app = express();
const port = 8080;

process.on('uncaughtException', (err) => {
  console.error('There was an uncaught error', err)
})

app.listen(port, async () => {
  console.log(`Listening on port ${port}`);
});

app.use(express.json());
app.use(cors());

app.use('/api', router);
