import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Filter, UserCheck, UserX, Image as ImageIcon } from 'lucide-react';
import { studentApi } from '../api/studentApi';
import StudentForm from '../components/StudentForm';
import { useAuth } from '../context/AuthContext';


const StudentsPage = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');


  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const data = await studentApi.getStudents(search, department, semester);
      setStudents(data);
    } catch (error) {
      console.error("Error loading student directory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search input
    const delayDebounceId = setTimeout(() => {
      fetchStudents();
    }, 400);

    return () => clearTimeout(delayDebounceId);
  }, [search, department, semester]);

  const handleEnrollSubmit = async (formData) => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await studentApi.createStudent(formData);
      setIsFormOpen(false);
      fetchStudents();
    } catch (error) {
      console.error("Enrollment failed:", error);
      setErrorMessage(
        error.response?.data?.detail || 
        "Biometric enrollment failed. Face could not be registered."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async (studentIdVal) => {
    if (!window.confirm("Are you sure you want to delete this student profile? This will permanently remove their biometric data.")) {
      return;
    }
    
    try {
      await studentApi.deleteStudent(studentIdVal);
      fetchStudents();
    } catch (error) {
      console.error("Failed to delete student:", error);
      alert("Failed to delete student: " + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-white">Student Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage student database profiles and facial biometric images.</p>
        </div>
          <button
            onClick={() => {
              setErrorMessage('');
              setIsFormOpen(true);
            }}
            className="flex items-center justify-center px-5 py-2.5 bg-brand-600 border border-brand-500 hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-600/20 text-white rounded-xl text-sm font-bold transition-all duration-200"
          >
            <Plus className="mr-2 h-4 w-4" />
            Enroll Student
          </button>
      </div>


      {/* Filter Controls bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-slate-900/35 border border-slate-800 rounded-2xl">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-850 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm outline-none transition-all"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-850 focus:border-brand-500 rounded-xl text-sm outline-none transition-all text-slate-400 appearance-none"
          >
            <option value="">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Electronics">Electronics</option>
            <option value="Mechanical Engineering">Mechanical Engineering</option>
            <option value="Civil Engineering">Civil Engineering</option>
            <option value="Information Technology">Information Technology</option>
          </select>
        </div>

        <div className="relative">
          <Filter className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-850 focus:border-brand-500 rounded-xl text-sm outline-none transition-all text-slate-400 appearance-none"
          >
            <option value="">All Semesters</option>
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

      {/* Directory Table */}
      {isLoading ? (
        <div className="w-full flex justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-500 border-t-transparent"></div>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center p-16 bg-slate-900/10 border border-slate-800 rounded-2xl text-slate-500">
          <Search className="h-12 w-12 text-slate-800 mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-300">No students enrolled</p>
          <p className="text-xs text-slate-600 mt-1">Try resetting your search query or click "Enroll Student" to add profiles.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/30">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-semibold">
                <th className="px-6 py-4 w-20">Photo</th>
                <th className="px-6 py-4">Student ID / Roll</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Semester</th>
                <th className="px-6 py-4">Biometric Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>

            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(() => {
                let lastSemester = null;
                return students.map((student) => {
                  const showSemesterHeader = student.semester !== lastSemester;
                  lastSemester = student.semester;

                  return (
                    <React.Fragment key={student.id}>
                      {showSemesterHeader && (
                        <tr className="bg-slate-900/60 border-y border-slate-850">
                          <td colSpan={7} className="px-6 py-3 text-xs font-extrabold text-brand-400 tracking-wider uppercase font-outfit bg-slate-950/40">
                            {student.semester} Semester
                          </td>
                        </tr>
                      )}

                      <tr className="hover:bg-slate-800/25 transition-colors duration-150 text-slate-200">
                        <td className="px-6 py-4">
                          {student.image_path ? (
                            <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                              <img 
                                src={student.image_path} 
                                alt={student.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '';
                                  e.target.classList.add('hidden');
                                }}
                              />
                              <span className="font-semibold text-xs text-slate-500 uppercase">
                                {student.name.substring(0, 2)}
                              </span>
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-center text-slate-500">
                              <ImageIcon className="h-5 w-5" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono font-semibold text-brand-400">{student.student_id}</td>
                        <td className="px-6 py-4 font-semibold text-white">{student.name}</td>
                        <td className="px-6 py-4 text-slate-300">{student.department}</td>
                        <td className="px-6 py-4 text-slate-400">{student.semester}</td>
                        <td className="px-6 py-4">
                          {student.is_active ? (
                            <span className="inline-flex items-center text-xs font-semibold text-emerald-400 space-x-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                              <span>Active Vector</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs font-semibold text-slate-500 space-x-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-500"></span>
                              <span>Inactive</span>
                            </span>
                          )}
                        </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteStudent(student.student_id)}
                              className="p-2 text-rose-400 hover:text-white hover:bg-rose-500/10 rounded-lg border border-transparent hover:border-rose-500/20 transition-all"
                              title="Delete profile"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </td>
                      </tr>

                    </React.Fragment>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      )}

      {/* Enrollment modal */}
      {isFormOpen && (
        <StudentForm
          onSubmit={handleEnrollSubmit}
          onClose={() => setIsFormOpen(false)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default StudentsPage;
