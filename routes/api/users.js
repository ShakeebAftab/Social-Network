const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const router = express.Router();

//  PUBLIC POST api/user/signup :: ADD NEW USER
router.post(
    '/signup',
    [
        check('firstName', 'First Name is required').not().isEmpty(),
        check('lastName', 'Last Name is required').not().isEmpty(),
        check('email', 'Valid email must be used').normalizeEmail().isEmail(),
        check('password', 'Password is required').isLength({ min: 6 }),
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ error: errors.array() });
        }
    }
);

module.exports = router;
