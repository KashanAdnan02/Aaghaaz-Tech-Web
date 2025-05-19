import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.mjs';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      cnic,
      phoneNumber,
      dateOfBirth,
      expertise,
      profilePicture,
      location,
      languages,
      qualification,
      role
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email },
        { cnic }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email ?
          'Email already registered' :
          'CNIC already registered'
      });
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      cnic,
      phoneNumber,
      dateOfBirth,
      expertise,
      profilePicture,
      location,
      languages,
      qualification,
      role: role || 'user'
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET || '121212',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        cnic: user.cnic,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        expertise: user.expertise,
        profilePicture: user.profilePicture,
        location: user.location,
        languages: user.languages,
        qualification: user.qualification,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error registering user',
      error: error.message
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).select('+twoFactorSecret');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // If 2FA is enabled, return a temporary token and require 2FA verification
    if (user.twoFactorEnabled) {
      const tempToken = jwt.sign(
        {
          userId: user._id,
          role: user.role,
          email: user.email,
          requires2FA: true
        },
        process.env.JWT_SECRET || '121212',
        { expiresIn: '5m' } // Short-lived token for 2FA verification
      );

      return res.status(200).json({
        message: '2FA verification required',
        requires2FA: true,
        tempToken
      });
    }

    // If 2FA is not enabled, proceed with normal login
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET || '121212',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        cnic: user.cnic,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        expertise: user.expertise,
        profilePicture: user.profilePicture,
        location: user.location,
        languages: user.languages,
        qualification: user.qualification,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Verify 2FA during login
router.post('/login/verify-2fa', async (req, res) => {
  try {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Verify the temporary token
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || '121212');

    if (!decoded.requires2FA) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    const user = await User.findById(decoded.userId).select('+twoFactorSecret');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify the 2FA code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code.toString(),
      window: 6
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Generate the final authentication token
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET || '121212',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        cnic: user.cnic,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        expertise: user.expertise,
        profilePicture: user.profilePicture,
        location: user.location,
        languages: user.languages,
        qualification: user.qualification,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying 2FA', error: error.message });
  }
});

// Fetch user profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || '121212');
    const userId = decoded.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile fetched successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || '121212');
    const userId = decoded.userId;

    const { firstName, lastName, email, phoneNumber, location, languages, qualification, expertise } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user fields
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.location = location || user.location;
    user.languages = languages || user.languages;
    user.qualification = qualification || user.qualification;
    user.expertise = expertise || user.expertise;

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Change password
router.put('/change-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || '121212');
    const userId = decoded.userId;

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error changing password', error: error.message });
  }
});

// Setup two-factor authentication
router.post('/2fa/setup', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || '121212');
    const userId = decoded.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `AaghaazTech:${user.email}`
    });

    // Save secret to user
    user.twoFactorSecret = secret.base32;
    await user.save();

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    res.status(200).json({
      message: '2FA setup initiated',
      secret: secret.base32,
      qrCode
    });
  } catch (error) {
    res.status(500).json({ message: 'Error setting up 2FA', error: error.message });
  }
});

// Verify and enable 2FA
router.post('/2fa/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, '121212');
    const userId = decoded.userId;
    // console.log(userId);


    const { code: verificationToken } = req.body;

    const user = await User.findById(userId).select('twoFactorSecret');
    // console.log(user);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // console.log(verificationToken);
    // console.log(user.twoFactorSecret);

    // console.log(user.preferences.v.twoFactorSecret);
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: verificationToken.toString(),
      window: 6
    });
    // console.log(verified);
    // console.log(user.twoFactorEnabled);

    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    user.twoFactorEnabled = true;
    await user.save();

    res.status(200).json({ message: '2FA enabled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error enabling 2FA', error: error.message });
  }
});

// Disable 2FA
router.post('/2fa/disable', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || '121212');
    const userId = decoded.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled' });
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    res.status(200).json({ message: '2FA disabled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error disabling 2FA', error: error.message });
  }
});

// Delete account
router.delete('/account', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || '121212');
    const userId = decoded.userId;

    const { password } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password before deletion
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Password is incorrect' });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting account', error: error.message });
  }
});

export default router; 