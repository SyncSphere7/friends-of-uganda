const express = require('express');
const router = express.Router();
const supabase = require('../config/database');

// Home/Landing page
router.get('/', async (req, res) => {
  try {
    const { data: projects, error: projectsError } = await supabase
      .from('impact_projects')
      .select('*');

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    const { data: recentProjects, error: recentError } = await supabase
      .from('impact_projects')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    const projectStats = {
      total_projects: projects?.length || 0,
      total_beneficiaries: projects?.reduce((sum, p) => sum + (p.beneficiaries || 0), 0) || 0,
      active_projects: projects?.filter(p => p.status === 'Active').length || 0
    };

    const userStatsData = {
      total_members: users?.length || 0,
      peace_ambassadors: users?.filter(u => u.interest === 'Peace Ambassador').length || 0,
      community_members: users?.filter(u => u.interest === 'Community Member').length || 0
    };

    res.render('index', {
      title: 'Friends of Uganda - Our nation, Our shared responsibility',
      page: 'home',
      stats: {
        total_projects: projectStats.total_projects,
        total_beneficiaries: projectStats.total_beneficiaries,
        active_projects: projectStats.active_projects,
        total_members: userStatsData.total_members,
        peace_ambassadors: userStatsData.peace_ambassadors,
        community_members: userStatsData.community_members
      },
      recentProjects: recentProjects || []
    });
  } catch (error) {
    console.error('Error loading home page:', error);
    res.render('index', {
      title: 'Friends of Uganda - Our nation, Our shared responsibility',
      page: 'home',
      stats: { total_projects: 0, total_beneficiaries: 0, active_projects: 0, total_members: 0, peace_ambassadors: 0, community_members: 0 },
      recentProjects: []
    });
  }
});

// Mission & Vision page
router.get('/mission', (req, res) => {
  res.render('mission', {
    title: 'Mission & Vision - Friends of Uganda',
    page: 'mission'
  });
});

// About page
router.get('/about', (req, res) => {
  res.render('about', {
    title: 'About Us - Friends of Uganda',
    page: 'about'
  });
});

// Our Team page
router.get('/team', (req, res) => {
  res.render('team', {
    title: 'Our Team - Friends of Uganda',
    page: 'team'
  });
});

// Community page
router.get('/community', async (req, res) => {
  try {
    const { data: projects, error } = await supabase
      .from('impact_projects')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6);

    res.render('community', {
      title: 'Community - Friends of Uganda',
      page: 'community',
      projects: projects || []
    });
  } catch (error) {
    console.error('Error loading community page:', error);
    res.render('community', {
      title: 'Community - Friends of Uganda',
      page: 'community',
      projects: []
    });
  }
});

// Our Impact page
router.get('/impact', async (req, res) => {
  try {
    const { data: projects, error } = await supabase
      .from('impact_projects')
      .select('*')
      .order('created_at', { ascending: false });

    const locationStatsMap = {};
    projects?.forEach(p => {
      if (p.location) {
        if (!locationStatsMap[p.location]) {
          locationStatsMap[p.location] = { location: p.location, project_count: 0, total_beneficiaries: 0 };
        }
        locationStatsMap[p.location].project_count++;
        locationStatsMap[p.location].total_beneficiaries += p.beneficiaries || 0;
      }
    });

    const locationStats = Object.values(locationStatsMap).sort((a, b) => b.total_beneficiaries - a.total_beneficiaries);

    const totals = {
      total_projects: projects?.length || 0,
      total_beneficiaries: projects?.reduce((sum, p) => sum + (p.beneficiaries || 0), 0) || 0,
      active_projects: projects?.filter(p => p.status === 'Active').length || 0,
      completed_projects: projects?.filter(p => p.status === 'Completed').length || 0
    };

    res.render('impact', {
      title: 'Our Impact - Friends of Uganda',
      page: 'impact',
      projects: projects || [],
      locationStats: locationStats || [],
      totals: totals
    });
  } catch (error) {
    console.error('Error loading impact page:', error);
    res.render('impact', {
      title: 'Our Impact - Friends of Uganda',
      page: 'impact',
      projects: [],
      locationStats: [],
      totals: { total_projects: 0, total_beneficiaries: 0, active_projects: 0, completed_projects: 0 }
    });
  }
});

// Privacy Policy page
router.get('/privacy', (req, res) => {
  res.render('privacy', {
    title: 'Privacy Policy - Friends of Uganda',
    page: 'privacy'
  });
});

module.exports = router;

