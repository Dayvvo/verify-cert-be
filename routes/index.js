const express = require('express');

const router = express.Router();

const {getUserData,uploadUserCert} = require('../controllers')

router.get('/', getUserData);

router.post('/upload', uploadUserCert);




module.exports =router;