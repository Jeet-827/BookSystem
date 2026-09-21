import User from '../models/User.js';
import { formatUser, sanitizeEmail, logAction } from '../utils/helpers.js';

// @desc    Get all users with search, role filtering, pagination
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getAdminUsers = async (req, res) => {
  try {
    const { search, role, sort = 'newest', page = 1, limit = 20 } = req.query;
    const query = {};

    if (search && typeof search === 'string' && search.trim() !== '') {
      const regex = { $regex: search.trim(), $options: 'i' };
      query.$or = [{ name: regex }, { email: regex }];
    }

    if (role && (role === 'admin' || role === 'user')) {
      query.role = role;
    }

    const sortBy = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
    const pageNum = Math.max(1, Number(page) || 1);
    const perPage = Math.max(1, Number(limit) || 20);
    const skip = (pageNum - 1) * perPage;

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query).select('-password').sort(sortBy).skip(skip).limit(perPage),
    ]);

    res.json({
      success: true,
      users: users.map(formatUser),
      currentPage: pageNum,
      totalPages: Math.ceil(total / perPage) || 1,
      totalUsers: total,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching users',
    });
  }
};

// @desc    Get single user details
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
export const getAdminUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching user' });
  }
};

// @desc    Create a new user / admin account
// @route   POST /api/admin/users
// @access  Private (Admin)
export const createAdminUser = async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    const safeEmail = sanitizeEmail(email);
    const existing = await User.findOne({ email: safeEmail });
    if (existing) {
      return res.status(409).json({ success: false, message: 'User with this email already exists' });
    }

    const user = await User.create({
      name: String(name).trim(),
      email: safeEmail,
      password: String(password),
      role: role === 'admin' ? 'admin' : 'user',
    });

    await logAction({
      admin: req.admin,
      action: 'ADMIN_CREATE_USER',
      targetType: 'User',
      targetId: user._id,
      details: { email: user.email, role: user.role },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating user',
    });
  }
};

// @desc    Update user role (promote/demote)
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be either "user" or "admin"' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Safety: Prevent demoting self if no other admins exist
    if (String(req.admin._id) === String(user._id) && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot demote the only remaining administrator',
        });
      }
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    await logAction({
      admin: req.admin,
      action: 'UPDATE_USER_ROLE',
      targetType: 'User',
      targetId: user._id,
      details: { userEmail: user.email, oldRole, newRole: role },
      req,
    });

    res.json({
      success: true,
      message: `User role updated from ${oldRole} to ${role}`,
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating user role',
    });
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
export const deleteAdminUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Safety: Prevent admin deleting their own account via user management
    if (String(req.admin._id) === String(user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own active administrator account',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    await logAction({
      admin: req.admin,
      action: 'DELETE_USER',
      targetType: 'User',
      targetId: req.params.id,
      details: { deletedEmail: user.email, role: user.role },
      req,
    });

    res.json({
      success: true,
      message: `User ${user.email} deleted successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting user',
    });
  }
};
