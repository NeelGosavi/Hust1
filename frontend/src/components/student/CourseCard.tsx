// src/components/student/CourseCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Users, PlayCircle } from 'lucide-react';

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    description: string;
    progress?: number;
    instructor?: {
      name: string;
      avatar?: string;
    };
    thumbnail?: string;
    enrolledStudents?: number;
    totalLessons?: number;
    completedLessons?: number;
    duration?: string;
    category?: string;
    isEnrolled?: boolean;
  };
  onEnroll?: () => void;
  showEnrollButton?: boolean;
  className?: string;
}

export function CourseCard({ 
  course, 
  onEnroll, 
  showEnrollButton = false,
  className = ''
}: CourseCardProps) {
  const {
    id,
    title,
    description,
    progress = 0,
    instructor,
    thumbnail,
    enrolledStudents = 0,
    totalLessons = 0,
    completedLessons = 0,
    duration,
    category,
    isEnrolled = false
  } = course;

  const isComplete = progress >= 100;

  return (
    <div className={`bg-white rounded-lg shadow hover:shadow-lg transition-all overflow-hidden ${className}`}>
      {/* Thumbnail */}
      {thumbnail && (
        <div className="aspect-video bg-gray-200 relative">
          <img 
            src={thumbnail} 
            alt={title} 
            className="w-full h-full object-cover"
          />
          {duration && (
            <span className="absolute bottom-2 right-2 px-2 py-1 bg-black/75 text-white text-xs rounded">
              {duration}
            </span>
          )}
          {category && (
            <span className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs rounded">
              {category}
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        <Link to={`/student/course/${id}`} className="block">
          <h3 className="font-semibold text-lg text-gray-900 hover:text-blue-600 transition-colors line-clamp-1">
            {title}
          </h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {description}
          </p>
        </Link>

        {/* Instructor */}
        {instructor && (
          <div className="flex items-center gap-2 mt-3">
            {instructor.avatar ? (
              <img 
                src={instructor.avatar} 
                alt={instructor.name} 
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 text-xs font-medium">
                  {instructor.name.charAt(0)}
                </span>
              </div>
            )}
            <span className="text-sm text-gray-600">{instructor.name}</span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
          {totalLessons > 0 && (
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span>{completedLessons}/{totalLessons} lessons</span>
            </div>
          )}
          {enrolledStudents > 0 && (
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{enrolledStudents}</span>
            </div>
          )}
          {duration && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{duration}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {isEnrolled && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  isComplete ? 'bg-green-500' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          {isEnrolled ? (
            <Link 
              to={`/student/course/${id}`}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <PlayCircle className="w-4 h-4" />
              {isComplete ? 'Review' : 'Continue'}
            </Link>
          ) : showEnrollButton && onEnroll ? (
            <button
              onClick={onEnroll}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              Enroll Now
            </button>
          ) : (
            <Link 
              to={`/student/course/${id}`}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              View Details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}