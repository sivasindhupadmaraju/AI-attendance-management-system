import api from './axios';

export const attendanceApi = {
  recognizeFace: async (base64Image) => {
    const response = await api.post('/attendance/recognize', { image: base64Image });
    return response.data;
  },

  getTodayAttendance: async () => {
    const response = await api.get('/attendance/today');
    return response.data;
  },

  queryAttendance: async (filters = {}) => {
    const params = {};
    if (filters.startDate) params.start_date = filters.startDate;
    if (filters.endDate) params.end_date = filters.endDate;
    if (filters.status) params.status = filters.status;
    if (filters.department) params.department = filters.department;
    if (filters.studentId) params.student_id = filters.studentId;

    const response = await api.get('/attendance', { params });
    return response.data;
  },
};
