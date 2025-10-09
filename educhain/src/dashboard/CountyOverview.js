import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { Users, School, TrendingUp, ClipboardList } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

const PIE_COLORS = ['#3B82F6', '#EF4444', '#10B981']; // Moved from CountyDashboard.js

// Custom Tooltip for Recharts Pie Chart (to show percentage)
const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="p-3 bg-white border border-gray-200 shadow-lg rounded-lg">
                <p className="text-sm font-semibold text-gray-800">{data.name}</p>
                <p className="text-xs text-gray-600">Students: {data.value.toLocaleString()}</p>
                <p className="text-xs font-bold text-blue-600">Share: {data.percentage.toFixed(1)}%</p>
            </div>
        );
    }
    return null;
};

// Helper Component: Clickable Stat Card (Moved from CountyDashboard.js)
const StatCard = ({ title, value, icon: Icon, colorClass = 'text-blue-500', onClick, subText = null }) => (
    <div 
        onClick={onClick} 
        className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 cursor-pointer border-t-4 border-blue-500 transform hover:scale-[1.02] active:scale-[0.98] h-full"
    >
        <div className="flex items-center justify-between">
            <Icon className={`w-8 h-8 ${colorClass}`} />
            <div className="text-3xl font-extrabold text-gray-900 leading-none">
                {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
        </div>
        <div className="mt-3 text-lg font-medium text-gray-500">{title}</div>
        {subText && <p className="mt-1 text-sm text-gray-400">{subText}</p>}
    </div>
);

const CountyOverview = () => {
    const { dashboardData } = useOutletContext();

    // Data transformations for Charts (Memoized to run only when data changes)

    // Assessment Data for Bar Chart
    const assessmentChartData = useMemo(() => {
        if (!dashboardData || !dashboardData.assessments) return [];
        return Object.keys(dashboardData.assessments).map(subject => ({
            name: subject,
            'Avg Score (%)': dashboardData.assessments[subject]?.avg_percentage || 0,
        }));
    }, [dashboardData]);

    // Student Demographics Data for Pie Chart
    const genderPieData = useMemo(() => {
        if (!dashboardData || !dashboardData.students || !dashboardData.students.by_gender) return [];
        const data = dashboardData.students.by_gender;
        const total = (data.M || 0) + (data.F || 0) + (data.OTHER || 0);
        return [
            { name: 'Male', value: data.M || 0, percentage: total > 0 ? ((data.M || 0) / total) * 100 : 0 },
            { name: 'Female', value: data.F || 0, percentage: total > 0 ? ((data.F || 0) / total) * 100 : 0 },
            { name: 'Other', value: data.OTHER || 0, percentage: total > 0 ? ((data.OTHER || 0) / total) * 100 : 0 },
        ].filter(item => item.value > 0); // Only show segments with data
    }, [dashboardData]);
    
    // Subcounty Data for Area Chart
    const subcountyChartData = useMemo(() => {
        if (!dashboardData || !dashboardData.schools_per_subcounty) return [];
        return Object.keys(dashboardData.schools_per_subcounty).map(subcounty => ({
            name: subcounty,
            Schools: dashboardData.schools_per_subcounty[subcounty] || 0,
        }));
    }, [dashboardData]);

    return (
        <>
            {/* Header */}
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-gray-800">County-Wide Summary</h1>
                <p className="text-gray-500 mt-1">Data aggregated across all schools for {dashboardData?.attendance?.date || 'Today'}</p>
            </header>
            
            {/* --- 1. Key Metrics Grid --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard 
                    title="Total Students" 
                    value={dashboardData?.students?.total || 0} 
                    icon={Users} 
                    colorClass="text-indigo-500" 
                    onClick={() => console.log('Go to Student Data Page')}
                />
                <StatCard 
                    title="Active Teachers" 
                    value={dashboardData?.teachers || 0} 
                    icon={Users} 
                    colorClass="text-teal-500" 
                    onClick={() => console.log('Go to Teacher Data Page')}
                />
                <StatCard 
                    title="Schools Managed" 
                    value={dashboardData?.schools || 0} 
                    icon={School} 
                    colorClass="text-purple-500" 
                    onClick={() => console.log('Go to School List Page')}
                />
                <StatCard 
                    title="Attendance Rate" 
                    value={`${dashboardData?.attendance?.attendance_percentage || 0}%`} 
                    icon={TrendingUp} 
                    colorClass="text-green-500" 
                    subText={`Present: ${dashboardData?.attendance?.present?.toLocaleString() || 0}`}
                    onClick={() => console.log('Go to Attendance Report')}
                />
            </div>

            {/* --- 2. Charts and High-Impact Cards --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                
                {/* Student Demographics (Gender) */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Student Gender Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={genderPieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {genderPieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomPieTooltip />} />
                            <Legend layout="vertical" align="right" verticalAlign="middle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Average Assessment Scores by Subject */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Average Assessment Performance (%)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={assessmentChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" stroke="#6b7280" />
                            <YAxis domain={[0, 100]} stroke="#6b7280" />
                            <Tooltip />
                            <Bar dataKey="Avg Score (%)" fill="#4C51BF" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* --- 3. Resource Management & School Distribution --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Pending Resource Requests Card */}
                <div 
                    className="bg-red-50 p-6 rounded-xl shadow-lg border-l-8 border-red-500 hover:shadow-xl transition duration-300 cursor-pointer flex justify-between items-center"
                    onClick={() => console.log('Go to Pending Resource Requests Page')}
                >
                    <div>
                        <p className="text-2xl font-extrabold text-red-600 leading-none">
                            {dashboardData?.resource_requests?.pending?.toLocaleString() || 0}
                        </p>
                        <p className="mt-1 text-lg font-medium text-red-700">Pending Resource Requests</p>
                    </div>
                    <ClipboardList className="w-10 h-10 text-red-500" />
                </div>

                {/* Schools per Subcounty Area Chart */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Schools per Subcounty</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={subcountyChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSchools" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="#6b7280" />
                            <YAxis allowDecimals={false} stroke="#6b7280" />
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <Tooltip />
                            <Area type="monotone" dataKey="Schools" stroke="#8884d8" fillOpacity={1} fill="url(#colorSchools)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* PWD Students Card */}
            <div className="mt-6 p-6 bg-yellow-50 rounded-xl shadow-lg border-l-4 border-yellow-500">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Students with Disabilities (PWD) Overview</h3>
                <p className="text-gray-600">
                    Total PWD Students: <span className="font-bold text-yellow-700">{dashboardData?.students?.pwd?.yes?.toLocaleString() || 0}</span>. 
                    Top disability types: 
                    {dashboardData?.students?.by_disability_type && Object.keys(dashboardData.students.by_disability_type).length > 0 ? (
                        Object.entries(dashboardData.students.by_disability_type).map(([type, count]) => (
                            <span key={type} className="ml-3 inline-block bg-yellow-200 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                                {type}: {count || 0}
                            </span>
                        ))
                    ) : (
                        <span className="ml-3 text-gray-500">None reported.</span>
                    )}
                    <a href="#" className="ml-4 text-blue-500 hover:underline">View Detailed Report</a>
                </p>
            </div>
        </>
    );
};

export default CountyOverview;
