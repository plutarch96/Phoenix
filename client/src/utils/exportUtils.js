/**
 * Export data to CSV file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 * @param {Array} columns - Optional array of column names to include
 */
export const exportToCSV = (data, filename, columns = null) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from first object or use provided columns
  const headers = columns || Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    // Header row
    headers.join(','),
    // Data rows
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Handle values with commas, quotes, or newlines
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Print the current page content
 */
export const printPage = () => {
  window.print();
};

/**
 * Export clients data to CSV
 * @param {Array} clients - Array of client objects
 */
export const exportClients = (clients) => {
  const exportData = clients.map(client => ({
    'Client Number': client.client_number || '',
    'Name': client.name || '',
    'Email': client.contact_email || '',
    'Phone': client.contact_phone || '',
    'Address': client.address || '',
    'City': client.city || '',
    'State': client.state || '',
    'Zip Code': client.zip_code || '',
    'Created': client.created_at ? new Date(client.created_at).toLocaleDateString() : ''
  }));

  exportToCSV(exportData, 'clients');
};

/**
 * Export projects data to CSV
 * @param {Array} projects - Array of project objects
 */
export const exportProjects = (projects) => {
  const exportData = projects.map(project => ({
    'Project Number': project.project_number || '',
    'Client Number': project.client_number || '',
    'Project Name': project.project_name || '',
    'Description': project.description || '',
    'Status': project.status || '',
    'Test Count': project.test_count || 0,
    'Created': project.created_at ? new Date(project.created_at).toLocaleDateString() : '',
    'Updated': project.updated_at ? new Date(project.updated_at).toLocaleDateString() : ''
  }));

  exportToCSV(exportData, 'projects');
};

/**
 * Export tests data to CSV
 * @param {Array} tests - Array of test objects
 */
export const exportTests = (tests) => {
  const exportData = tests.map(test => ({
    'Test Number': test.test_number || '',
    'Title': test.title || '',
    'Type': test.test_type || '',
    'Standard': test.governing_standard || '',
    'Location': test.location || '',
    'Status': test.status || '',
    'Date': test.test_date ? new Date(test.test_date).toLocaleDateString() : '',
    'Client': test.client_name || '',
    'Description': test.description || '',
    'Created': test.created_at ? new Date(test.created_at).toLocaleDateString() : ''
  }));

  exportToCSV(exportData, 'tests');
};
