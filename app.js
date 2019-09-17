const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");

const {
  PORT = 3000,
  NODE_ENV = "development",
  SESS_NAME = "sid",
  SESS_LIFETIME = 1000 * 60 * 60 * 2,
  SESS_SECRET = "secret"
} = process.env;

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

app.use(
  session({
    name: SESS_NAME,
    resave: false,
    saveUninitialized: false,
    secret: SESS_SECRET,
    cookie: {
      maxAge: SESS_LIFETIME,
      sameSite: true, // 'strict'
      secure: NODE_ENV === "production"
    }
  })
);

const users = [
  { id: 1, name: "Ali", email: "ali@gmail.com", password: "secret" },
  { id: 2, name: "Ashraf", email: "ashraf@gmail.com", password: "secret" }
];

const redirectLogin = (req, res, next) => {
  if (!req.session.userId) {
    res.redirect("/login");
    return;
  }
  next();
};

const redirectHome = (req, res, next) => {
  if (req.session.userId) {
    res.redirect("/home");
    return;
  }
  next();
};

app.get("/", (req, res) => {
  const { userId } = req.session;

  res.send(`
    <h1>Welcome!</h1>
    ${
      userId
        ? `
    <form method="POST" action="/logout">
        <button type="submit">Logout</button>
    </form>`
        : `
    <a href="/login">Login</a>
    <a href="/register">Register</a>
    <a href="/home">Home</a>`
    }
    `);
});

app.get("/home", redirectLogin, (req, res) => {
  const { userId } = req.session;

  const user = users.find(user => user.id === userId);

  res.send(`
        <h1>Home!</h1>
        <a href="/">Main</a>
        <ul>
            <li>Name: ${user.name}</li>
            <li>Email: ${user.email}</li>
        </ul>
    `);
});

app.get("/login", redirectHome, (req, res, next) => {
  res.send(`
        <h1>Login</h1>
        <form action="/login" method="POST">
        <input name="email" type="email" placeholder="enter your email" require />
        <input name="password" type="password" placeholder="enter your password" require />
        <input type="submit" />
        </form>
        <a href="/register">register</a>
    `);
});

app.get("/register", redirectHome, (req, res, next) => {
  res.send(`
    <h1>Register</h1>
    <form action="/register" method="POST">
        <input name="name" type="text" placeholder="enter your name" require />
        <input name="email" type="email" placeholder="enter your email" require />
        <input name="password" type="password" placeholder="enter your password" require />
        <input type="submit" />
    </form>
    <a href="/login">login</a>
`);
});

app.post("/login", redirectHome, (req, res, next) => {
  const { email, password } = req.body;

  if (email && password) {
    const user = users.find(
      user => user.email === email && user.password === password
    );

    if (user) {
      req.session.userId = user.id;
      res.redirect("/home");
      return;
    }
  }

  res.redirect("/login");
});

app.post("/register", redirectHome, (req, res, next) => {
  const { name, email, password } = req.body;
  if (name && email && password) {
    const exists = users.some(user => user.email === email);
    if (!exists) {
      const user = { id: users.length + 1, name, email, password };
      users.push(user);
      req.session.userId = user.id;
      res.redirect("/home");
      return;
    }
  }
  res.redirect("/register");
});

app.post("/logout", redirectLogin, (req, res, next) => {
  req.session.destroy(err => {
    if (err) {
      res.redirect("/home");
      return;
    }

    res.clearCookie(SESS_NAME);
    res.redirect("/login");
  });
});

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
