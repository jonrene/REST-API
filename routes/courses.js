const express = require('express');
const router = express.Router();
const { asyncHandler, authorizeUser } = require('../middleware');
const { Course, User } = require('../models');

// GET route that returns a list of courses from DB
router.get('/', asyncHandler(async (req, res) => {
    const courses = await Course.findAll({
      attributes: {exclude: ['createdAt', 'updatedAt']},
      include: {
        model: User,
        attributes: ['id', 'firstName', 'lastName', 'emailAddress']
      }
    });
    res.json(courses);
}));

// GET route that returns a specific course from database
router.get('/:id', asyncHandler(async (req, res) => {
  const course = await Course.findOne({
    attributes: {exclude: ['createdAt', 'updatedAt']},
    include: {
      model: User,
      attributes: ['id', 'firstName', 'lastName', 'emailAddress']
    },
    where: {
      id: req.params.id
    }
  });
  if (course) {
    res.json(course);
  } else {
    res.sendStatus(404); // course doesn't exist
  }
}));

// POST route that create a new course, set the Location header to the URI for the newly created course, 
// and return a 201 HTTP status code and no content.
router.post('/', authorizeUser, asyncHandler( async (req, res, next) => {
  try {
    const course = await Course.create(req.body);
    res.location('/api/courses/' + course.id)
    res.status(201).end();
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      let errorList = [];
      error.errors.map(err =>{errorList.push(err.message)})
      res.status(400).json({ error: errorList });
    } else {
      next(error);
    }
  }
}));

// PUT route that will update the corresponding course and return 
// a 204 HTTP status code and no content.
router.put('/:id', authorizeUser, asyncHandler (async (req, res, next) => {
  const user = req.currentUser;
  let course = await Course.findByPk(req.params.id, {
    include: User
  });

  if (course) {
    // check course owner matches authenticated user
    // found method to check if data was updated here https://dev.to/nedsoft/performing-crud-with-sequelize-29cf
    if (course.userId === user.id) {
      try {
        const [updated] = await Course.update(req.body, {
          where: { id: req.params.id }
        });
        if (updated) {
          res.status(204).end();
        } else {
          res.sendStatus(400);
        }
      } catch (error) {
        if (error.name === 'SequelizeValidationError') {
          let errorList = [];
          error.errors.map(err =>{errorList.push(err.message)})
          res.status(400).json({ error: errorList });
        } else {
          next(error);
        }
      }
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(404);
  }
}));

// DELETE route that will delete the corresponding 
// course and return a 204 HTTP status code and no content.
router.delete('/:id', authorizeUser, asyncHandler( async (req, res) => {
  const user = req.currentUser;
  let course = await Course.findByPk(req.params.id, {
    include: User
  });
  if (course) {
    if (course.userId === user.id) {
      await course.destroy();
      res.status(204).end();
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(404);
  }
}));






module.exports = router;