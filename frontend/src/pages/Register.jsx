import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Mail, Lock, UserPlus, Check, X, ArrowRight } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Password strength calculation
  const passwordCriteria = useMemo(() => {
    return {
      hasLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  const passwordScore = useMemo(() => {
    let score = 0;
    if (passwordCriteria.hasLength) score++;
    if (passwordCriteria.hasUpper) score++;
    if (passwordCriteria.hasNumber) score++;
    if (passwordCriteria.hasSpecial) score++;
    return score;
  }, [passwordCriteria]);

  const getStrengthLabel = () => {
    if (password.length === 0) return { label: 'Empty', color: 'bg-slate-200 dark:bg-slate-700' };
    if (passwordScore <= 1) return { label: 'Weak', color: 'bg-rose-500' };
    if (passwordScore === 2 || passwordScore === 3) return { label: 'Medium', color: 'bg-amber-500' };
    return { label: 'Strong', color: 'bg-emerald-500' };
  };

  const isPasswordValid = passwordCriteria.hasLength && passwordCriteria.hasUpper && passwordCriteria.hasNumber;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isPasswordValid) {
      setErrorMessage('Please satisfy the minimum password requirements.');
      return;
    }

    setLoading(true);

    try {
      await register({ name, email, password });
      toast.success('Account created successfully! Welcome to eLabs.');
      navigate('/');
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed.');
      toast.error(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const strength = getStrengthLabel();

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-indigo-500/5 transition-all">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mb-4 shadow-sm">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Create an account
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Register as a Student to explore & book events
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 mb-6 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aarav Sharma"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aarav.student@elabs.edu"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
              />
            </div>

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Password Strength</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {strength.label}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                  <div
                    className={`rounded-full transition-colors ${
                      passwordScore >= 1 ? strength.color : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                  <div
                    className={`rounded-full transition-colors ${
                      passwordScore >= 2 ? strength.color : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                  <div
                    className={`rounded-full transition-colors ${
                      passwordScore >= 3 ? strength.color : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                  <div
                    className={`rounded-full transition-colors ${
                      passwordScore >= 4 ? strength.color : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                </div>

                {/* Criteria Checklist */}
                <div className="pt-2 grid grid-cols-2 gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    {passwordCriteria.hasLength ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>Min 8 characters</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {passwordCriteria.hasUpper ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>1 uppercase letter</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {passwordCriteria.hasNumber ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>1 number</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {passwordCriteria.hasSpecial ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>Special character</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
