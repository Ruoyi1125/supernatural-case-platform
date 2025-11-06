import jwt from 'jsonwebtoken';
import { supabaseAdmin, TABLES } from '../config/supabase.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 验证用户是否存在
    const { data: user, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // 没有token时继续执行，但不设置用户信息
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 验证用户是否存在且活跃
    const { data: user, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (!error && user) {
      req.user = user;
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // 即使出错也继续执行，不阻塞请求
    next();
  }
};