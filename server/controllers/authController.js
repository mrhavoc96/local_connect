const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


const signup = async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    const email = req.body.email?.toLowerCase().trim();

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const existingUser = await pool.query(
      "SELECT 1 FROM accounts WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO accounts (name, email, phone, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING account_id`,
      [name, email, phone, passwordHash]
    );

    res.status(201).json({
      message: "Signup successful",
      account_id: result.rows[0].account_id,
    });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // 1. Find user
    const result = await pool.query(
      `SELECT 
         a.account_id,
         a.name,
         a.email,
         a.password_hash,
         a.is_active,
         r.role_name
       FROM accounts a
       LEFT JOIN account_roles ar ON a.account_id = ar.account_id
       LEFT JOIN roles r ON ar.role_id = r.role_id
       WHERE a.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    // 2. Check active status
    if (!user.is_active) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 4. Generate JWT
    const token = jwt.sign(
      {
        account_id: user.account_id,
        email: user.email,
        role: user.role_name
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // 5. Send response
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        account_id: user.account_id,
        name: user.name,
        email: user.email,
        role: user.role_name
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};



module.exports = { signup , login};
