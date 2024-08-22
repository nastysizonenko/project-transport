import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import executeQuery from '../utils/executeQuery';

const userRouter = express.Router();

const jwtSecret = 'your_jwt_secret';

const getUsersTickets = (userId) => executeQuery(`
    SELECT
        TO_CHAR(t.date, 'YYYY-MM-DD"T"HH24:MI:SS.MSZ') AS date_string,
        s1.stationname AS from_station,
        s1.coords      AS from_station_coords,
        s2.stationname AS to_station,
        s2.coords      AS to_station_coords,
        b.busnumber    AS busnumber,
        b.manufacturer AS bus_manufacturer,
        b.color        AS bus_color,
        t.seatnumber   AS seatnumber
    FROM   ticket t
        JOIN busstation s1
          ON t.fromstationid = s1.id
        JOIN busstation s2
          ON t.tostationid = s2.id
        JOIN bus b
          ON t.busnumber = b.busnumber
    WHERE  userid = ${userId};`);

// Helper function to generate JWT
function generateJWT(user) {
  return jwt.sign({ id: user.id, email: user.email }, jwtSecret, {
    expiresIn: '1h',
  });
}

// Simple JWT Middleware to protect routes
export const verifyJWT = (req, res, next) => {
  const token = req.headers['x-access-token'];

  if (!token) {
    return res.status(401).json({ auth: false, message: 'Нет токена.' });
  }

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      return res
        .status(500)
        .json({ auth: false, message: 'Не удалось аутентифицировать токен.' });
    }

    req.userId = decoded.id;
    next();
  });
};

// Registration
userRouter.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Checking if the user already exists
    const userExists = await executeQuery(
      `SELECT * from users where email='${email}';`,
    );
    if (userExists.length > 0) {
      return res.status(400).send('Такой пользователь уже существует');
    }

    // Hashing password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Inserting user into database
    await executeQuery(
      `INSERT INTO users (name, email, password) VALUES ('${name}', '${email}', '${hashedPassword}');`,
    );

    // Fetching the newly created user
    const newUser = await executeQuery(
      `SELECT id, name, email FROM users WHERE email='${email}';`,
    );

    // Generating JWT token
    const token = generateJWT(newUser[0]);

    res.status(201).json({ user: newUser[0], token });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// Authentication/Login (assuming email & password)
userRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const users = await executeQuery(
      `SELECT * from users WHERE email='${email}';`,
    );
    if (users.length === 0) {
      return res.status(404).send('Пользователь не найден.');
    }

    const user = users[0];

    const passwordIsValid = await bcrypt.compare(password, user.password);
    if (!passwordIsValid) {
      return res.status(401).send({ auth: false, token: null });
    }

    const token = generateJWT(user);

    res.status(200).send({ auth: true, token });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

userRouter.get('/profile', verifyJWT, async (req, res) => {
  try {
    const user = await executeQuery(
      `SELECT id, name, email FROM users WHERE id='${req.userId}';`,
    );
    if (!user) {
      return res.status(404).send('No user found.');
    }

    const tickets = await getUsersTickets(req.userId);

    res.status(200).json({ ...user[0], tickets });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

userRouter.get('/verify-token', verifyJWT, async (req, res) => {
  try {
    const user = await executeQuery(`SELECT id, name, email FROM users WHERE id='${req.userId}';`);
    if (user.length === 0) {
      return res.status(404).send('Пользователь не найден.');
    }

    const tickets = await getUsersTickets(req.userId);

    // Omit sensitive data
    const { password, ...userDataWithoutPassword } = user[0];

    res.status(200).json({ ...userDataWithoutPassword, tickets });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

export default userRouter;
