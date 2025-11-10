const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const supabase = require('../config/database');
const { isAuthenticated, isAdmin, isEditor } = require('../middleware/auth');
const { validateAdminLogin, checkValidation } = require('../utils/validators');

// Admin login page
router.get('/login', (req, res) => {
  if (req.session.adminId) {
    return res.redirect('/admin/dashboard');
  }
  res.render('admin/login', {
    title: 'Admin Login - Friends of Uganda',
    page: 'admin-login'
  });
});

// Admin login handler
router.post('/login', validateAdminLogin, checkValidation, async (req, res) => {
  try {
    const { username, password } = req.body;

    const { data: user, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Create session
    req.session.adminId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;

    res.json({
      success: true,
      message: 'Login successful',
      redirect: '/admin/dashboard'
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login'
    });
  }
});

// Admin logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.json({ success: true, redirect: '/admin/login' });
  });
});

// Admin dashboard
router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    const { data: projects, error: projectsError } = await supabase
      .from('impact_projects')
      .select('*');

    const { data: recentUsers, error: recentError } = await supabase
      .from('users')
      .select('id, full_name, email, interest, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    const userStats = {
      total_users: users?.length || 0,
      peace_ambassadors: users?.filter(u => u.interest === 'Peace Ambassador').length || 0,
      community_members: users?.filter(u => u.interest === 'Community Member').length || 0,
      partners: users?.filter(u => u.interest === 'Partner').length || 0,
      sponsors: users?.filter(u => u.interest === 'Sponsor').length || 0,
      volunteers: users?.filter(u => u.interest === 'Volunteer').length || 0
    };

    const projectStats = {
      total_projects: projects?.length || 0,
      active_projects: projects?.filter(p => p.status === 'Active').length || 0,
      completed_projects: projects?.filter(p => p.status === 'Completed').length || 0,
      total_beneficiaries: projects?.reduce((sum, p) => sum + (p.beneficiaries || 0), 0) || 0
    };

    res.render('admin/dashboard', {
      title: 'Admin Dashboard - Friends of Uganda',
      page: 'admin-dashboard',
      user: req.session,
      userStats: userStats,
      projectStats: projectStats,
      recentUsers: recentUsers || []
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('admin/error', {
      title: 'Error - Admin Dashboard',
      error: error.message
    });
  }
});

// View all users
router.get('/users', isAuthenticated, isEditor, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, full_name, email, interest, created_at')
      .order('created_at', { ascending: false });

    res.render('admin/users', {
      title: 'Users - Admin Dashboard',
      page: 'admin-users',
      user: req.session,
      users: users || []
    });

  } catch (error) {
    console.error('Users list error:', error);
    res.status(500).render('admin/error', {
      title: 'Error - Admin Dashboard',
      error: error.message
    });
  }
});

// View all projects
router.get('/projects', isAuthenticated, isEditor, async (req, res) => {
  try {
    const { data: projects, error } = await supabase
      .from('impact_projects')
      .select('*')
      .order('created_at', { ascending: false });

    res.render('admin/projects', {
      title: 'Projects - Admin Dashboard',
      page: 'admin-projects',
      user: req.session,
      projects: projects || []
    });

  } catch (error) {
    console.error('Projects list error:', error);
    res.status(500).render('admin/error', {
      title: 'Error - Admin Dashboard',
      error: error.message
    });
  }
});

module.exports = router;

