/**
 * @file Defines the JWT authentication strategy for Koa/Passport. Uses bcrypt to verify passwords and returns a User object if successful.
 * @module strategies/jwt
 * @author Mohammed Fardhin Masud <masudm6@coventry.ac.uk>
 *
 * @requires jsonwebtoken
 * @requires passport-jwt
 * @requires module:utils/logger
 * @requires module:models/User
 *
 * @exports JWTStrategy
 *
 * @see {@link module:controllers/auth} for the authentication middleware which implements this strategy.
 *
 */

const jwt = require('jsonwebtoken');
const JWTStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const logger = require('../utils/logger');

const User = require('../models/User');

let JWT_SECRET = process.env.JWT_SECRET;

function generateToken(user) {
    const token = jwt.sign({
        id: user.id,
    }, JWT_SECRET, { expiresIn: '1h' });
    
    logger.info(`Generated token for user ${user.id}: ${token}`);

    return token;
}


function verifyToken(payload, done) {
    
    if (!payload) {
        // 401 
        logger.info('No token provided');
        return done(null, false);
    }

    try {
        const decoded = jwt.verify(payload, JWT_SECRET);
        logger.info(`Decoded token: ${JSON.stringify(decoded)}`);
        const user = User.findById(decoded.id);
        
        if (!user) {
            logger.info(`User id ${decoded.id} not found`);
            return done(null, false);
        }

        logger.info(`Successfully verified user ${user.username}`);
        return done(null, user);

    } catch (error) {
        logger.error(`Error verifying user: ${error}`);
        return done(error, false);
    }
}


const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET,
};

const strategy = new JWTStrategy(opts, verifyToken);

module.exports = strategy;
