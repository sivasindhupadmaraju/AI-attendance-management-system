import api from './axios';

export const reportApi = {
  getSummary: async () => {
    const response = await api.get('/reports/summary');
    return response.data;
  },

  getDailyTrends: async (days = 7) => {
    const response = await api.get('/reports/daily-trends', { params: { days } });
    return response.data;
  },

  exportCSV: async (filters = {}) => {
    const params = {};
    if (filters.startDate) params.start_date = filters.startDate;
    if (filters.endDate) params.end_date = filters.endDate;
    if (filters.department) params.department = filters.department;
    if (filters.status) params.status = filters.status;
    if (filters.studentId) params.student_id = filters.studentId;

    try {
      // Request as blob to handle file download in frontend with authorization headers
      const response = await api.get('/reports/export', {
        params,
        responseType: 'blob',
      });
      
      // Create download link using the raw blob directly (response.data is already a Blob)
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      
      // Construct filename
      const dateStr = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `attendance_report_${dateStr}.csv`);
      
      document.body.appendChild(link);
      link.click();
      
      // Delay clean-up slightly to allow the browser to initiate the download stream
      setTimeout(() => {
        link.remove();
        window.URL.revokeObjectURL(url);
      }, 150);
    } catch (error) {
      // If server returns error, it'll be mapped as a Blob due to responseType: 'blob'
      if (error.response && error.response.data instanceof Blob) {
        const text = await error.response.data.text();
        try {
          const parsed = JSON.parse(text);
          throw new Error(parsed.detail || "Failed to download CSV report.");
        } catch (e) {
          throw new Error(text || "Failed to download CSV report.");
        }
      }
      throw error;
    }
  },
};
