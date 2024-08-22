import express from 'express';
import executeQuery from '../utils/executeQuery';

const busRouter = express.Router();

busRouter.get('/', async (_, res) => {
  const data = await executeQuery('SELECT * from bus ORDER BY busnumber;');

  res.json(data);
});

busRouter.post('/', async (req, res) => {
  try {
    const { body } = req;

    const keys = Object.keys(body);

    const bodyForInsertion = keys.map((key) => `'${body[key]}'`).join(', ');

    await executeQuery(`insert into bus values(${bodyForInsertion});`);

    const data = await executeQuery(`SELECT * from bus where busnumber='${body.busnumber}';`);

    res.json(data[0]);
  } catch (e) {
    res.send(e);
  }
});

busRouter.get('/:busnumber', async (req, res) => {
  const { busnumber } = req.params;

  const data = await executeQuery(`SELECT * from bus where busnumber='${busnumber}';`);
  res.json(data[0]);
});

busRouter.put('/:busnumber', async (req, res) => {
  try {
    const { busnumber } = req.params;
    const { body } = req;

    const keys = Object.keys(body);

    keys.splice(0, 1);

    const updateFieldsString = keys.map((key) => `${key}='${body[key]}'`).join(', ');

    await executeQuery(`update bus set ${updateFieldsString} where busnumber='${busnumber}';`);

    const data = await executeQuery(`SELECT * from bus where busnumber='${busnumber}';`);

    res.json(data[0]);
  } catch (e) {
    res.send(e);
  }
});

busRouter.delete('/:busnumber', async (req, res) => {
  try {
    const { busnumber } = req.params;

    const data = await executeQuery(`delete from bus where busnumber='${busnumber}';`);

    res.json(data[0]);
  } catch (e) {
    res.send(e);
  }
});

export default busRouter;
