import React, { useState, useEffect } from 'react';
import { Home, Users, BookOpen, School, ClipboardList, TrendingUp, Menu, X } from 'lucide-react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import CountyOverview from './CountyOverview'; // Import the new overview component

const CountyDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const MAX_RETRIES = 3;

    const fetchDashboardData = async () => {
        setIsLoading(true);
        const apiUrl = '/reports/dashboard/county/'; 

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                const responseData = await axiosInstance.get(apiUrl);
                setDashboardData(responseData.data);
                setIsLoading(false);
                return; 
            } catch (error) {
                const logMessage = error.message;
                console.error(`Attempt ${attempt + 1} failed (API URL: ${apiUrl}): ${logMessage}`);
                
                if (attempt === MAX_RETRIES - 1) {
                    console.error('All attempts to fetch dashboard data failed. Displaying user error.');
                    setDashboardData(null); 
                    setIsLoading(false);
                } else {
                    const delay = Math.pow(2, attempt) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleLogout = async () => {
        const refreshToken = localStorage.getItem('refresh_token');
        try {
            if (refreshToken) {
                await axiosInstance.post('/users/logout/', { refresh: refreshToken });
            }
        } catch (error) {
            console.error("Logout failed:", error);
            // Even if API call fails, clear tokens locally for a fresh start
        } finally {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            navigate('/login'); // Redirect to login page
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-2xl">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-blue-500 border-opacity-50"></div>
                    <p className="mt-4 text-lg font-semibold text-gray-700">Loading County Dashboard Data...</p>
                </div>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="p-8 text-center text-red-500 font-bold bg-white rounded-xl shadow-md m-4">
                Error loading dashboard data. Please check the API status and network connection.
                <p className="mt-2 text-sm text-gray-600">
                    If this error persists, ensure you have a valid 'access_token' in localStorage, as required by the application's authentication setup.
                </p>
            </div>
        );
    }
    
    const NavItem = ({ icon: Icon, label, to }) => (
        <NavLink 
            to={to} 
            className={({ isActive }) => 
                `flex items-center p-3 text-sm font-semibold rounded-lg transition duration-150 mb-2
                ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`
            }
            onClick={() => {
                if (isSidebarOpen) setIsSidebarOpen(false); // Close sidebar on mobile after navigation
            }}
            end={to === '.'}
        >
            <Icon className="w-5 h-5 mr-3" />
            {label}
        </NavLink>
    );

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Mobile Menu Button */}
            <button 
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-full bg-blue-600 text-white shadow-lg"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            
            {/* Sidebar (County Navigation/Filter Panel) */}
            <div 
                className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition duration-300 ease-in-out w-64 bg-gray-800 p-6 z-40 lg:flex flex-col shadow-2xl`}
            >
                <h1 className="text-2xl font-extrabold text-white mb-6 border-b border-gray-700 pb-3">
                    County Officer
                </h1>
                <nav className="flex flex-col space-y-2">
                    <NavItem icon={Home} label="Overview" to="." />
                    <NavItem icon={School} label="Schools List" to="schools" />
                    <NavItem icon={Users} label="Student Data" to="students" />
                    <NavItem icon={BookOpen} label="Assessments" to="assessments" />
                    <NavItem icon={ClipboardList} label="Resource Mgmt" to="resources" />
                    <NavItem icon={TrendingUp} label="AI Analytics" to="ai-analytics" />
                </nav>

                {/* Subcounty Filters (Renders based on API data) */}
                <div className="mt-8 pt-4 border-t border-gray-700">
                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">Filter by Subcounty</h3>
                    {dashboardData?.schools_per_subcounty && Object.keys(dashboardData.schools_per_subcounty).map(subcounty => (
                        <div key={subcounty} className="flex items-center mb-2">
                            <input type="checkbox" id={subcounty} name={subcounty} className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500" />
                            <label htmlFor={subcounty} className="ml-2 text-sm text-gray-300">{subcounty}</label>
                        </div>
                    ))}
                    {!dashboardData?.schools_per_subcounty && (
                        <p className="text-gray-500 text-xs">No subcounty data available.</p>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 p-4 sm:p-8 overflow-y-auto relative">
                {/* Logout Button */}
                <button 
                    onClick={handleLogout} 
                    className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300"
                >
                    Logout
                </button>
                <Outlet context={{ dashboardData, fetchDashboardData }} />
            </main>
        </div>
    );
};

export default CountyDashboard;
