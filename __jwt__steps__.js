/**
 * install jsonwebtoken
 * jwt.sign(payload, secret, {espiresIn:})
 * token client
 */




/***
 * how to store token in the client side
 * 1. Memory-->
 * 2. Local Storage ---> XSS
 * 3. Cookies: http only
 */




/***
 * 1. Set Cookie with http only, for development secure: false
 * 
 * 
 * 2. Cors
 * app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}))
 * 
 * 
 * 
 * 3. Client side axios setting
 */