import express from 'express';
import executeQuery from '../utils/executeQuery';

const busstationRouter = express.Router();

busstationRouter.get('/', async (_, res) => {
  const data = await executeQuery('SELECT * from busstation;');

  res.json(data);
});

busstationRouter.post('/', async (req, res) => {
  try {
    const { body } = req;

    const keys = Object.keys(body);

    const bodyForInsertion = keys.map((key) => `'${body[key]}'`).join(', ');

    await executeQuery(`insert into busstation values(${bodyForInsertion});`);

    res.json(null);
  } catch (e) {
    res.send(e);
  }
});

busstationRouter.get('/:id', async (req, res) => {
  const { id } = req.params;

  const data = await executeQuery(`SELECT * from busstation where id='${id}';`);
  res.json(data[0]);
});

busstationRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req;

    const keys = Object.keys(body);

    delete keys.id;

    const updateFieldsString = keys.map((key) => `${key}='${body[key]}'`).join(', ');

    await executeQuery(`update busstation set ${updateFieldsString} where id='${id}';`);

    res.json([]);
  } catch (e) {
    res.send(e);
  }
});

busstationRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const data = await executeQuery(`delete from busstation where id='${id}';`);

    res.json(data[0]);
  } catch (e) {
    res.send(e);
  }
});

export default busstationRouter;
