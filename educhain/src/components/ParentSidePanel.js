import React from 'react';

const ParentSidePanel = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'performance', name: 'Performance' },
    { id: 'incidents', name: 'Incidents' },
    { id: 'nutrition', name: 'Nutrition/Wellbeing' },
    { id: 'chat', name: 'Chat Interface' },
    { id: 'profile', name: 'Profile' },
  ];

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col p-4">
      <h2 className="text-xl font-bold mb-6">Parent Menu</h2>
      <nav>
        <ul>
          {tabs.map((tab) => (
            <li key={tab.id} className="mb-2">
              <button
                className={`w-full text-left py-2 px-4 rounded-md ${activeTab === tab.id ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                onClick={() => onSelectTab(tab.id)}
              >
                {tab.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default ParentSidePanel;
