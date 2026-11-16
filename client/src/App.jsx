import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import FlashNotification from './components/FlashNotification';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Departments from './pages/Departments';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminAnnouncementForm from './pages/AdminAnnouncementForm';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Header />
      <FlashNotification />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/departments" element={<Departments />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:id" element={<NewsDetail />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/announcements/new" element={<AdminAnnouncementForm />} />
        <Route path="/admin/announcements/:id/edit" element={<AdminAnnouncementForm />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  );
}
