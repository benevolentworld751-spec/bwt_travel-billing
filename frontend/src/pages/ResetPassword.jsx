import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import axios from 'axios';

const ResetPassword = () => {
  const { token } = useParams(); // Gets the token from URL
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return setError('Passwords do not match');

    setLoading(true);
    try {
      // Replace with your actual API call
      await axios.post(`/api/auth/reset-password/${token}`, { password });
      alert('Password reset successful! Please log in.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Token expired or invalid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Set New Password</h2>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="password" 
                required
                className="w-full border border-gray-300 px-3 py-2 pl-10 rounded focus:outline-none focus:border-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="password" 
                required
                className="w-full border border-gray-300 px-3 py-2 pl-10 rounded focus:outline-none focus:border-blue-500"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;