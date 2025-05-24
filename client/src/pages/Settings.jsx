import React, { useState, useEffect } from 'react';
import { userSettingsService } from '../services/userSettingsService';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setDarkMode, selectDarkMode } from '../store/slices/authSlice';

const Settings = () => {
  const [notifications, setNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [twoFactorData, setTwoFactorData] = useState({
    token: '',
    qrCode: '',
    secret: ''
  });
  console.log(twoFactorData);
  
  const [deletePassword, setDeletePassword] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const reduxDarkMode = useSelector(selectDarkMode);

  useEffect(() => {
    // Fetch user preferences from backend on mount
    const fetchPreferences = async () => {
      try {
        const res = await userSettingsService.getProfile();
        if (res.user) {
          setNotifications(res.user.notifications?.system ?? false);
          setEmailUpdates(res.user.notifications?.email ?? false);
          setDarkMode(res.user.preferences?.darkMode ?? false);
        }
      } catch (e) {}
    };
    fetchPreferences();
  }, []);

  useEffect(() => {
    // Apply dark mode to body
    if (reduxDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [reduxDarkMode]);

  const savePreferences = async (newPrefs) => {
    try {
      await userSettingsService.updateProfile(newPrefs);
      toast.success('Preferences updated');
    } catch (e) {
      toast.error('Failed to update preferences');
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setIsLoading(true);
      await userSettingsService.updateProfile({
        name: 'User Name', // Replace with actual user data
        email: 'user@example.com', // Replace with actual user data
        phone: '1234567890' // Replace with actual user data
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.message || 'Error updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      await userSettingsService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(error.message || 'Error changing password');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASetup = async () => {
    try {
      setIsLoading(true);
      const response = await userSettingsService.setup2FA();
      setTwoFactorData({
        ...twoFactorData,
        qrCode: response.qrCode,
        secret: response.secret
      });
      setShow2FAModal(true);
    } catch (error) {
      toast.error(error.message || 'Error setting up 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FAVerification = async () => {
    try {
      setIsLoading(true);
      await userSettingsService.verify2FA(twoFactorData.token);
      toast.success('2FA enabled successfully');
      setShow2FAModal(false);
      setTwoFactorData({ token: '', qrCode: '', secret: '' });
    } catch (error) {
      toast.error(error.message || 'Error verifying 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountDelete = async () => {
    try {
      setIsLoading(true);
      await userSettingsService.deleteAccount(deletePassword);
      toast.success('Account deleted successfully');
      // Redirect to login or home page
      window.location.href = '/login';
    } catch (error) {
      toast.error(error.message || 'Error deleting account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Account Settings</h2>

        <div className="divide-y">
          <div className="py-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium">User Profile</h3>
              <p className="text-sm text-gray-500">Update your personal information</p>
            </div>
            <button
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
              onClick={() => navigate('/profile/update')}
            >
              Edit Profile
            </button>
          </div>

          <div className="py-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium">Password</h3>
              <p className="text-sm text-gray-500">Change your password</p>
            </div>
            <button 
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
            >
              Change
            </button>
          </div>

          <div className="py-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-500">Add extra security to your account</p>
            </div>
            <button
              onClick={handle2FASetup}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50"
            >
              {isLoading ? 'Setting up...' : 'Enable'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Preferences</h2>

        <div className="divide-y">
          <div className="py-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium">Notifications</h3>
              <p className="text-sm text-gray-500">Receive system notifications</p>
            </div>
            <div className="relative inline-block w-12 align-middle select-none">
              <input
                type="checkbox"
                id="toggle-notifications"
                className="sr-only"
                checked={notifications}
                onChange={() => {
                  setNotifications(!notifications);
                  savePreferences({ notifications: { system: !notifications } });
                }}
              />
              <label
                htmlFor="toggle-notifications"
                className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${notifications ? 'bg-blue-500' : 'bg-gray-300'}`}
              >
                <span
                  className={`block h-6 w-6 rounded-full bg-white transform transition-transform duration-200 ease-in-out ${notifications ? 'translate-x-6' : 'translate-x-0'}`}
                ></span>
              </label>
            </div>
          </div>

          <div className="py-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium">Dark Mode</h3>
              <p className="text-sm text-gray-500">Switch to dark theme</p>
            </div>
            <div className="relative inline-block w-12 align-middle select-none">
              <input
                type="checkbox"
                id="toggle-dark"
                className="sr-only"
                checked={reduxDarkMode}
                onChange={() => {
                  dispatch(setDarkMode(!reduxDarkMode));
                  setDarkMode(!reduxDarkMode);
                  savePreferences({ preferences: { darkMode: !reduxDarkMode } });
                }}
              />
              <label
                htmlFor="toggle-dark"
                className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${reduxDarkMode ? 'bg-blue-500' : 'bg-gray-300'}`}
              >
                <span
                  className={`block h-6 w-6 rounded-full bg-white transform transition-transform duration-200 ease-in-out ${reduxDarkMode ? 'translate-x-6' : 'translate-x-0'}`}
                ></span>
              </label>
            </div>
          </div>

          <div className="py-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium">Email Updates</h3>
              <p className="text-sm text-gray-500">Receive email notifications</p>
            </div>
            <div className="relative inline-block w-12 align-middle select-none">
              <input
                type="checkbox"
                id="toggle-email"
                className="sr-only"
                checked={emailUpdates}
                onChange={() => {
                  setEmailUpdates(!emailUpdates);
                  savePreferences({ notifications: { email: !emailUpdates } });
                }}
              />
              <label
                htmlFor="toggle-email"
                className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${emailUpdates ? 'bg-blue-500' : 'bg-gray-300'}`}
              >
                <span
                  className={`block h-6 w-6 rounded-full bg-white transform transition-transform duration-200 ease-in-out ${emailUpdates ? 'translate-x-6' : 'translate-x-0'}`}
                ></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Danger Zone</h2>

        <div className="border border-red-200 rounded-md p-4 bg-red-50">
          <h3 className="font-medium text-red-700 mb-2">Delete Account</h3>
          <p className="text-sm text-red-600 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Change Password</h3>
            <div className="space-y-4">
              <input
                type="password"
                placeholder="Current Password"
                className="w-full p-2 border rounded"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              />
              <input
                type="password"
                placeholder="New Password"
                className="w-full p-2 border rounded"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                className="w-full p-2 border rounded"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Setup Two-Factor Authentication</h3>
            {twoFactorData.qrCode ? (
              <div className="space-y-4">
                <img src={twoFactorData.qrCode} alt="2FA QR Code" className="mx-auto" />
                <p className="text-sm text-gray-600 text-center">
                  Scan this QR code with your authenticator app
                </p>
                <input
                  type="text"
                  placeholder="Enter verification code"
                  className="w-full p-2 border rounded"
                  value={twoFactorData.token}
                  onChange={(e) => setTwoFactorData({ ...twoFactorData, token: e.target.value })}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShow2FAModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handle2FAVerification}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-600">Setting up 2FA...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Delete Account</h3>
            <p className="text-sm text-red-600 mb-4">
              Please enter your password to confirm account deletion
            </p>
            <div className="space-y-4">
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full p-2 border rounded"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAccountDelete}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {isLoading ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings; 