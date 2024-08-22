import pg from 'pg';

const executeQuery = async (query) => {
  const client = new pg.Client({
    user: 'postgres',
    host: 'localhost',
    database: 'project_transport',
    password: '123',
    port: 5432,
  });
  await client.connect();

  const data = await client.query(query);

  await client.end();

  return data.rows;
};

export default executeQuery;
