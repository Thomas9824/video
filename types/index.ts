export interface User {
  id: string;
  email?: string;
  name?: string;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessCode {
  id: string;
  code: string;
  type: 'USER' | 'ADMIN';
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  duration?: number;
  thumbnailUrl?: string;
  videoUrl: string;
  cloudinaryId?: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  uploadedById?: string;
  uploadedBy?: User;
}

export interface ActivityLog {
  id: string;
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  userId?: string;
  createdAt: Date;
}

export interface LoginFormData {
  accessCode: string;
}

export interface VideoUploadData {
  title: string;
  description?: string;
  file: File;
}

export interface VideoUpdateData {
  title?: string;
  description?: string;
  isPublished?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VideoPlayerProps {
  video: Video;
  autoPlay?: boolean;
  controls?: boolean;
  className?: string;
}

export interface DashboardStats {
  totalVideos: number;
  totalUsers: number;
  totalAccessCodes: number;
  recentActivities: ActivityLog[];
} 