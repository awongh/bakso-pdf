require('dotenv').config();
const jwt = require('jsonwebtoken');

function generateToken(secretKey){
  const options = {
    expiresIn: '10 Years',
  };
  return jwt.sign({}, secretKey, options);
}

const secretKey = process.argv[2] || null;

if (secretKey !== null) {
  const token = generateToken(secretKey);
  console.log(token);
}

module.exports = generateToken;
