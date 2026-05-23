const express = require('express');

const router = express.Router();

const Employee = require('../models/Employee');


// GET ALL EMPLOYEES
router.get('/', async (req, res) => {

    try {

        const employees = await Employee.find();

        res.json(employees);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: 'Server Error'
        });
    }
});


// CREATE EMPLOYEE
router.post('/', async (req, res) => {

    try {

        console.log('HEADERS:', req.headers);

        console.log('BODY:', req.body);

        if (!req.body) {

            return res.status(400).json({
                message: 'Request body missing'
            });
        }

        const employee = new Employee({

            name: req.body.name,
            email: req.body.email,
            department: req.body.department,
            designation: req.body.designation,

            status: 'active',
            score: 80,
            hrs: '0h',
            idle: '-'
        });

        await employee.save();

        res.status(201).json(employee);

    } catch (error) {

        console.log('POST ERROR:', error);

        res.status(500).json({
            message: 'Server Error'
        });
    }
});


// DELETE EMPLOYEE
router.delete('/:id', async (req, res) => {

    try {

        await Employee.findByIdAndDelete(req.params.id);

        res.json({
            message: 'Employee deleted'
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: 'Server Error'
        });
    }
});

module.exports = router;