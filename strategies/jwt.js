/**
 * @file Defines the JWT authentication strategy for Koa/Passport. Uses bcrypt to verify passwords and returns a User object if successful.
 * @module strategies/jwt
 * @author Mohammed Fardhin Masud <masudm6@coventry.ac.uk>
 *
 * @requires bcrypt
 * @requires module:utils/logger
 * @requires module:models/User
 *
 * @exports JWTStrategy
 *
 * @see {@link module:controllers/auth} for the authentication middleware which implements this strategy.
 *
 */

const jwt = require('jsonwebtoken');

const logger = require('../utils/logger');

const User = require('../models/User');

const { JWT_SECRET } = require('../env');

function generateToken(user) {
    const token = jwt.sign({
        id: user.id,
        role: user.role,
    }, JWT_SECRET, { expiresIn: '1h' });
    
    logger.info(`Generated token for user ${user.id}: ${token}`);

    return token;
}


function verifyToken(token) {
    
    if (!token) {
        // 401 
        logger.info('No token provided');
        return null;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        logger.info(`Decoded token: ${JSON.stringify(decoded)}`);
        return decoded;
    } catch (err) {
        logger.error(`Error verifying token: ${err}`);
        return null;
    }
}


module.exports = {
    generateToken,
    verifyToken,
};
