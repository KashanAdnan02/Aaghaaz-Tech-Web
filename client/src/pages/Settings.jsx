import React, { useState } from 'react';

const Settings = () => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [emailUpdates, setEmailUpdates] = useState(true);
  
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
            <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200">
              Edit
            </button>
          </div>
          
          <div className="py-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium">Password</h3>
              <p className="text-sm text-gray-500">Change your password</p>
            </div>
            <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200">
              Change
            </button>
          </div>
          
          <div className="py-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-500">Add extra security to your account</p>
            </div>
            <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200">
              Enable
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
                onChange={() => setNotifications(!notifications)}
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
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
              />
              <label 
                htmlFor="toggle-dark"
                className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${darkMode ? 'bg-blue-500' : 'bg-gray-300'}`}
              >
                <span 
                  className={`block h-6 w-6 rounded-full bg-white transform transition-transform duration-200 ease-in-out ${darkMode ? 'translate-x-6' : 'translate-x-0'}`}
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
                onChange={() => setEmailUpdates(!emailUpdates)}
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
          <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings; 