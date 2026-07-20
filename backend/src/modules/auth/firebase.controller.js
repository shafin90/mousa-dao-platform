const admin = require('../../config/firebase');
const User = require('../users/models/User');
const jwt = require('jsonwebtoken');
const { respond } = require('../../utils/response');

const FALLBACK_COMPANY_ID = process.env.DEFAULT_COMPANY_ID || null;

const firebaseLogin = async (req, res, next) => {
  try {
    const { idToken, phone, name } = req.body;

    if (!idToken || !phone) {
      return respond(res, 400, null, 'idToken and phone are required');
    }

    let firebaseUser;
    try {
      firebaseUser = await admin.auth().verifyIdToken(idToken);
    } catch {
      return respond(res, 401, null, 'Invalid Firebase token');
    }

    let user = await User.findOne({
      phone,
      companyId: FALLBACK_COMPANY_ID,
    });

    if (!user) {
      const [firstName = '', ...lastParts] = (name || phone).split(' ');
      const lastName = lastParts.join(' ') || '';

      user = await User.create({
        companyId: FALLBACK_COMPANY_ID || new (require('mongoose').Types.ObjectId)(),
        email: firebaseUser.firebase?.identities?.email?.[0] || `${phone.replace(/[^0-9]/g, '')}@mousa.app`,
        phone,
        password: await require('bcryptjs').hash(idToken.slice(-20), 10),
        role: 'customer',
        profile: { firstName, lastName },
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, companyId: user.companyId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    );

    respond(res, 200, {
      user: {
        _id: user._id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        companyId: user.companyId,
        profile: user.profile,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { firebaseLogin };
