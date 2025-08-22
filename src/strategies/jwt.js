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

const logger = require('../../utils/logger');

const User = require('../../models/User');

let JWT_SECRET = process.env.JWT_SECRET;

/**
 * Generates a JWT token for the given user.
 * 
 * @function generateToken
 * 
 * @param {User} user - The user object to generate a token for.
 * @returns {string} - The generated token.
 */
function generateToken(user) {
    const token = jwt.sign({
        _id: user._id,
    }, JWT_SECRET, { expiresIn: '1h' });

    return token;
}


async function verifyUser(decoded, done) {

    //logger.info('Verifying JWT...');
    
    if (!decoded) {
        // 401 
        logger.info('Invalid JWT data provided');
        return done(null, false);
    }
    
    logger.info(`Verifying token _id [${decoded._id}]`);
    
    try {
        let user = await User.findById(decoded._id);
        
        if (!user) {
            logger.info(`User with _id [${decoded._id}] not found`);
            return done(null, false);
        } else {
            user = await user.populate('role');
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

const strategy = new JWTStrategy(opts, verifyUser);

module.exports = {generateToken, strategy}
