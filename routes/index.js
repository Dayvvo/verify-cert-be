const express = require('express');
const router = express.Router();
const {getUserData,uploadUserCert} = require('../controllers');
const { register, login } = require('../controllers/user');


router.get('/', getUserData);

router.post('/upload', uploadUserCert);

router.post('/signup',register);

router.post('/login',login);


module.exports =router;