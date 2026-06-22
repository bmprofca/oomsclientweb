import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, LayoutDashboard, Activity, Users, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      navigate('/login');
    } catch (e) {
      console.error(e);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">


      {/* div Content */}
      <div className="flex-1 p-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back!</h1>
          <p className="text-gray-500 mt-1">Here's what's happening today.</p>
        </motion.div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Stats Cards */}
          <motion.div variants={item} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <h3 className="text-gray-500 text-sm font-medium">Total Orders</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">1,248</p>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-500 font-medium">+12.5%</span>
              <span className="text-gray-400 ml-2">from last month</span>
            </div>
          </motion.div>
          
          <motion.div variants={item} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <h3 className="text-gray-500 text-sm font-medium">Active Outages</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">3</p>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-red-500 font-medium">+2</span>
              <span className="text-gray-400 ml-2">from yesterday</span>
            </div>
          </motion.div>

          <motion.div variants={item} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <h3 className="text-gray-500 text-sm font-medium">System Health</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">99.9%</p>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-500 font-medium">Optimal</span>
            </div>
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-96 flex items-center justify-center"
        >
          <div className="text-center text-gray-400">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Recent activity will appear here</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
