import express from 'express';
import busRouter from './bus';
import busstationRouter from './busstation';
import ticketRouter from './ticket';
import userRouter from './user';

const router = express.Router();

router.use('/bus', busRouter);
router.use('/bus-station', busstationRouter);
router.use('/ticket', ticketRouter);
router.use('/user', userRouter);

export default router;
