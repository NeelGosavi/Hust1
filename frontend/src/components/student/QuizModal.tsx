// src/components/student/QuizModal.tsx
import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { studentApi } from '../../api/student';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizModalProps {
  courseId: string;
  onSubmit: (answers: string[]) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export function QuizModal({ courseId, onSubmit, onClose, isOpen = true }: QuizModalProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<{ score: number; results: Array<{ correct: boolean }> } | null>(null);

  useEffect(() => {
    fetchQuizQuestions();
  }, [courseId]);

  const fetchQuizQuestions = async () => {
    try {
      // Fetch course data to get quiz questions
      const response = await studentApi.getCourse(courseId);
      const course = response.data;
      // Extract quiz questions from course data
      const quizQuestions = course.quiz || course.questions || [];
      if (quizQuestions.length > 0) {
        setQuestions(quizQuestions);
        setAnswers(new Array(quizQuestions.length).fill(''));
      } else {
        // Fallback demo questions
        setQuestions([
          {
            id: '1',
            question: 'What is the capital of France?',
            options: ['London', 'Paris', 'Berlin', 'Madrid'],
            correctAnswer: 1
          },
          {
            id: '2',
            question: 'What is 2 + 2?',
            options: ['3', '4', '5', '6'],
            correctAnswer: 1
          }
        ]);
        setAnswers(['', '']);
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...answers];
    // Backend grades by comparing the selected option TEXT to the correct answer.
    newAnswers[questionIndex] = questions[questionIndex].options[answerIndex];
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    const allAnswered = answers.every(a => a !== '');
    if (!allAnswered) {
      alert('Please answer all questions before submitting.');
      return;
    }
    onSubmit(answers);
    setSubmitted(true);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading quiz...</div>
      </div>
    );
  }

  if (!isOpen) return null;

  if (submitted && results) {
    const score = (results.results.filter(r => r.correct).length / results.results.length) * 100;
    const passed = score >= 60;

    return (
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl mx-auto">
        <div className="text-center">
          <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${passed ? 'bg-green-100' : 'bg-red-100'}`}>
            {passed ? (
              <CheckCircle className="w-10 h-10 text-green-600" />
            ) : (
              <XCircle className="w-10 h-10 text-red-600" />
            )}
          </div>
          <h2 className="text-2xl font-bold mt-4">{passed ? 'Congratulations!' : 'Keep Learning!'}</h2>
          <p className="text-gray-600 mt-2">
            You scored <span className="font-bold">{Math.round(score)}%</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {results.results.filter(r => r.correct).length} out of {results.results.length} correct
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const isAnswered = answers[currentQuestion] !== '';

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Quiz</h2>
          <p className="text-sm text-gray-500">
            Question {currentQuestion + 1} of {questions.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            {Math.round(((answers.filter(a => a !== '').length) / answers.length) * 100)}% Complete
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="mb-6">
        <p className="text-lg font-medium text-gray-900">{question.question}</p>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswerSelect(currentQuestion, index)}
            className={`w-full text-left p-3 rounded-lg border transition-all ${
              answers[currentQuestion] === option
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                answers[currentQuestion] === option
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {String.fromCharCode(65 + index)}
              </span>
              <span className="text-gray-700">{option}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrev}
          disabled={currentQuestion === 0}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <div className="flex gap-2">
          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={!isAnswered}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Quiz
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!isAnswered}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}