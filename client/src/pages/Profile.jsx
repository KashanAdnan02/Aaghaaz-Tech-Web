import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../utils/axios';
import UpdateProfile from './UpdateProfile';

const Profile = () => {
    const [userDetails, setUserDetails] = useState(null);
    const { user } = useSelector(state => state.auth);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const response = await api.get('/api/auth/profile');
                setUserDetails(response.data.user);
            } catch (error) {
                toast.error('Failed to fetch user details');
            }
        };

        fetchUserDetails();
    }, []);

    const refreshProfile = async () => {
        try {
            const response = await api.get('/api/auth/profile');
            setUserDetails(response.data.user);
        } catch (error) {
            toast.error('Failed to fetch user details');
        }
    };

    const handleDisable2FA = async () => {
        try {
            await api.post('/api/auth/2fa/disable');
            toast.success('Two-factor authentication disabled');
            setUserDetails({ ...userDetails, twoFactorEnabled: false });
        } catch (error) {
            toast.error('Failed to disable two-factor authentication');
        }
    };

    if (!userDetails) {
        return <div>Loading...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto p-4">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">Profile</h1>
                <button
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                    onClick={() => setShowEditModal(true)}
                >
                    Edit Profile
                </button>
            </div>
            <div className="bg-white shadow-md rounded-lg p-6">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold">Personal Information</h2>
                    <p><strong>Name:</strong> <a href="/profile">{userDetails.firstName} {userDetails.lastName}</a></p>
                    <p><strong>Email:</strong> <a href="/profile">{userDetails.email}</a></p>
                    <p><strong>Phone:</strong> {userDetails.phoneNumber}</p>
                    <p><strong>Location:</strong> {userDetails.location.city}, {userDetails.location.country}</p>
                </div>
                <div className="mb-4">
                    <h2 className="text-lg font-semibold">Professional Details</h2>
                    <p><strong>Expertise:</strong> {userDetails.expertise.join(', ')}</p>
                    <p><strong>Languages:</strong> {userDetails.languages.join(', ')}</p>
                    <p><strong>Qualification:</strong> {userDetails.qualification}</p>
                </div>
                {userDetails.twoFactorEnabled && (
                    <div className="mt-4">
                        <button
                            onClick={handleDisable2FA}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                            Disable Two-Factor Authentication
                        </button>
                    </div>
                )}
            </div>
            {/* Edit Profile Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-xl relative">
                        <button
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
                            onClick={() => setShowEditModal(false)}
                        >
                            &times;
                        </button>
                        <UpdateProfile onSuccess={() => { setShowEditModal(false); refreshProfile(); }} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile; 