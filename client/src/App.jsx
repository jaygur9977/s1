import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AnimatedBackground from './components/AnimatedBackground';
import Register from './pages/Register';
import Login from './pages/Login';
import DeleteAccount from './pages/DeleteAccount';
import Congratulations from './pages/Congratulations';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <AnimatedBackground />
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/delete" element={<DeleteAccount />} />
            <Route path="/congratulations" element={<Congratulations />} />
            <Route path="/" element={<Register />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;