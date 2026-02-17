import jwt from 'jsonwebtoken'
import {TOKEN_SECRET} from '../config.js'


export function createAccessToken(payload, expiresIn = "1d") {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      TOKEN_SECRET,
      {
        expiresIn: expiresIn, 
      },
      (err, token) => {
        if (err) reject(err);
        resolve(token);
      }
    );
  });
} 