import React, { useState, useRef } from 'react';
import { Upload, X, User, BookOpen, Layers, Fingerprint } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StudentForm = ({ onSubmit, onClose, isSubmitting }) => {
  const { user } = useAuth();
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState(user?.role === 'teacher' ? user.department : '');
  const [semester, setSemester] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Only image files (JPEG, PNG) are allowed.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file must be under 5MB.');
        return;
      }
      setError('');
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!studentId.trim() || !name.trim() || !department.trim() || !semester.trim()) {
      setError('All metadata fields are required.');
      return;
    }

    if (!imageFile) {
      setError('Please select or upload a student face photo.');
      return;
    }

    // Construct Form Data
    const formData = new FormData();
    formData.append('student_id', studentId.trim());
    formData.append('name', name.trim());
    formData.append('department', department.trim());
    formData.append('semester', semester.trim());
    formData.append('file', imageFile);

    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold font-outfit text-white">Enroll Student Profile</h2>
            <p className="text-xs text-slate-500 mt-0.5">Register demographic details and biometric face print.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Roll No & Full Name inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Student ID / Roll No</label>
              <div className="relative">
                <Fingerprint className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. CS2026001"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm placeholder-slate-600 outline-none transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. Aarav Mehta"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm placeholder-slate-600 outline-none transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Department & Semester inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Department</label>
              <div className="relative">
                <BookOpen className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                <select
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  disabled={user?.role === 'teacher'}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 focus:border-brand-500 rounded-xl text-sm outline-none transition-all duration-200 appearance-none text-slate-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>Select Department</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Semester</label>
              <div className="relative">
                <Layers className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                <select
                  required
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 focus:border-brand-500 rounded-xl text-sm outline-none transition-all duration-200 appearance-none text-slate-300"
                >
                  <option value="" disabled>Select Semester</option>
                  <option value="1st">1st Semester</option>
                  <option value="2nd">2nd Semester</option>
                  <option value="3rd">3rd Semester</option>
                  <option value="4th">4th Semester</option>
                  <option value="5th">5th Semester</option>
                  <option value="6th">6th Semester</option>
                  <option value="7th">7th Semester</option>
                  <option value="8th">8th Semester</option>
                </select>
              </div>
            </div>
          </div>

          {/* Photo upload dropzone */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Biometric Face Image</label>
            
            {imagePreview ? (
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center group">
                <img
                  src={imagePreview}
                  alt="Student preview"
                  className="max-w-full max-h-full object-contain"
                />
                {/* Delete button */}
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-3 right-3 p-2 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all duration-200"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={triggerFileInput}
                className="w-full aspect-[2/1] rounded-2xl border-2 border-dashed border-slate-800 hover:border-brand-500/50 bg-slate-950/40 hover:bg-slate-950/70 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group"
              >
                <div className="p-3 bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-brand-400 group-hover:border-brand-500/20 rounded-xl mb-3 transition-all duration-300">
                  <Upload className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-slate-300">Upload Face Photo</p>
                <p className="text-[10px] text-slate-600 mt-1">PNG, JPG or JPEG up to 5MB. Must be a frontal portrait.</p>
              </div>
            )}
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-transparent border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl text-sm font-medium transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-brand-600 border border-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-600/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                  Analyzing biometrics...
                </>
              ) : (
                'Enroll Profile'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentForm;
