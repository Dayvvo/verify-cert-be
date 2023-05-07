const { validationResult } = require('express-validator');

const User = require('../models/User');
const Profile = require('../models/Profile');
const Onboard = require('../models/Onboard');

// @route    GET /onboard/user
// @desc     Get user Onboarding status
// @access   Private/Admin
const getUserOnboardStatus = async (req, res) => {
  try {
    const userOnboardStatus = await Onboard.findOne({
      user: req.params.user,
    });

    if (!userOnboardStatus) {
      return res.status(400).json({
        msg: 'No status for this user',
      });
    }

    res.json(userOnboardStatus);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @route    PUT /onboard
// @desc     Update user Onboarding status
// @access   Private/Admin
const updateOnboardStatus = async (req, res) => {
  try {
    // If errors, return errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    // If no errors
    const {
      user,
      role,
      mutualNdaSent,
      mutualNdaSigned,
      emailSetup,
      sendReceiveEmail,
      msTeamsSetup,
    } = req.body;

    // Build onboard status object
    const onboardStatusFields = {};
    onboardStatusFields.user = user;
    if (role) {
      onboardStatusFields.role = role;
    }
    if (mutualNdaSent) onboardStatusFields.mutualNdaSent = mutualNdaSent;
    if (mutualNdaSigned) onboardStatusFields.mutualNdaSigned = mutualNdaSigned;
    if (emailSetup) onboardStatusFields.emailSetup = emailSetup;
    if (sendReceiveEmail)
      onboardStatusFields.sendReceiveEmail = sendReceiveEmail;
    if (msTeamsSetup) onboardStatusFields.msTeamsSetup = msTeamsSetup;

    // Update role for user, profile and onboard collection
    const updatedRole = {
      role,
    };

    let userToUpdate = await User.findOne({
      _id: user,
    });

    let profileToUpdate = await Profile.findOne({
      user,
    });

    let onboardStatusToUpdate = await Onboard.findOne({
      user,
    });

    if (!userToUpdate && !profileToUpdate && !onboardStatusToUpdate) {
      return res.status(400).json({
        msg: 'User not found',
      });
    }

    userToUpdate = await User.findByIdAndUpdate(
      { _id: user },
      { $set: updatedRole },
      { new: true }
    );

    profileToUpdate = await Profile.findOneAndUpdate(
      { user: user },
      { $set: updatedRole },
      { new: true }
    );

    onboardStatusToUpdate = await Onboard.findOneAndUpdate(
      { user: user },
      { $set: onboardStatusFields },
      { new: true }
    );

    res.json(onboardStatusToUpdate);
  } catch (error) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

module.exports = { getUserOnboardStatus, updateOnboardStatus };
