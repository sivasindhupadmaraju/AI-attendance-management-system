import api from './axios';

export const studentApi = {
  getStudents: async (search = '', department = '', semester = '') => {
    const params = {};
    if (search) params.search = search;
    if (department) params.department = department;
    if (semester) params.semester = semester;
    
    const response = await api.get('/students', { params });
    return response.data;
  },

  getStudent: async (id) => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  createStudent: async (formData) => {
    // Axios will automatically set multipart/form-data boundary when receiving FormData
    const response = await api.post('/students', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateStudent: async (id, studentData) => {
    const response = await api.put(`/students/${id}`, studentData);
    return response.data;
  },

  deleteStudent: async (id) => {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },
};
