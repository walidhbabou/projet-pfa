import React from 'react';
import Navbar from '@/components/Navbar';
import Announcements from '@/components/Announcements';

const AnnouncementsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <Announcements />
      </div>
    </div>
  );
};

export default AnnouncementsPage; 